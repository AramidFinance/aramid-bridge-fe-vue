import { useAppStore } from '@/stores/app'
import getToken from '../common/getToken'
import { fillRouteInfo } from './fillRouteInfo'
import { useConfigStore } from '@/stores/config'
import logger from '@/scripts/common/conditionalLogger'

export const fillSourceTokenConfiguration = (tokenId: string | undefined = undefined, paramValue: string | string[] | undefined = undefined) => {
  const store = useAppStore()
  if (!store.state.publicConfiguration) return
  if (!store.state.sourceChain) return
  if (!store.state.destinationChain) return
  if (!store.state.sourceChainConfiguration) return
  if (!store.state.publicConfiguration.chains2tokens) return

  if (
    store.state.destinationToken &&
    (!store.state.publicConfiguration.chains2tokens[store.state.destinationChain.toString()] ||
      !store.state.publicConfiguration.chains2tokens[store.state.destinationChain.toString()][store.state.sourceChain] ||
      !store.state.publicConfiguration.chains2tokens[store.state.destinationChain.toString()][store.state.sourceChain][store.state.destinationToken])
  ) {
    store.state.destinationToken = undefined
    store.state.destinationTokenConfiguration = undefined
  }

  if (tokenId) {
    const newSourceTokenId = tokenId
    const tokenConfiguration = getToken(store.state.sourceChain, newSourceTokenId, store.state.publicConfiguration)
    if (tokenConfiguration) {
      //logger.debug('fillInSourceTokenConfiguration', store.state.sourceChain, store.state.destinationChain)

      store.state.sourceToken = newSourceTokenId
      store.state.sourceTokenConfiguration = tokenConfiguration
    }
  } else if (store.state.destinationToken) {
    const sourceTokens = Object.keys(store.state.publicConfiguration.chains2tokens[store.state.destinationChain.toString()][store.state.sourceChain][store.state.destinationToken])
    sourceTokens.sort()

    const newSourceTokenId = tokenId ? tokenId : sourceTokens[0]
    const tokenConfiguration = getToken(store.state.sourceChain, newSourceTokenId, store.state.publicConfiguration)
    if (tokenConfiguration) {
      //logger.debug('fillInSourceTokenConfiguration', store.state.sourceChain, store.state.destinationChain)

      store.state.sourceToken = newSourceTokenId
      store.state.sourceTokenConfiguration = tokenConfiguration
    }
  } else if (paramValue) {
    let tokenFromPath = Object.values(store.state.publicConfiguration.chains[store.state.sourceChain.toString()].tokens).find((c) => c.name == paramValue)?.tokenId
    if (!tokenFromPath) {
      if (
        !store.state.publicConfiguration.chains2tokens[store.state.sourceChain.toString()] ||
        !store.state.publicConfiguration.chains2tokens[store.state.sourceChain.toString()][store.state.destinationChain.toString()]
      ) {
        return
      }
      const sourceTokens = Object.keys(store.state.publicConfiguration.chains2tokens[store.state.sourceChain.toString()][store.state.destinationChain.toString()])
      sourceTokens.sort()
      tokenFromPath = sourceTokens[0]
    }
    const newSourceTokenId = tokenFromPath
    const tokenConfiguration = getToken(store.state.sourceChain, newSourceTokenId, store.state.publicConfiguration)
    if (tokenConfiguration) {
      //logger.debug('fillInSourceTokenConfiguration', store.state.sourceChain, store.state.destinationChain)

      store.state.sourceToken = newSourceTokenId
      store.state.sourceTokenConfiguration = tokenConfiguration
    }
  } else {
    if (
      store.state.publicConfiguration.chains2tokens[store.state.sourceChain.toString()] &&
      store.state.publicConfiguration.chains2tokens[store.state.sourceChain.toString()][store.state.destinationChain]
    ) {
      const configStore = useConfigStore()
      let newSourceTokenId: string = ''
      if (configStore.state.initTokenFrom) {
        // check if route exists
        if (store.state.publicConfiguration.chains2tokens[store.state.sourceChain.toString()][store.state.destinationChain.toString()][configStore.state.initTokenFrom]) {
          newSourceTokenId = configStore.state.initTokenFrom
        }
      }
      if (newSourceTokenId == '') {
        const sourceTokens = Object.keys(store.state.publicConfiguration.chains2tokens[store.state.sourceChain.toString()][store.state.destinationChain])
        sourceTokens.sort()
        newSourceTokenId = sourceTokens[0]
      }
      const tokenConfiguration = getToken(store.state.sourceChain, newSourceTokenId, store.state.publicConfiguration)
      if (tokenConfiguration) {
        //logger.debug('fillInSourceTokenConfiguration', store.state.sourceChain, store.state.destinationChain)

        store.state.sourceToken = newSourceTokenId
        store.state.sourceTokenConfiguration = tokenConfiguration
      }
    }
  }
  fillRouteInfo()
}
