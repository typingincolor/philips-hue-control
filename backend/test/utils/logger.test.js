import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('logger', () => {
  let logger;
  let consoleSpy;

  beforeEach(async () => {
    // Suppress console output during tests
    consoleSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    // Reset modules to get fresh logger
    vi.resetModules();
    const module = await import('../../utils/logger.js');
    logger = module.default;
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe('info', () => {
    it('should be a function', () => {
      expect(typeof logger.info).toBe('function');
    });

    it('should not throw when called with message only', () => {
      expect(() => logger.info('Test message')).not.toThrow();
    });

    it('should not throw when called with message and metadata', () => {
      expect(() => logger.info('Test message', { key: 'value' })).not.toThrow();
    });

    it('should accept component prefix in metadata', () => {
      expect(() => logger.info('Test message', { component: 'WEBSOCKET' })).not.toThrow();
    });
  });

  describe('warn', () => {
    it('should be a function', () => {
      expect(typeof logger.warn).toBe('function');
    });

    it('should not throw when called with message only', () => {
      expect(() => logger.warn('Warning message')).not.toThrow();
    });

    it('should not throw when called with metadata', () => {
      expect(() => logger.warn('Warning message', { code: 'W001' })).not.toThrow();
    });
  });

  describe('error', () => {
    it('should be a function', () => {
      expect(typeof logger.error).toBe('function');
    });

    it('should not throw when called with message only', () => {
      expect(() => logger.error('Error message')).not.toThrow();
    });

    it('should not throw when called with error metadata', () => {
      const error = new Error('Test error');
      expect(() => logger.error('Error occurred', { error: error.message })).not.toThrow();
    });
  });

  describe('debug', () => {
    it('should be a function', () => {
      expect(typeof logger.debug).toBe('function');
    });

    it('should not throw when called with message only', () => {
      expect(() => logger.debug('Debug message')).not.toThrow();
    });

    it('should not throw when called with complex metadata', () => {
      expect(() => logger.debug('Debug info', { data: [1, 2, 3] })).not.toThrow();
    });
  });

  describe('module exports', () => {
    it('should export a default logger object', () => {
      expect(logger).toBeDefined();
      expect(typeof logger).toBe('object');
    });

    it('should have all required log methods', () => {
      expect(logger).toHaveProperty('info');
      expect(logger).toHaveProperty('warn');
      expect(logger).toHaveProperty('error');
      expect(logger).toHaveProperty('debug');
    });
  });
});
