import { useAppStore } from '@/stores/app'
import { fillRouteInfo } from './fillRouteInfo'
import logger from '@/scripts/common/conditionalLogger'

export const resetSourceChainIfNotMatched = () => {
  const store = useAppStore()
  if (!store.state.publicConfiguration) return
  if (!store.state.sourceChain) return
  if (!store.state.destinationChain) return

  if (!store.state.publicConfiguration.chains2tokens[store.state.sourceChain.toString()]) return

  if (!store.state.publicConfiguration.chains2tokens[store.state.sourceChain.toString()][store.state.destinationChain.toString()]) {
    logger.debug('resetSourceChainIfNotMatched')
    store.state.sourceChain = undefined
    store.state.sourceChainConfiguration = undefined
  }
  fillRouteInfo()
}
