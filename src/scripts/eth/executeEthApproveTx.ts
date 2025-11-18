import getBridgeContractAddressAsync from '../common/getBridgeContractAddressAsync'
import { BrowserProvider, Contract } from 'ethers'
import { useWeb3ModalProvider } from '@web3modal/ethers/vue'
import { useAppStore } from '@/stores/app'
import ERC20Abi from '../interface/eth/ERC20Abi'
import logger from '@/scripts/common/conditionalLogger'

export const executeEthApproveTx = async () => {
  const store = useAppStore()
  if (!store.state.sourceChain) throw Error('store.state.sourceChain is missing')
  if (!store.state.sourceToken) throw Error('store.state.sourceToken is missing')
  if (!store.state.sourceChainConfiguration) throw Error('store.state.sourceChainConfiguration is missing')
  if (!store.state.sourceChainConfiguration.address) throw Error('store.state.sourceChainConfiguration.address is missing')

  logger.debug('claim data:', store.state.claimData)
  const bridgeContractAddress = await getBridgeContractAddressAsync(store.state.sourceChain)
  if (!bridgeContractAddress) throw Error('Destination chain escrow address not found')
  logger.debug('bridge contract address:', bridgeContractAddress)
  const provider = useWeb3ModalProvider()
  if (!provider.walletProvider.value) throw Error('provider.walletProvider.value is empty')
  const walletProvider = new BrowserProvider(provider.walletProvider.value, store.state.sourceChain)
  const signer = await walletProvider.getSigner()

  const contract = new Contract(store.state.sourceToken, ERC20Abi, signer)
  logger.debug('approving', bridgeContractAddress, store.state.sourceAmount)
  const tokenRelease = await contract.approve(bridgeContractAddress, store.state.sourceAmount)
  return tokenRelease
}
