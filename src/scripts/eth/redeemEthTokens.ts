import { useAppStore } from '@/stores/app'
import getAppKit from './getAppKit'
import { executeEthRedeemTx } from './executeEthRedeemTx'

export const redeemEthTokens = async () => {
  const store = useAppStore()
  if (!store.state.destinationChainConfiguration) {
    throw Error('Destination chain not loaded properly')
  }
  //   if (store.state.destinationChain != currentMetamaskChain) {
  //     throw Error(`Please Switch the chain to ${store.state.destinationChainConfiguration.name} network in your connected wallet`)
  //   }

  const provider = getAppKit()
  if (!provider) throw Error('Please connect to your wallet')

  if (!store.state.claimData) throw Error('Claim failed to load')
  return executeEthRedeemTx()
}
