/**
 * Lightweight performance monitoring utility
 * Only active in development mode
 */
import logger from '@/scripts/common/conditionalLogger'

const isDevelopment = import.meta.env.DEV

export const performance = {
  /**
   * Mark a performance timing point
   * @param name - Name of the mark
   */
  mark: (name: string) => {
    if (isDevelopment && window.performance && window.performance.mark) {
      try {
        window.performance.mark(name)
      } catch (e) {
        // Ignore errors (e.g., if performance API is restricted)
      }
    }
  },

  /**
   * Measure the time between two marks
   * @param name - Name of the measurement
   * @param startMark - Starting mark name
   * @param endMark - Ending mark name
   */
  measure: (name: string, startMark: string, endMark: string) => {
    if (isDevelopment && window.performance && window.performance.measure) {
      try {
        window.performance.measure(name, startMark, endMark)
        const measures = window.performance.getEntriesByName(name)
        if (measures.length > 0) {
          const measure = measures[measures.length - 1]
          logger.debug(`⚡ Performance: ${name} took ${measure.duration.toFixed(2)}ms`)
        }
      } catch (e) {
        // Marks don't exist or performance API error, ignore
      }
    }
  },

  /**
   * Clear all performance marks and measures
   */
  clear: () => {
    if (isDevelopment && window.performance) {
      try {
        window.performance.clearMarks()
        window.performance.clearMeasures()
      } catch (e) {
        // Ignore errors
      }
    }
  },

  /**
   * Get all performance entries
   */
  getEntries: () => {
    if (isDevelopment && window.performance && window.performance.getEntries) {
      try {
        return window.performance.getEntries()
      } catch (e) {
        return []
      }
    }
    return []
  }
}

export default performance
