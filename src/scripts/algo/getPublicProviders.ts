import axios from 'axios'
import type { PublicAlgodProvider } from '../interface/algo/PublicAlgodProvider'
import type { PublicIndexerProvider } from '../interface/algo/PublicIndexerProvider'
import getLogger from '../common/getLogger'

/**
 * Maps chainId to network name for public provider URLs
 */
const getNetworkNameByChainId = (chainId: number): string | null => {
  switch (chainId) {
    case 416001:
      return 'mainnet-v1.0'
    case 416102:
      return 'voimain-v1.0'
    case 101003:
      return 'aramidmain-v1.0'
    default:
      return null
  }
}

/**
 * Fetches public algod providers for a given chain
 */
const getPublicAlgodProviders = async (chainId: number): Promise<PublicAlgodProvider[]> => {
  const logger = await getLogger()
  const networkName = getNetworkNameByChainId(chainId)

  if (!networkName) {
    logger.warn(`No public algod providers available for chain ${chainId}`)
    return []
  }

  try {
    const url = `https://scholtz.github.io/AlgorandPublicData/algod/${networkName}/public-algod-providers.json`
    const response = await axios.get(url, { timeout: 5000 })

    if (response.status === 200 && Array.isArray(response.data)) {
      logger.info(`Loaded ${response.data.length} public algod providers for chain ${chainId}`)
      return response.data as PublicAlgodProvider[]
    }

    logger.warn(`Invalid response from public algod providers for chain ${chainId}`)
    return []
  } catch (error) {
    logger.error(`Failed to fetch public algod providers for chain ${chainId}:`, error)
    return []
  }
}

/**
 * Fetches public indexer providers for a given chain
 */
const getPublicIndexerProviders = async (chainId: number): Promise<PublicIndexerProvider[]> => {
  const logger = await getLogger()
  const networkName = getNetworkNameByChainId(chainId)

  if (!networkName) {
    logger.warn(`No public indexer providers available for chain ${chainId}`)
    return []
  }

  try {
    const url = `https://scholtz.github.io/AlgorandPublicData/indexer/${networkName}/public-indexer-providers.json`
    const response = await axios.get(url, { timeout: 5000 })

    if (response.status === 200 && Array.isArray(response.data)) {
      logger.info(`Loaded ${response.data.length} public indexer providers for chain ${chainId}`)
      return response.data as PublicIndexerProvider[]
    }

    logger.warn(`Invalid response from public indexer providers for chain ${chainId}`)
    return []
  } catch (error) {
    logger.error(`Failed to fetch public indexer providers for chain ${chainId}:`, error)
    return []
  }
}

export { getNetworkNameByChainId, getPublicAlgodProviders, getPublicIndexerProviders }
