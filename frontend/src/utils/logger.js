/**
 * Frontend logger utility
 * Provides structured logging with component prefixes
 * Logging is disabled in production for cleaner console output
 */

const isDevelopment = import.meta.env.DEV;

/**
 * Base logger methods
 */
const logger = {
  /**
   * Log info level message
   * @param {string} message - Log message
   * @param {...any} args - Additional arguments
   */
  info(message, ...args) {
    if (isDevelopment) {
      console.log(message, ...args);
    }
  },

  /**
   * Log warning level message
   * @param {string} message - Log message
   * @param {...any} args - Additional arguments
   */
  warn(message, ...args) {
    if (isDevelopment) {
      console.warn(message, ...args);
    }
  },

  /**
   * Log error level message (always logs, even in production)
   * @param {string} message - Log message
   * @param {...any} args - Additional arguments
   */
  error(message, ...args) {
    // Always log errors, even in production
    console.error(message, ...args);
  },

  /**
   * Log debug level message
   * @param {string} message - Log message
   * @param {...any} args - Additional arguments
   */
  debug(message, ...args) {
    if (isDevelopment) {
      console.log(message, ...args);
    }
  },
};

/**
 * Create a child logger with a preset component prefix
 * @param {string} component - Component name for log prefix
 * @returns {Object} Logger object with info, warn, error, debug methods
 */
export function createLogger(component) {
  const prefix = `[${component}]`;

  return {
    info(message, ...args) {
      logger.info(`${prefix} ${message}`, ...args);
    },
    warn(message, ...args) {
      logger.warn(`${prefix} ${message}`, ...args);
    },
    error(message, ...args) {
      logger.error(`${prefix} ${message}`, ...args);
    },
    debug(message, ...args) {
      logger.debug(`${prefix} ${message}`, ...args);
    },
  };
}

export default logger;
