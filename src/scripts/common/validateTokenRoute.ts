import type { PublicConfigurationRoot } from '../interface/mapping/PublicConfigurationRoot'
import type { TokenItem } from '../interface/mapping/TokenItem'

/**
 * Validates and finds the correct source token based on token name and valid bridge routes
 * @param sourceChainId - The source chain ID
 * @param destinationChainId - The destination chain ID  
 * @param tokenName - The token name from the URL
 * @param publicConfiguration - The public configuration containing chains and routing info
 * @returns TokenItem if valid route found, null otherwise
 */
export const findValidSourceToken = (
  sourceChainId: number,
  destinationChainId: number,
  tokenName: string,
  publicConfiguration: PublicConfigurationRoot
): TokenItem | null => {
  if (!publicConfiguration?.chains) return null
  
  const sourceChain = publicConfiguration.chains[sourceChainId.toString()]
  if (!sourceChain?.tokens) return null

  // First try exact name match in source chain
  const directMatch = Object.values(sourceChain.tokens).find((token) => token.name === tokenName)
  if (directMatch) {
    // Verify this token has a valid route to destination
    const chains2tokens = publicConfiguration.chains2tokens
    if (
      chains2tokens?.[sourceChainId.toString()]?.[destinationChainId.toString()]?.[directMatch.tokenId]
    ) {
      return directMatch
    }
  }

  // If no direct match or no valid route, search for valid tokens that match the routing
  if (!publicConfiguration.chains2tokens?.[sourceChainId.toString()]?.[destinationChainId.toString()]) {
    return null
  }

  // Get all valid source tokens for this chain pair
  const validSourceTokenIds = Object.keys(
    publicConfiguration.chains2tokens[sourceChainId.toString()][destinationChainId.toString()]
  )

  // Look for a token that matches the name in the routing configuration
  for (const tokenId of validSourceTokenIds) {
    const token = sourceChain.tokens[tokenId]
    if (token?.name === tokenName) {
      return token
    }
  }

  return null
}

/**
 * Validates and finds the correct destination token based on source token and token name
 * @param sourceChainId - The source chain ID
 * @param destinationChainId - The destination chain ID
 * @param sourceTokenId - The source token ID 
 * @param tokenName - The destination token name from the URL
 * @param publicConfiguration - The public configuration containing chains and routing info
 * @returns TokenItem if valid route found, null otherwise
 */
export const findValidDestinationToken = (
  sourceChainId: number,
  destinationChainId: number,
  sourceTokenId: string,
  tokenName: string,
  publicConfiguration: PublicConfigurationRoot
): TokenItem | null => {
  if (!publicConfiguration?.chains) return null
  
  const destinationChain = publicConfiguration.chains[destinationChainId.toString()]
  if (!destinationChain?.tokens) return null

  // Check if we have valid routing for this source token
  const chains2tokens = publicConfiguration.chains2tokens
  const validDestinationTokenIds = chains2tokens?.[sourceChainId.toString()]?.[destinationChainId.toString()]?.[sourceTokenId]
  
  if (!validDestinationTokenIds) return null

  // First try exact name match in destination chain
  const directMatch = Object.values(destinationChain.tokens).find((token) => token.name === tokenName)
  if (directMatch && Object.keys(validDestinationTokenIds).includes(directMatch.tokenId)) {
    return directMatch
  }

  // Look for a token by name in the valid destination tokens
  for (const tokenId of Object.keys(validDestinationTokenIds)) {
    const token = destinationChain.tokens[tokenId]
    if (token?.name === tokenName) {
      return token
    }
  }

  return null
}