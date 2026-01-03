import { useAppStore } from '@/stores/app'
import getChainConfigurationSync from '../common/getChainConfigurationSync'
import { fillRouteInfo } from './fillRouteInfo'

export const fillArc200BridgeChainConfiguration = (chainId: number | undefined = undefined, _paramValue: string | string[] | undefined = undefined) => {
  const store = useAppStore()
  console.log('fillArc200BridgeChainConfiguration called')
  if (!store.state.publicConfiguration) return

  if (!chainId) chainId = 416101 // default to voi as there are only arc200 tokens there atm

  if (chainId) {
    const newDestChainId = chainId
    const newDestChainObj = getChainConfigurationSync(newDestChainId, store.state.publicConfiguration)
    if (newDestChainId && newDestChainObj) {
      //console.log('fillDestinationChainConfiguration', newDestChainId, newDestChainObj.name)
      store.state.arc200BridgeChain = newDestChainId
      store.state.arc200BridgeChainConfiguration = newDestChainObj
      store.state.arc200BridgeChainGenesis = undefined
    }
  }

  fillRouteInfo()
}
