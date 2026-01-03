import { useAppStore } from '@/stores/app'
import getToken from '../common/getToken'

export const fillArc200BridgeTokenConfiguration = (tokenId: string | undefined = undefined, _paramValue: string | string[] | undefined = undefined) => {
  const store = useAppStore()
  if (!store.state.publicConfiguration) return
  if (!store.state.arc200BridgeChain) return

  if (tokenId) {
    const newSourceTokenId = tokenId
    const tokenConfiguration = getToken(store.state.arc200BridgeChain, newSourceTokenId, store.state.publicConfiguration)
    console.log('fillArc200BridgeTokenConfiguration', store.state.arc200BridgeChain, newSourceTokenId, tokenConfiguration)
    if (tokenConfiguration) {
      //console.log('fillInSourceTokenConfiguration', store.state.sourceChain, store.state.destinationChain)

      store.state.arc200BridgeToken = newSourceTokenId
      store.state.arc200BridgeTokenConfiguration = tokenConfiguration
    }
  }
}
