import { useAppStore } from '@/stores/app'
import { fillRouteInfo } from './fillRouteInfo'
import logger from '@/scripts/common/conditionalLogger'

export const resetSourceTokenIfNotMatched = () => {
  const store = useAppStore()
  // logger.debug(
  //   'resetSourceTokenIfNotMatched swap?',
  //   store.state.sourceChainConfiguration?.name,
  //   store.state.destinationChainConfiguration?.name,
  //   store.state.destinationTokenConfiguration?.name,
  //   store.state.sourceTokenConfiguration?.name
  // )

  if (!store.state.publicConfiguration) return
  if (!store.state.sourceChain) return
  if (!store.state.destinationChain) return
  if (!store.state.sourceToken) return
  if (!store.state.destinationToken) return

  if (!store.state.publicConfiguration.chains2tokens[store.state.sourceChain.toString()]) return
  if (!store.state.publicConfiguration.chains2tokens[store.state.sourceChain.toString()][store.state.destinationChain.toString()]) return
  if (store.state.publicConfiguration.chains2tokens[store.state.sourceChain.toString()][store.state.destinationChain.toString()][store.state.sourceToken]) {
    if (!store.state.publicConfiguration.chains2tokens[store.state.sourceChain.toString()][store.state.destinationChain.toString()][store.state.sourceToken][store.state.destinationToken]) {
      //logger.debug('resetSourceTokenIfNotMatched')
      store.state.sourceToken = undefined
      store.state.sourceTokenConfiguration = undefined
    }
  } else {
    if (
      store.state.publicConfiguration.chains2tokens[store.state.sourceChain.toString()][store.state.destinationChain.toString()][store.state.destinationToken] &&
      store.state.publicConfiguration.chains2tokens[store.state.sourceChain.toString()][store.state.destinationChain.toString()][store.state.destinationToken][store.state.sourceToken]
    ) {
      // source and dest chains swapped
      //logger.debug('resetSourceTokenIfNotMatched swap')
      const tmp = store.state.destinationToken
      const tmpObj = store.state.destinationTokenConfiguration
      store.state.destinationToken = store.state.sourceToken
      store.state.destinationTokenConfiguration = store.state.sourceTokenConfiguration
      store.state.sourceToken = tmp
      store.state.sourceTokenConfiguration = tmpObj
    }
  }
  fillRouteInfo()
}
