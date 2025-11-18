import getAlgorandConfigTransaction from '../algo/getAlgorandConfigTransaction'
import type { IConfig } from '../interface/aramid/IConfig'
import type { PublicConfigurationRoot } from '../interface/mapping/PublicConfigurationRoot'
import getAppConfiguration from './getAppConfiguration'
import CryptoJS from 'crypto-js'
import getLogger from './getLogger'
import loadIPFSFile from '../ipfs/loadFile'
import { useAppStore } from '@/stores/app'
import axios from 'axios'
import logger from './conditionalLogger'

// Singleton Promise pattern to prevent multiple simultaneous loads
let loadingPromise: Promise<PublicConfigurationRoot | null> | null = null

const getPublicConfiguration = async (reload: boolean): Promise<PublicConfigurationRoot | null> => {
  const store = useAppStore()
  const loggerInstance = await getLogger()
  try {
    // If already loading, return the existing promise
    if (loadingPromise) {
      return loadingPromise
    }

    if (!reload) {
      if (store.state.publicConfiguration !== null) return store.state.publicConfiguration
      logger.debug('currentMapping', store.state.publicConfiguration)
    }

    // Create the singleton promise
    loadingPromise = (async () => {
      try {
        const appConfiguration = await getAppConfiguration()
        if (appConfiguration === null) {
          loadingPromise = null
          return null
        }

        if (appConfiguration.useFilesystemPublicConfiguration) {
          const fileMappingAxios = await axios.get('/public-configuration.json?t=' + new Date().getTime())
          const fileMapping = fileMappingAxios.data as PublicConfigurationRoot
          const copy = { ...fileMapping }
          copy.hash = CryptoJS.SHA256(JSON.stringify(fileMapping)).toString()
          loggerInstance.info(`${new Date()} Loaded configuration from localstorage. Hash: ${copy.hash}`)
          store.state.publicConfiguration = copy
          logger.debug('loading', store.state.publicConfiguration)
          loadingPromise = null
          return store.state.publicConfiguration
        }

        const controlTx = await getAlgorandConfigTransaction(appConfiguration.mainToken, appConfiguration.mainNetwork, appConfiguration.configurationAddress)
        if (!controlTx) {
          throw 'Unable to load configuration'
        }
        let note = Buffer.from(controlTx.note, 'base64').toString('utf-8')
        if (!note.startsWith('aramid-config/v1:j')) {
          throw 'Unable to load configuration'
        }
        note = note.replace('aramid-config/v1:j', '')
        const configMessage: IConfig = JSON.parse(note)
        const data = await loadIPFSFile(configMessage.ipfsHash)
        const mappingFromWeb: PublicConfigurationRoot = data
        mappingFromWeb.hash = CryptoJS.SHA256(JSON.stringify(mappingFromWeb)).toString()
        store.state.publicConfiguration = mappingFromWeb
        loggerInstance.info(`${new Date()} Loaded configuration from hash: ${mappingFromWeb.hash}`)
        logger.debug('loaded configuration from ipfs:', store.state.publicConfiguration)

        loadingPromise = null
        return mappingFromWeb
      } catch (e) {
        loggerInstance.error('error loading mapping', e)
        loadingPromise = null
        return store.state.publicConfiguration
      }
    })()

    return loadingPromise
  } catch (e) {
    loggerInstance.error('error loading mapping', e)
    loadingPromise = null
  }
  return store.state.publicConfiguration
}
export default getPublicConfiguration
