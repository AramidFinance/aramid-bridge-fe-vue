import getBridgeContractAddressAsync from '../common/getBridgeContractAddressAsync'
import chainId2Bridge from './chainId2Bridge'
import { BrowserProvider, Contract } from 'ethers'
import { useWeb3ModalProvider } from '@web3modal/ethers/vue'
import { useAppStore } from '@/stores/app'
import BigNumber from 'bignumber.js'

export const executeEthLockNativeTx = async () => {
  const store = useAppStore()

  if (!store.state.sourceChain) throw Error('store.state.sourceChain is empty')
  if (!store.state.sourceChainConfiguration) throw Error('store.state.sourceChainConfiguration is empty')
  if (!store.state.destinationChainConfiguration) throw Error('store.state.destinationChainConfiguration is empty')

  const bridgeContractAddress = await getBridgeContractAddressAsync(store.state.sourceChain)
  if (!bridgeContractAddress) throw Error('Destination chain escrow address not found')
  const bridge = chainId2Bridge(store.state.sourceChain)
  console.log('bridge contract address:', bridgeContractAddress)
  console.log('bridge contract:', bridge)
  const provider = useWeb3ModalProvider()
  if (!provider.walletProvider.value) throw Error('provider.walletProvider.value is empty')
  const walletProvider = new BrowserProvider(provider.walletProvider.value, store.state.sourceChain)
  const signer = await walletProvider.getSigner()

  const bridgeContract = new Contract(bridgeContractAddress, bridge.abi, signer)
  const destinationChainData = {
    chainId: store.state.destinationChain, // chain id of destination address
    tokenId: store.state.destinationToken, // amount of token at destination network
    amount: store.state.destinationAmount, // amount of token at destination network
    addressId: store.state.destinationAddress // address of destination network
  }
  const total = new BigNumber(store.state.sourceAmount).plus(store.state.feeAmount).toString()
  console.log('toSubmit', [
    store.state.sourceToken, // address of token used to pay fee
    store.state.feeAmount, // amount of fee paid
    store.state.sourceAmount, // amount of token being bridged
    destinationChainData,
    store.state.memo ?? 'aramid-fe-2',
    total
  ])
  const tokenRelease = await bridgeContract.lockNativeCurrency(
    store.state.sourceToken, // address of token used to pay fee
    store.state.feeAmount, // amount of fee paid
    store.state.sourceAmount, // amount of token being bridged
    destinationChainData,
    store.state.memo ?? 'aramid-fe-2',
    { value: total }
  )
  return tokenRelease
}
