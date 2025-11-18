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
    // FIX: Check reload flag FIRST before checking cache or loading promise
    // This ensures reload=true always forces a fresh load
    if (!reload) {
      // For non-reload requests, return cached configuration if available
      if (store.state.publicConfiguration !== null) {
        logger.debug('Returning cached configuration', store.state.publicConfiguration)
        return store.state.publicConfiguration
      }

      // For non-reload requests, return existing loading promise if one exists
      if (loadingPromise) {
        logger.debug('Returning existing loading promise for non-reload request')
        return loadingPromise
      }
    } else {
      // For reload=true, always clear any existing promise to force a fresh load
      // This prevents the race condition where reload=true returns stale data
      if (loadingPromise) {
        logger.debug('Clearing existing loading promise for reload request')
        loadingPromise = null
      }
    }

    // Create the singleton promise with timeout protection
    const loadPromise = (async () => {
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

    // Add 30-second timeout protection using Promise.race
    const timeoutPromise = new Promise<PublicConfigurationRoot | null>((_, reject) => {
      setTimeout(() => {
        loggerInstance.error('Configuration loading timeout after 30 seconds')
        loadingPromise = null
        reject(new Error('Configuration loading timeout after 30 seconds'))
      }, 30000)
    })

    // Race between the load operation and timeout
    loadingPromise = Promise.race([loadPromise, timeoutPromise]).catch((error) => {
      loggerInstance.error('Configuration loading failed:', error)
      loadingPromise = null
      // Return cached configuration if available, otherwise null
      return store.state.publicConfiguration
    })

    return loadingPromise
  } catch (e) {
    loggerInstance.error('error loading mapping', e)
    loadingPromise = null
  }
  return store.state.publicConfiguration
}
export default getPublicConfiguration
