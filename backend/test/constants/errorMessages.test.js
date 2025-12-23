import { describe, it, expect } from 'vitest';
import { ERROR_CODES, ERROR_MESSAGES, ERROR_SUGGESTIONS } from '../../constants/errorMessages.js';

describe('errorMessages constants', () => {
  describe('ERROR_CODES', () => {
    it('should export authentication error codes', () => {
      expect(ERROR_CODES.AUTHENTICATION_ERROR).toBe('authentication_error');
      expect(ERROR_CODES.MISSING_CREDENTIALS).toBe('missing_credentials');
      expect(ERROR_CODES.INVALID_SESSION).toBe('invalid_session');
      expect(ERROR_CODES.SESSION_NOT_FOUND).toBe('session_not_found');
    });

    it('should export bridge error codes', () => {
      expect(ERROR_CODES.BRIDGE_CONNECTION_ERROR).toBe('bridge_connection_error');
    });

    it('should export resource error codes', () => {
      expect(ERROR_CODES.RESOURCE_NOT_FOUND).toBe('resource_not_found');
      expect(ERROR_CODES.INVALID_RESOURCE).toBe('invalid_resource');
    });

    it('should export validation error codes', () => {
      expect(ERROR_CODES.VALIDATION_ERROR).toBe('validation_error');
    });

    it('should export other error codes', () => {
      expect(ERROR_CODES.DATA_PROCESSING_ERROR).toBe('data_processing_error');
      expect(ERROR_CODES.RATE_LIMIT_EXCEEDED).toBe('rate_limit_exceeded');
      expect(ERROR_CODES.INTERNAL_ERROR).toBe('internal_error');
      expect(ERROR_CODES.ROUTE_NOT_FOUND).toBe('route_not_found');
    });
  });

  describe('ERROR_MESSAGES', () => {
    it('should export bridge connection messages', () => {
      expect(ERROR_MESSAGES.BRIDGE_CONNECTION).toBeDefined();
      expect(typeof ERROR_MESSAGES.BRIDGE_CONNECTION).toBe('function');
      expect(ERROR_MESSAGES.BRIDGE_CONNECTION('192.168.1.100')).toContain('192.168.1.100');
    });

    it('should export session messages', () => {
      expect(ERROR_MESSAGES.SESSION_EXPIRED).toBeDefined();
      expect(ERROR_MESSAGES.SESSION_NOT_FOUND).toBeDefined();
    });

    it('should export generic error messages', () => {
      expect(ERROR_MESSAGES.INTERNAL_ERROR).toBeDefined();
      expect(ERROR_MESSAGES.RATE_LIMIT).toBeDefined();
    });
  });

  describe('ERROR_SUGGESTIONS', () => {
    it('should export authentication suggestions', () => {
      expect(ERROR_SUGGESTIONS.CHECK_CREDENTIALS).toBeDefined();
      expect(ERROR_SUGGESTIONS.AUTHENTICATE_AGAIN).toBeDefined();
    });

    it('should export bridge suggestions', () => {
      expect(ERROR_SUGGESTIONS.BRIDGE_POWERED_ON).toBeDefined();
      expect(ERROR_SUGGESTIONS.BRIDGE_TIMEOUT).toBeDefined();
      expect(ERROR_SUGGESTIONS.BRIDGE_REFUSED).toBeDefined();
    });

    it('should export retry suggestions', () => {
      expect(ERROR_SUGGESTIONS.TRY_AGAIN).toBeDefined();
      expect(ERROR_SUGGESTIONS.RATE_LIMIT).toBeDefined();
      expect(typeof ERROR_SUGGESTIONS.RATE_LIMIT).toBe('function');
      expect(ERROR_SUGGESTIONS.RATE_LIMIT(30)).toContain('30');
    });

    it('should export resource suggestions', () => {
      expect(typeof ERROR_SUGGESTIONS.CHECK_RESOURCE).toBe('function');
      expect(ERROR_SUGGESTIONS.CHECK_RESOURCE('light')).toContain('light');
    });
  });
});
