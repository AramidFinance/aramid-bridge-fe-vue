import getBridgeContractAddressAsync from '../common/getBridgeContractAddressAsync'
import { BrowserProvider, Contract, type Eip1193Provider } from 'ethers'
import { useAppKitProvider } from '@reown/appkit/vue'
import { useAppStore } from '@/stores/app'
import ERC20Abi from '../interface/eth/ERC20Abi'

export const executeEthApproveTx = async () => {
  const store = useAppStore()
  if (!store.state.sourceChain) throw Error('store.state.sourceChain is missing')
  if (!store.state.sourceToken) throw Error('store.state.sourceToken is missing')
  if (!store.state.sourceChainConfiguration) throw Error('store.state.sourceChainConfiguration is missing')
  if (!store.state.sourceChainConfiguration.address) throw Error('store.state.sourceChainConfiguration.address is missing')

  console.log('claim data:', store.state.claimData)
  const bridgeContractAddress = await getBridgeContractAddressAsync(store.state.sourceChain)
  if (!bridgeContractAddress) throw Error('Destination chain escrow address not found')
  console.log('bridge contract address:', bridgeContractAddress)
  const provider = useAppKitProvider<Eip1193Provider>('eip155')
  if (!provider.walletProvider) throw Error('provider.walletProvider is empty')
  const walletProvider = new BrowserProvider(provider.walletProvider, store.state.sourceChain)
  const signer = await walletProvider.getSigner()

  const contract = new Contract(store.state.sourceToken, ERC20Abi, signer)
  console.log('approving', bridgeContractAddress, store.state.sourceAmount)
  const tokenRelease = await contract.approve(bridgeContractAddress, store.state.sourceAmount)
  return tokenRelease
}
