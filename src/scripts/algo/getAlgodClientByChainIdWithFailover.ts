import algosdk from 'algosdk'
import getLogger from '../common/getLogger'
import getSecureConfiguration from '../common/getSecureConfiguration'
import type { AlgoPrivateConfiguration } from '../interface/algo/AlgoPrivateConfiguration'
import type { CustomTokenHeader } from 'algosdk/dist/types/client/urlTokenBaseHTTPClient'
import { getPublicAlgodProviders } from './getPublicProviders'

interface AlgodProvider {
  client: algosdk.Algodv2
  host: string
  providerName: string
}

interface ChainId2AlgodProviders {
  [key: number]: AlgodProvider[]
}

const algodProvidersRef: ChainId2AlgodProviders = {}

/**
 * Creates algod client from provider configuration
 */
const createAlgodClient = (host: string, port: number, token: string, header: string = 'X-Algo-API-Token'): algosdk.Algodv2 => {
  const auth: CustomTokenHeader = {}
  auth[header] = token
  return new algosdk.Algodv2(auth, host, port)
}

/**
 * Initializes all available algod providers for a chain (private + public)
 */
const initAlgodProviders = async (chainId: number): Promise<AlgodProvider[]> => {
  const logger = await getLogger()
  const providers: AlgodProvider[] = []

  // Add private configuration provider if available
  try {
    const secureConfiguration = await getSecureConfiguration()
    if (secureConfiguration?.chains[chainId]) {
      const config = secureConfiguration.chains[chainId] as AlgoPrivateConfiguration
      if (config?.algod) {
        const tokenHeader = config.algod.header || 'X-Algo-API-Token'
        const client = createAlgodClient(config.algod.host, config.algod.port, config.algod.token, tokenHeader)
        providers.push({
          client,
          host: config.algod.host,
          providerName: 'Private Configuration'
        })
        logger.info(`Added private algod provider for chain ${chainId}`)
      }
    }
  } catch (error) {
    logger.warn(`Failed to load private algod configuration for chain ${chainId}:`, error)
  }

  // Add public providers
  try {
    const publicProviders = await getPublicAlgodProviders(chainId)
    for (const provider of publicProviders) {
      const tokenHeader = provider.header || 'X-Algo-API-Token'
      const client = createAlgodClient(provider.algodHost, provider.algodPort, provider.token, tokenHeader)
      providers.push({
        client,
        host: provider.algodHost,
        providerName: provider.providerName
      })
    }
    logger.info(`Added ${publicProviders.length} public algod providers for chain ${chainId}`)
  } catch (error) {
    logger.warn(`Failed to load public algod providers for chain ${chainId}:`, error)
  }

  return providers
}

/**
 * Gets all available algod providers for a chain
 */
const getAlgodProviders = async (chainId: number): Promise<AlgodProvider[]> => {
  if (!algodProvidersRef[chainId]) {
    algodProvidersRef[chainId] = await initAlgodProviders(chainId)
  }
  return algodProvidersRef[chainId]
}

/**
 * Executes an algod operation with failover across all available providers
 */
const executeWithAlgodFailover = async <T>(chainId: number, operation: (client: algosdk.Algodv2) => Promise<T>, operationName: string = 'algod operation'): Promise<T> => {
  const logger = await getLogger()
  const providers = await getAlgodProviders(chainId)

  if (providers.length === 0) {
    throw new Error(`No algod providers available for chain ${chainId}`)
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
        logger.info(`Trying next algod provider for chain ${chainId}`)
      }
    }
  }

  // All providers failed
  logger.error(`All algod providers failed for ${operationName} on chain ${chainId}`)
  throw lastError || new Error(`All algod providers failed for ${operationName} on chain ${chainId}`)
}

/**
 * Legacy compatibility function - gets first available algod client
 * @deprecated Use executeWithAlgodFailover instead for better reliability
 */
const getAlgodClientByChainId = async (chainId: number): Promise<algosdk.Algodv2 | null> => {
  try {
    const providers = await getAlgodProviders(chainId)
    return providers.length > 0 ? providers[0].client : null
  } catch (error) {
    const logger = await getLogger()
    logger.error(`Failed to get algod client for chain ${chainId}:`, error)
    return null
  }
}

export { executeWithAlgodFailover, getAlgodClientByChainId }
export default getAlgodClientByChainId
