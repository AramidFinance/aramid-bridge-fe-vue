import { useAppStore } from '@/stores/app'
import { fillRouteInfo } from './fillRouteInfo'
import logger from '@/scripts/common/conditionalLogger'

export const resetDestinationTokenIfNotMatched = () => {
  const store = useAppStore()
  if (!store.state.publicConfiguration) return
  if (!store.state.sourceChain) return
  if (!store.state.destinationChain) return
  if (!store.state.sourceToken) return

  if (!store.state.publicConfiguration.chains2tokens[store.state.sourceChain.toString()]) return
  if (!store.state.publicConfiguration.chains2tokens[store.state.sourceChain.toString()][store.state.destinationChain.toString()]) return
  if (!store.state.publicConfiguration.chains2tokens[store.state.sourceChain.toString()][store.state.destinationChain.toString()][store.state.sourceToken]) return

  if (
    store.state.destinationToken &&
    !store.state.publicConfiguration.chains2tokens[store.state.sourceChain.toString()][store.state.destinationChain.toString()][store.state.sourceToken][store.state.destinationToken]
  ) {
    logger.debug('resetDestinationTokenIfNotMatched')
    store.state.destinationToken = undefined
    store.state.destinationTokenConfiguration = undefined
  }
  fillRouteInfo()
}
