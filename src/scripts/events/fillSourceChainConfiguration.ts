import { useAppStore } from '@/stores/app'
import getChainConfigurationSync from '../common/getChainConfigurationSync'
import { fillRouteInfo } from './fillRouteInfo'
import { useConfigStore } from '@/stores/config'
import logger from '@/scripts/common/conditionalLogger'

export const fillSourceChainConfiguration = (chainId: number | undefined = undefined, paramValue: string | string[] | undefined = undefined) => {
  const store = useAppStore()
  if (!store.state.publicConfiguration) return
  if (chainId) {
    const chain = chainId
    const chainObj = getChainConfigurationSync(chain, store.state.publicConfiguration)
    if (chain && chainObj) {
      //logger.debug('fillSourceChainConfiguration', chain, chainObj.name)
      store.state.sourceChain = chain
      store.state.sourceChainConfiguration = chainObj
      store.state.sourceChainGenesis = undefined
    }
  } else if (!store.state.destinationChain && paramValue) {
    //logger.debug("route.params['sourceChain']", paramValue)
    let chainFromPath = Object.values(store.state.publicConfiguration.chains).find((c) => c.name == paramValue)?.chainId
    if (!chainFromPath) {
      const keys = Object.keys(store.state.publicConfiguration.chains2tokens)
      keys.sort()
      chainFromPath = Number(keys[0])
    }

    const chain = Number(chainFromPath)
    const chainObj = getChainConfigurationSync(chain, store.state.publicConfiguration)
    if (chain && chainObj) {
      //logger.debug('fillSourceChainConfiguration', chain, chainObj.name)
      store.state.sourceChain = chain
      store.state.sourceChainConfiguration = chainObj
      store.state.sourceChainGenesis = undefined
    }
  } else if (!store.state.destinationChain) {
    const configStore = useConfigStore()
    let chain: number = 0
    if (configStore.state.initChainFrom) {
      // check if route exists
      if (store.state.publicConfiguration.chains2tokens[configStore.state.initChainFrom]) {
        chain = configStore.state.initChainFrom
      }
    }
    if (chain == 0) {
      const keys = Object.keys(store.state.publicConfiguration.chains2tokens)
      keys.sort()
      chain = Number(keys[0])
    }
    const chainObj = getChainConfigurationSync(chain, store.state.publicConfiguration)
    if (chain && chainObj) {
      //logger.debug('fillSourceChainConfiguration', chain, chainObj.name)
      store.state.sourceChain = chain
      store.state.sourceChainConfiguration = chainObj
      store.state.sourceChainGenesis = undefined
    }
  } else {
    // we have already destination chain defined, so we should match to it
    const configStore = useConfigStore()
    let chain: number = 0
    if (configStore.state.initChainFrom) {
      // check if route exists
      if (store.state.publicConfiguration.chains2tokens[configStore.state.initChainFrom]) {
        chain = configStore.state.initChainFrom
      }
    }
    if (chain == 0) {
      const keys = Object.keys(store.state.publicConfiguration.chains2tokens[store.state.destinationChain.toString()])
      keys.sort()
      chain = Number(keys[0])
    }
    const chainObj = getChainConfigurationSync(chain, store.state.publicConfiguration)
    if (chain && chainObj) {
      //logger.debug('fillSourceChainConfiguration', chain, chainObj.name)
      store.state.sourceChain = chain
      store.state.sourceChainConfiguration = chainObj
      store.state.sourceChainGenesis = undefined
    }
  }
  fillRouteInfo()
}
