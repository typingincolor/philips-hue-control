import winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';
const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

/**
 * Custom format for console output with colored component prefixes
 */
const consoleFormat = winston.format.printf(({ level, message, timestamp, component, ...meta }) => {
  const componentPrefix = component ? `[${component}] ` : '';
  const metaString = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp} ${level}: ${componentPrefix}${message}${metaString}`;
});

/**
 * Create winston logger instance
 */
const winstonLogger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    isProduction
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          consoleFormat
        )
  ),
  transports: [
    new winston.transports.Console()
  ]
});

/**
 * Logger wrapper that provides consistent interface
 */
const logger = {
  /**
   * Log info level message
   * @param {string} message - Log message
   * @param {Object} [meta] - Additional metadata
   */
  info(message, meta) {
    winstonLogger.info(message, meta);
  },

  /**
   * Log warning level message
   * @param {string} message - Log message
   * @param {Object} [meta] - Additional metadata
   */
  warn(message, meta) {
    winstonLogger.warn(message, meta);
  },

  /**
   * Log error level message
   * @param {string} message - Log message
   * @param {Object} [meta] - Additional metadata
   */
  error(message, meta) {
    winstonLogger.error(message, meta);
  },

  /**
   * Log debug level message
   * @param {string} message - Log message
   * @param {Object} [meta] - Additional metadata
   */
  debug(message, meta) {
    winstonLogger.debug(message, meta);
  }
};

export default logger;
