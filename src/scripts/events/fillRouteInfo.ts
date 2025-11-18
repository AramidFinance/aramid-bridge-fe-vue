import { useAppStore } from '@/stores/app'
import getBridgeContractAddress from '../common/getBridgeContractAddress'
import logger from '@/scripts/common/conditionalLogger'

export const fillRouteInfo = () => {
  ////logger.debug('fillRouteInfo')
  const store = useAppStore()
  if (!store.state.publicConfiguration) {
    //logger.debug('!store.state.publicConfiguration')
    return
  }
  if (!store.state.publicConfiguration.chains2tokens) {
    //logger.debug('!store.state.publicConfiguration.chains2tokens')
    return
  }
  if (!store.state.sourceChain) {
    //logger.debug('!store.state.sourceChain')
    return
  }
  if (!store.state.destinationChain) {
    //logger.debug('!store.state.destinationChain')
    return
  }
  if (!store.state.sourceToken) {
    //logger.debug('!store.state.sourceToken')
    return
  }
  if (!store.state.destinationToken) {
    //logger.debug('!store.state.destinationToken')
    return
  }
  if (!store.state.publicConfiguration.chains2tokens[store.state.sourceChain.toString()]) {
    //logger.debug('!store.state.publicConfiguration.chains2tokens[store.state.sourceChain.toString()]')
    return
  }
  if (!store.state.publicConfiguration.chains2tokens[store.state.sourceChain.toString()][store.state.destinationChain.toString()]) {
    //logger.debug('!store.state.publicConfiguration.chains2tokens[store.state.sourceChain.toString()][store.state.destinationChain.toString()]')
    return
  }
  if (!store.state.publicConfiguration.chains2tokens[store.state.sourceChain.toString()][store.state.destinationChain.toString()][store.state.sourceToken]) {
    //logger.debug('!store.state.publicConfiguration.chains2tokens[store.state.sourceChain.toString()][store.state.destinationChain.toString()][store.state.sourceToken]')
    return
  }
  if (!store.state.publicConfiguration.chains2tokens[store.state.sourceChain.toString()][store.state.destinationChain.toString()][store.state.sourceToken][store.state.destinationToken]) {
    //logger.debug('!store.state.publicConfiguration.chains2tokens[store.state.sourceChain.toString()][store.state.destinationChain.toString()][store.state.sourceToken][store.state.destinationToken]')
    return
  }
  store.state.routeConfig =
    store.state.publicConfiguration.chains2tokens[store.state.sourceChain.toString()][store.state.destinationChain.toString()][store.state.sourceToken][store.state.destinationToken]

  const sourceBridge = getBridgeContractAddress(store.state.sourceChain, store.state.publicConfiguration)
  if (sourceBridge) {
    store.state.sourceBridgeAddress = sourceBridge
  }
  const destBridge = getBridgeContractAddress(store.state.destinationChain, store.state.publicConfiguration)
  if (destBridge) {
    store.state.destinationBridgeAddress = destBridge
  }
}
