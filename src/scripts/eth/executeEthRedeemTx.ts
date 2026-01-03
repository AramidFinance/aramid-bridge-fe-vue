import getBridgeContractAddressAsync from '../common/getBridgeContractAddressAsync'
import chainId2Bridge from './chainId2Bridge'
import { BrowserProvider, Contract } from 'ethers'
import { useWeb3ModalProvider } from '@web3modal/ethers/vue'
import { useAppStore } from '@/stores/app'

export const executeEthRedeemTx = async () => {
  const store = useAppStore()
  console.log('claim data:', store.state.claimData)
  if (!store.state.claimData) throw Error('store.state.claimData is empty')
  if (!store.state.destinationChain) throw Error('store.state.destinationChain is empty')
  const maxReleaseRound = store.state.claimData.maxClaimRound
  const sourceTransactionId = store.state.claimData.sourceTransactionId
  const sourceChainData = store.state.claimData.sourceChainData
  const destinationChainData = store.state.claimData.destinationChainData
  const note = store.state.claimData.note
  const signatures = store.state.claimData.signatures
  console.log(`
  maxReleaseRound: ${maxReleaseRound}
  sourceTransactionId: ${sourceTransactionId}
  sourceChainData: ${sourceChainData}
  destinationChainData: ${destinationChainData}
  note: ${note}
  signatures: ${signatures}
    `)

  const bridgeContractAddress = await getBridgeContractAddressAsync(destinationChainData.chainId)
  if (!bridgeContractAddress) throw Error('Destination chain escrow address not found')
  const bridge = chainId2Bridge(store.state.destinationChain)
  console.log('bridge contract address:', bridgeContractAddress)
  console.log('bridge contract:', bridge)
  const provider = useWeb3ModalProvider()
  if (!provider.walletProvider.value) throw Error('provider.walletProvider.value is empty')
  const walletProvider = new BrowserProvider(provider.walletProvider.value, store.state.destinationChain)
  const signer = await walletProvider.getSigner()

  const bridgeContract = new Contract(bridgeContractAddress, bridge.abi, signer)
  const tokenRelease = await bridgeContract.releaseTokens(maxReleaseRound, sourceTransactionId, sourceChainData, destinationChainData, note, signatures)
  return tokenRelease
}
