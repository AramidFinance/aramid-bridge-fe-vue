import { useAppStore } from '@/stores/app'
import { useConfigStore } from '@/stores/config'
import getChainConfigurationSync from '../common/getChainConfigurationSync'
import { fillRouteInfo } from './fillRouteInfo'

export const fillDestinationChainConfiguration = (chainId: number | undefined = undefined, paramValue: string | string[] | undefined = undefined) => {
  const store = useAppStore()

  if (!store.state.publicConfiguration) return
  if (!store.state.sourceChain) return

  if (chainId) {
    const newDestChainId = chainId
    const newDestChainObj = getChainConfigurationSync(newDestChainId, store.state.publicConfiguration)
    if (newDestChainId && newDestChainObj) {
      //console.log('fillDestinationChainConfiguration', newDestChainId, newDestChainObj.name)
      store.state.destinationChain = newDestChainId
      store.state.destinationChainConfiguration = newDestChainObj
      store.state.destinationChainGenesis = undefined
    }
  } else if (paramValue) {
    let chainFromPath = Object.values(store.state.publicConfiguration.chains).find((c) => c.name == paramValue)?.chainId
    if (!chainFromPath) {
      const keys = Object.keys(store.state.publicConfiguration.chains2tokens[store.state.sourceChain])
      keys.sort()
      chainFromPath = Number(keys[0])
    }
    const newDestChainId = chainFromPath
    const newDestChainObj = getChainConfigurationSync(newDestChainId, store.state.publicConfiguration)
    if (newDestChainId && newDestChainObj) {
      //console.log('fillDestinationChainConfiguration', newDestChainId, newDestChainObj.name)
      store.state.destinationChain = newDestChainId
      store.state.destinationChainConfiguration = newDestChainObj
      store.state.destinationChainGenesis = undefined
    }
  } else {
    const configStore = useConfigStore()
    let newDestChainId: number = 0
    if (configStore.state.initChainTo) {
      // check if route exists
      if (store.state.publicConfiguration.chains2tokens[store.state.sourceChain] && store.state.publicConfiguration.chains2tokens[store.state.sourceChain][configStore.state.initChainTo]) {
        newDestChainId = configStore.state.initChainTo
      }
    }
    if (newDestChainId == 0) {
      const keys = Object.keys(store.state.publicConfiguration.chains2tokens[store.state.sourceChain])
      keys.sort()
      newDestChainId = Number(keys[0])
    }
    const newDestChainObj = getChainConfigurationSync(newDestChainId, store.state.publicConfiguration)
    if (newDestChainId && newDestChainObj) {
      //console.log('fillDestinationChainConfiguration', newDestChainId, newDestChainObj.name)
      store.state.destinationChain = newDestChainId
      store.state.destinationChainConfiguration = newDestChainObj
      store.state.destinationChainGenesis = undefined
    }
  }

  fillRouteInfo()
}
