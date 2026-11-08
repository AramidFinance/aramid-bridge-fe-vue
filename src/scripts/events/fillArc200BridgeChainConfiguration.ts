import { useAppStore } from '@/stores/app'
import getChainConfigurationSync from '../common/getChainConfigurationSync'
import { fillRouteInfo } from './fillRouteInfo'

const DEFAULT_ARC200_CHAIN = 416101

export const fillArc200BridgeChainConfiguration = (chainId: number | undefined = undefined, _paramValue: string | string[] | undefined = undefined) => {
  const store = useAppStore()
  console.log('fillArc200BridgeChainConfiguration called')
  if (!store.state.publicConfiguration) return

  // default to the chain already selected (e.g. from the route), else Voi as there are only arc200
  // tokens there atm; a chain without configuration falls back to Voi too, so chain and configuration agree
  if (!chainId) chainId = store.state.arc200BridgeChain ?? DEFAULT_ARC200_CHAIN
  if (!getChainConfigurationSync(chainId, store.state.publicConfiguration)) chainId = DEFAULT_ARC200_CHAIN

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
