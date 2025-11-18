import { useAppStore } from '@/stores/app'
import getChainConfiguration from '../common/getChainConfiguration'
import formatBaseAmount from '../common/formatBaseAmount'
import type { IEthIPFSData } from '../interface/aramid/IEthIPFSData'
import getTokenAsync from '../common/getTokenAsync'
import logger from '@/scripts/common/conditionalLogger'

export const fillInStateFromClaimData = async (claimData: IEthIPFSData) => {
  const store = useAppStore()

  logger.debug('claim data found:', claimData)
  const sourceConfiguration = await getChainConfiguration(claimData.sourceChainData.chainId)
  if (sourceConfiguration) {
    store.state.sourceChain = claimData.sourceChainData.chainId
    store.state.sourceChainConfiguration = sourceConfiguration
  }
  const sourceToken = await getTokenAsync(claimData.sourceChainData.chainId, claimData.sourceChainData.tokenId)

  if (sourceToken) {
    store.state.sourceToken = sourceToken.tokenId
    store.state.sourceTokenConfiguration = sourceToken
    store.state.sourceAmount = claimData.sourceChainData.amount
    store.state.sourceAmountFormatted = formatBaseAmount(store.state.sourceAmount, sourceToken.decimals)
  }

  const destinationConfiguration = await getChainConfiguration(claimData.destinationChainData.chainId)
  if (destinationConfiguration) {
    store.state.destinationChain = claimData.destinationChainData.chainId
    store.state.destinationChainConfiguration = destinationConfiguration
  }
  const destinationToken = await getTokenAsync(claimData.destinationChainData.chainId, claimData.destinationChainData.tokenId)

  if (destinationToken) {
    store.state.destinationToken = destinationToken.tokenId
    store.state.destinationTokenConfiguration = destinationToken
    store.state.destinationAmount = claimData.destinationChainData.amount
    store.state.destinationAmountFormatted = formatBaseAmount(store.state.destinationAmount, destinationToken.decimals)
  }

  store.state.sourceAddress = claimData.sourceChainData.addressId
  store.state.destinationAddress = claimData.destinationChainData.addressId
  store.state.memo = claimData.note
  store.state.claimData = claimData
}
