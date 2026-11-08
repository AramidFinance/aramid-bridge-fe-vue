import { useAppStore } from '@/stores/app'
import getChainConfigurationSync from '../common/getChainConfigurationSync'
import { fillRouteInfo } from './fillRouteInfo'

/** The ARC200 chain used when none is selected or the selected one has no configuration (only Voi has arc200 tokens atm). */
export const DEFAULT_ARC200_CHAIN = 416101

export const fillArc200BridgeChainConfiguration = (chainId: number | undefined = undefined, _paramValue: string | string[] | undefined = undefined) => {
  const store = useAppStore()
  console.log('fillArc200BridgeChainConfiguration called')
  if (!store.state.publicConfiguration) return

  // default to the chain already selected (e.g. from the route); a chain without configuration falls
  // back to the default chain, so chain id and configuration always agree
  let selectedChainId = chainId || store.state.arc200BridgeChain || DEFAULT_ARC200_CHAIN
  let configuration = getChainConfigurationSync(selectedChainId, store.state.publicConfiguration)
  if (!configuration) {
    selectedChainId = DEFAULT_ARC200_CHAIN
    configuration = getChainConfigurationSync(selectedChainId, store.state.publicConfiguration)
  }
  if (configuration) {
    if (store.state.arc200BridgeChain !== selectedChainId) {
      // tokens are per chain: drop the selection made for another chain
      store.state.arc200BridgeToken = undefined
      store.state.arc200BridgeTokenConfiguration = undefined
      store.state.arc200BridgeAmount = ''
      store.state.arc200BridgeAmountFormatted = ''
    }
    store.state.arc200BridgeChain = selectedChainId
    store.state.arc200BridgeChainConfiguration = configuration
    store.state.arc200BridgeChainGenesis = undefined
  }

  fillRouteInfo()
}
