/**
 * Conditional logger that only logs in development mode
 * In production, only critical errors are logged
 */

const isDevelopment = import.meta.env.MODE === 'development' || import.meta.env.DEV

export const logger = {
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args)
    }
  },

  info: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args)
    }
  },

  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args)
    }
  },

  error: (...args: any[]) => {
    // Always log errors, even in production
    console.error(...args)
  }
}

export default logger
