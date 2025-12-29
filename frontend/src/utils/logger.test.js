import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import logger, { createLogger } from './logger';

describe('logger', () => {
  let consoleLogSpy;
  let consoleWarnSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('base logger', () => {
    describe('info', () => {
      it('should log message in development mode', () => {
        // In test environment, import.meta.env.DEV is true
        logger.info('test message');
        expect(consoleLogSpy).toHaveBeenCalledWith('test message');
      });

      it('should log message with additional arguments', () => {
        logger.info('test message', { key: 'value' }, 123);
        expect(consoleLogSpy).toHaveBeenCalledWith('test message', { key: 'value' }, 123);
      });
    });

    describe('warn', () => {
      it('should log warning in development mode', () => {
        logger.warn('warning message');
        expect(consoleWarnSpy).toHaveBeenCalledWith('warning message');
      });

      it('should log warning with additional arguments', () => {
        logger.warn('warning', { error: 'details' });
        expect(consoleWarnSpy).toHaveBeenCalledWith('warning', { error: 'details' });
      });
    });

    describe('error', () => {
      it('should always log errors', () => {
        logger.error('error message');
        expect(consoleErrorSpy).toHaveBeenCalledWith('error message');
      });

      it('should log error with additional arguments', () => {
        const errorObj = new Error('test error');
        logger.error('error occurred', errorObj);
        expect(consoleErrorSpy).toHaveBeenCalledWith('error occurred', errorObj);
      });

      it('should log error with multiple arguments', () => {
        logger.error('error', 'arg1', 'arg2', 'arg3');
        expect(consoleErrorSpy).toHaveBeenCalledWith('error', 'arg1', 'arg2', 'arg3');
      });
    });

    describe('debug', () => {
      it('should log debug message in development mode', () => {
        logger.debug('debug message');
        expect(consoleLogSpy).toHaveBeenCalledWith('debug message');
      });

      it('should log debug with additional arguments', () => {
        logger.debug('debug', { data: [1, 2, 3] });
        expect(consoleLogSpy).toHaveBeenCalledWith('debug', { data: [1, 2, 3] });
      });
    });
  });

  describe('createLogger', () => {
    it('should create a logger with component prefix', () => {
      const componentLogger = createLogger('MyComponent');
      componentLogger.info('test');
      expect(consoleLogSpy).toHaveBeenCalledWith('[MyComponent] test');
    });

    it('should prefix info messages', () => {
      const authLogger = createLogger('Auth');
      authLogger.info('user logged in', { userId: 123 });
      expect(consoleLogSpy).toHaveBeenCalledWith('[Auth] user logged in', { userId: 123 });
    });

    it('should prefix warn messages', () => {
      const apiLogger = createLogger('API');
      apiLogger.warn('rate limit approaching');
      expect(consoleWarnSpy).toHaveBeenCalledWith('[API] rate limit approaching');
    });

    it('should prefix error messages', () => {
      const dbLogger = createLogger('Database');
      dbLogger.error('connection failed', { code: 'ECONNREFUSED' });
      expect(consoleErrorSpy).toHaveBeenCalledWith('[Database] connection failed', {
        code: 'ECONNREFUSED',
      });
    });

    it('should prefix debug messages', () => {
      const cacheLogger = createLogger('Cache');
      cacheLogger.debug('cache hit', { key: 'user:1' });
      expect(consoleLogSpy).toHaveBeenCalledWith('[Cache] cache hit', { key: 'user:1' });
    });

    it('should handle empty component name', () => {
      const emptyLogger = createLogger('');
      emptyLogger.info('message');
      expect(consoleLogSpy).toHaveBeenCalledWith('[] message');
    });

    it('should handle special characters in component name', () => {
      const specialLogger = createLogger('My-Component_v2');
      specialLogger.info('test');
      expect(consoleLogSpy).toHaveBeenCalledWith('[My-Component_v2] test');
    });

    it('should preserve multiple arguments after prefix', () => {
      const testLogger = createLogger('Test');
      testLogger.info('message', 'arg1', 'arg2', { obj: true });
      expect(consoleLogSpy).toHaveBeenCalledWith('[Test] message', 'arg1', 'arg2', { obj: true });
    });

    it('should create independent loggers', () => {
      const logger1 = createLogger('Logger1');
      const logger2 = createLogger('Logger2');

      logger1.info('from logger 1');
      logger2.info('from logger 2');

      expect(consoleLogSpy).toHaveBeenNthCalledWith(1, '[Logger1] from logger 1');
      expect(consoleLogSpy).toHaveBeenNthCalledWith(2, '[Logger2] from logger 2');
    });
  });

  describe('default export', () => {
    it('should export logger as default', () => {
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });
  });

  describe('named export', () => {
    it('should export createLogger as named export', () => {
      expect(typeof createLogger).toBe('function');
    });

    it('should return an object with all log methods', () => {
      const testLogger = createLogger('Test');
      expect(typeof testLogger.info).toBe('function');
      expect(typeof testLogger.warn).toBe('function');
      expect(typeof testLogger.error).toBe('function');
      expect(typeof testLogger.debug).toBe('function');
    });
  });
});
