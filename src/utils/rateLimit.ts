/**
 * Rate Limiter Utility
 *
 * This module provides rate limiting functionality to prevent abuse
 * of RPC endpoints and external API calls.
 */

/**
 * Simple in-memory rate limiter using token bucket algorithm
 */
export class RateLimiter {
  private calls: number[] = []
  private maxCalls: number
  private timeWindow: number

  /**
   * Create a new rate limiter
   *
   * @param maxCalls - Maximum number of calls allowed in the time window
   * @param timeWindowMs - Time window in milliseconds
   */
  constructor(maxCalls: number, timeWindowMs: number) {
    this.maxCalls = maxCalls
    this.timeWindow = timeWindowMs
  }

  /**
   * Wait if necessary to respect the rate limit
   * This method will delay execution if the rate limit has been exceeded
   */
  async throttle(): Promise<void> {
    const now = Date.now()

    // Remove calls outside the time window
    this.calls = this.calls.filter((time) => now - time < this.timeWindow)

    // If we've hit the limit, wait for the oldest call to expire
    if (this.calls.length >= this.maxCalls) {
      const oldestCall = this.calls[0]
      const waitTime = this.timeWindow - (now - oldestCall) + 10 // Add 10ms buffer
      await new Promise((resolve) => setTimeout(resolve, waitTime))

      // Clean up again after waiting
      const newNow = Date.now()
      this.calls = this.calls.filter((time) => newNow - time < this.timeWindow)
    }

    // Record this call
    this.calls.push(Date.now())
  }

  /**
   * Check if a call would exceed the rate limit without actually recording it
   *
   * @returns true if the call would be allowed, false otherwise
   */
  canMakeCall(): boolean {
    const now = Date.now()
    const recentCalls = this.calls.filter((time) => now - time < this.timeWindow)
    return recentCalls.length < this.maxCalls
  }

  /**
   * Reset the rate limiter (clear all recorded calls)
   */
  reset(): void {
    this.calls = []
  }

  /**
   * Get current call count within the time window
   */
  getCurrentCallCount(): number {
    const now = Date.now()
    return this.calls.filter((time) => now - time < this.timeWindow).length
  }
}

/**
 * Exponential backoff rate limiter
 * Increases wait time exponentially with each consecutive call
 */
export class ExponentialBackoffLimiter {
  private lastCallTime: number = 0
  private consecutiveCalls: number = 0
  private baseDelay: number
  private maxDelay: number
  private resetAfter: number

  /**
   * Create a new exponential backoff limiter
   *
   * @param baseDelayMs - Base delay in milliseconds
   * @param maxDelayMs - Maximum delay in milliseconds
   * @param resetAfterMs - Reset consecutive calls counter after this many milliseconds
   */
  constructor(baseDelayMs: number = 100, maxDelayMs: number = 5000, resetAfterMs: number = 10000) {
    this.baseDelay = baseDelayMs
    this.maxDelay = maxDelayMs
    this.resetAfter = resetAfterMs
  }

  /**
   * Wait with exponential backoff
   */
  async throttle(): Promise<void> {
    const now = Date.now()

    // Reset consecutive calls if enough time has passed
    if (now - this.lastCallTime > this.resetAfter) {
      this.consecutiveCalls = 0
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(this.baseDelay * Math.pow(2, this.consecutiveCalls), this.maxDelay)

    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay))
    }

    this.consecutiveCalls++
    this.lastCallTime = Date.now()
  }

  /**
   * Reset the backoff counter
   */
  reset(): void {
    this.consecutiveCalls = 0
    this.lastCallTime = 0
  }
}

// Pre-configured rate limiters for different use cases

/**
 * Rate limiter for RPC calls
 * Allows 10 calls per second to prevent overwhelming RPC endpoints
 */
export const rpcLimiter = new RateLimiter(10, 1000)

/**
 * Rate limiter for indexer queries
 * Allows 5 calls per second for indexer queries (more expensive than RPC calls)
 */
export const indexerLimiter = new RateLimiter(5, 1000)

/**
 * Rate limiter for balance checks
 * Allows 20 calls per second for balance checks (lightweight operations)
 */
export const balanceLimiter = new RateLimiter(20, 1000)

/**
 * Exponential backoff limiter for retry scenarios
 * Starts with 100ms delay, doubles each time, max 5 seconds
 */
export const retryLimiter = new ExponentialBackoffLimiter(100, 5000, 10000)

/**
 * Utility function to wrap an async function with rate limiting
 *
 * @param fn - The async function to rate limit
 * @param limiter - The rate limiter to use
 * @returns A rate-limited version of the function
 */
export function withRateLimit<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  limiter: RateLimiter
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    await limiter.throttle()
    return fn(...args)
  }) as T
}
