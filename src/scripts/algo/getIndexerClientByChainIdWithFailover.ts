import algosdk from 'algosdk'
import getLogger from '../common/getLogger'
import getSecureConfiguration from '../common/getSecureConfiguration'
import type { AlgoPrivateConfiguration } from '../interface/algo/AlgoPrivateConfiguration'
import type { CustomTokenHeader } from 'algosdk/dist/types/client/urlTokenBaseHTTPClient'
import { getPublicIndexerProviders } from './getPublicProviders'

interface IndexerProvider {
  client: algosdk.Indexer
  host: string
  providerName: string
}

interface ChainId2IndexerProviders {
  [key: number]: IndexerProvider[]
}

const indexerProvidersRef: ChainId2IndexerProviders = {}

/**
 * Creates indexer client from provider configuration
 */
const createIndexerClient = (host: string, port: number, token: string, header: string = 'X-Algo-API-Token'): algosdk.Indexer => {
  const auth: CustomTokenHeader = {}
  auth[header] = token
  return new algosdk.Indexer(auth, host, port)
}

/**
 * Initializes all available indexer providers for a chain (private + public)
 */
const initIndexerProviders = async (chainId: number): Promise<IndexerProvider[]> => {
  const logger = await getLogger()
  const providers: IndexerProvider[] = []

  // Add private configuration provider if available
  try {
    const secureConfiguration = await getSecureConfiguration()
    if (secureConfiguration?.chains[chainId]) {
      const config = secureConfiguration.chains[chainId] as AlgoPrivateConfiguration
      if (config?.indexer) {
        const tokenHeader = config.indexer.header || 'X-Algo-API-Token'
        const client = createIndexerClient(config.indexer.host, config.indexer.port, config.indexer.token, tokenHeader)
        providers.push({
          client,
          host: config.indexer.host,
          providerName: 'Private Configuration'
        })
        logger.info(`Added private indexer provider for chain ${chainId}`)
      }
    }
  } catch (error) {
    logger.warn(`Failed to load private indexer configuration for chain ${chainId}:`, error)
  }

  // Add public providers
  try {
    const publicProviders = await getPublicIndexerProviders(chainId)
    for (const provider of publicProviders) {
      const tokenHeader = provider.header || 'X-Algo-API-Token'
      const client = createIndexerClient(provider.indexerHost, provider.indexerPort, provider.token, tokenHeader)
      providers.push({
        client,
        host: provider.indexerHost,
        providerName: provider.providerName
      })
    }
    logger.info(`Added ${publicProviders.length} public indexer providers for chain ${chainId}`)
  } catch (error) {
    logger.warn(`Failed to load public indexer providers for chain ${chainId}:`, error)
  }

  return providers
}

/**
 * Gets all available indexer providers for a chain
 */
const getIndexerProviders = async (chainId: number): Promise<IndexerProvider[]> => {
  if (!indexerProvidersRef[chainId]) {
    indexerProvidersRef[chainId] = await initIndexerProviders(chainId)
  }
  return indexerProvidersRef[chainId]
}

/**
 * Executes an indexer operation with failover across all available providers
 */
const executeWithIndexerFailover = async <T>(chainId: number, operation: (client: algosdk.Indexer) => Promise<T>, operationName: string = 'indexer operation'): Promise<T> => {
  const logger = await getLogger()
  const providers = await getIndexerProviders(chainId)

  if (providers.length === 0) {
    throw new Error(`No indexer providers available for chain ${chainId}`)
  }

  let lastError: any = null

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i]
    try {
      logger.debug(`Attempting ${operationName} with provider ${provider.providerName} (${provider.host}) for chain ${chainId}`)
      const result = await operation(provider.client)

      if (i > 0) {
        logger.info(`${operationName} succeeded with fallback provider ${provider.providerName} for chain ${chainId}`)
      }

      return result
    } catch (error) {
      lastError = error
      logger.warn(`${operationName} failed with provider ${provider.providerName} (${provider.host}) for chain ${chainId}:`, error)

      // Continue to next provider
      if (i < providers.length - 1) {
        logger.info(`Trying next indexer provider for chain ${chainId}`)
      }
    }
  }

  // All providers failed
  logger.error(`All indexer providers failed for ${operationName} on chain ${chainId}`)
  throw lastError || new Error(`All indexer providers failed for ${operationName} on chain ${chainId}`)
}

/**
 * Legacy compatibility function - gets first available indexer client
 * @deprecated Use executeWithIndexerFailover instead for better reliability
 */
const getIndexerClientByChainId = async (chainId: number): Promise<algosdk.Indexer | null> => {
  try {
    const providers = await getIndexerProviders(chainId)
    return providers.length > 0 ? providers[0].client : null
  } catch (error) {
    const logger = await getLogger()
    logger.error(`Failed to get indexer client for chain ${chainId}:`, error)
    return null
  }
}

export { executeWithIndexerFailover, getIndexerClientByChainId }
export default getIndexerClientByChainId
