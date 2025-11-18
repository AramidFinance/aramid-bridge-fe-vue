/**
 * Input Sanitization and Validation Utilities
 *
 * This module provides functions to sanitize and validate user inputs
 * to prevent XSS attacks and ensure data integrity.
 */

/**
 * Sanitize general text input by removing potentially dangerous characters
 * and limiting length
 *
 * @param input - The input string to sanitize
 * @param maxLength - Maximum allowed length (default: 1000)
 * @returns Sanitized string
 */
export function sanitizeInput(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') {
    return ''
  }

  return input
    .trim()
    .replace(/[<>'"]/g, '') // Remove potentially dangerous chars
    .slice(0, maxLength) // Limit length
}

/**
 * Validate Ethereum address format
 *
 * @param address - The address to validate
 * @returns true if valid Ethereum address, false otherwise
 */
export function isValidEthAddress(address: string): boolean {
  if (typeof address !== 'string') {
    return false
  }
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Validate Algorand address format
 *
 * @param address - The address to validate
 * @returns true if valid Algorand address, false otherwise
 */
export function isValidAlgoAddress(address: string): boolean {
  if (typeof address !== 'string') {
    return false
  }
  return /^[A-Z2-7]{58}$/.test(address)
}

/**
 * Validate transaction hash format (Ethereum or Algorand)
 *
 * @param hash - The transaction hash to validate
 * @returns true if valid transaction hash, false otherwise
 */
export function isValidTxHash(hash: string): boolean {
  if (typeof hash !== 'string') {
    return false
  }
  // Ethereum transaction hash (0x + 64 hex chars)
  const isEthTxHash = /^0x[a-fA-F0-9]{64}$/.test(hash)
  // Algorand transaction ID (52 base32 chars)
  const isAlgoTxHash = /^[A-Z2-7]{52}$/.test(hash)

  return isEthTxHash || isAlgoTxHash
}

/**
 * Validate and sanitize numeric input
 *
 * @param value - The value to validate
 * @param min - Minimum allowed value (optional)
 * @param max - Maximum allowed value (optional)
 * @returns Validated number or null if invalid
 */
export function sanitizeNumericInput(
  value: string | number,
  min?: number,
  max?: number
): number | null {
  const num = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(num) || !isFinite(num)) {
    return null
  }

  if (min !== undefined && num < min) {
    return null
  }

  if (max !== undefined && num > max) {
    return null
  }

  return num
}

/**
 * Sanitize memo field input
 * Removes control characters and limits length
 *
 * @param memo - The memo text to sanitize
 * @param maxLength - Maximum allowed length (default: 1000)
 * @returns Sanitized memo string
 */
export function sanitizeMemo(memo: string, maxLength: number = 1000): string {
  if (typeof memo !== 'string') {
    return ''
  }

  return memo
    .trim()
    // Remove control characters except newline and tab
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .slice(0, maxLength)
}

/**
 * Validate URL format
 *
 * @param url - The URL to validate
 * @param allowedProtocols - Array of allowed protocols (default: ['https', 'http'])
 * @returns true if valid URL, false otherwise
 */
export function isValidUrl(
  url: string,
  allowedProtocols: string[] = ['https', 'http']
): boolean {
  if (typeof url !== 'string') {
    return false
  }

  try {
    const parsedUrl = new URL(url)
    return allowedProtocols.includes(parsedUrl.protocol.replace(':', ''))
  } catch {
    return false
  }
}

/**
 * Sanitize search query input
 * Removes special characters that could be used for injection attacks
 *
 * @param query - The search query to sanitize
 * @param maxLength - Maximum allowed length (default: 200)
 * @returns Sanitized query string
 */
export function sanitizeSearchQuery(query: string, maxLength: number = 200): string {
  if (typeof query !== 'string') {
    return ''
  }

  return query
    .trim()
    // Remove characters that could be used for injection
    .replace(/[<>'"%;()&+]/g, '')
    .slice(0, maxLength)
}

/**
 * Validate asset symbol format
 *
 * @param symbol - The asset symbol to validate
 * @returns true if valid symbol format, false otherwise
 */
export function isValidAssetSymbol(symbol: string): boolean {
  if (typeof symbol !== 'string') {
    return false
  }
  // Allow alphanumeric characters, hyphens, and underscores, 1-20 chars
  return /^[a-zA-Z0-9_-]{1,20}$/.test(symbol)
}

/**
 * Validate chain ID format
 *
 * @param chainId - The chain ID to validate
 * @returns true if valid chain ID, false otherwise
 */
export function isValidChainId(chainId: string | number): boolean {
  if (typeof chainId === 'number') {
    return chainId > 0 && Number.isInteger(chainId)
  }

  if (typeof chainId === 'string') {
    const num = parseInt(chainId, 10)
    return !isNaN(num) && num > 0 && num.toString() === chainId
  }

  return false
}

/**
 * Escape HTML entities to prevent XSS
 *
 * @param text - The text to escape
 * @returns HTML-escaped string
 */
export function escapeHtml(text: string): string {
  if (typeof text !== 'string') {
    return ''
  }

  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  }

  return text.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char] || char)
}
