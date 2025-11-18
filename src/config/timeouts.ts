/**
 * Centralized timeout configuration
 * All timeouts in milliseconds
 */
export const TIMEOUTS = {
  /**
   * Wallet connection timeout - 30s to accommodate hardware wallets
   * Hardware wallets may require physical interaction and take longer
   */
  WALLET_CONNECTION: 30000,

  /**
   * RPC request timeout - 10s for blockchain RPC calls
   */
  RPC_REQUEST: 10000,

  /**
   * Configuration loading timeout - 30s for initial config load
   */
  CONFIG_LOAD: 30000,

  /**
   * Balance fetch timeout - 15s for token balance queries
   */
  BALANCE_FETCH: 15000,

  /**
   * Transaction confirmation timeout - 3 minutes
   * Blockchain transactions can take time to confirm
   */
  TRANSACTION_WAIT: 180000,

  /**
   * Debounce delay for user input - 300ms
   */
  DEBOUNCE_INPUT: 300,

  /**
   * Debounce delay for address changes - 500ms
   */
  DEBOUNCE_ADDRESS: 500,
} as const

export default TIMEOUTS
