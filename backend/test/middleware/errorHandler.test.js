import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { errorHandler, notFoundHandler } from '../../middleware/errorHandler.js';
import {
  ApiError,
  AuthenticationError,
  BridgeConnectionError,
  ResourceNotFoundError,
  RateLimitError,
  ValidationError,
} from '../../utils/errors.js';
import logger from '../../utils/logger.js';

describe('errorHandler middleware', () => {
  let req;
  let res;
  let next;
  let loggerSpy;

  beforeEach(() => {
    req = {
      method: 'GET',
      path: '/api/v2/test',
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
    loggerSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    loggerSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe('errorHandler', () => {
    it('should handle ApiError with correct status code', () => {
      const error = new ApiError('test_error', 'Test error message', 'Try again', 400);

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'test_error',
        message: 'Test error message',
        suggestion: 'Try again',
      });
    });

    it('should handle AuthenticationError', () => {
      const error = new AuthenticationError('Invalid credentials');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'authentication_error',
        message: 'Invalid credentials',
        suggestion: 'Check your bridge IP and username',
      });
    });

    it('should handle BridgeConnectionError', () => {
      const error = new BridgeConnectionError('192.168.1.100', { code: 'ECONNREFUSED' });

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'bridge_connection_error',
        })
      );
    });

    it('should handle ResourceNotFoundError', () => {
      const error = new ResourceNotFoundError('light', 'abc-123');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'resource_not_found',
        message: "The light 'abc-123' was not found",
        suggestion: 'Check the light ID or refresh the dashboard to get current lights',
      });
    });

    it('should handle RateLimitError with retryAfter header', () => {
      const error = new RateLimitError(30);

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.set).toHaveBeenCalledWith('Retry-After', 30);
      expect(res.json).toHaveBeenCalledWith({
        error: 'rate_limit_exceeded',
        message: 'Too many requests',
        suggestion: 'Wait 30 seconds before trying again',
        retryAfter: 30,
      });
    });

    it('should handle ValidationError', () => {
      const error = new ValidationError('brightness', 'must be between 0 and 100');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'validation_error',
        message: 'Invalid brightness: must be between 0 and 100',
        suggestion: 'Check the brightness format and try again',
      });
    });

    it('should convert generic Error to internal_error', () => {
      const error = new Error('Something went wrong');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'internal_error',
        message: 'An unexpected error occurred',
        suggestion: 'Try again or contact support if the problem persists',
      });
    });

    it('should handle ECONNREFUSED errors as bridge connection error', () => {
      const error = new Error('connect ECONNREFUSED 192.168.1.100:443');
      error.code = 'ECONNREFUSED';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'bridge_connection_error',
        })
      );
    });

    it('should handle ETIMEDOUT errors as bridge connection error', () => {
      const error = new Error('connect ETIMEDOUT 192.168.1.100:443');
      error.code = 'ETIMEDOUT';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'bridge_connection_error',
        })
      );
    });

    it('should log error details using logger', () => {
      const error = new ApiError('test_error', 'Test message', null, 400);

      errorHandler(error, req, res, next);

      expect(loggerSpy).toHaveBeenCalled();
      const logCall = loggerSpy.mock.calls[0];
      expect(logCall[0]).toContain('GET');
      expect(logCall[0]).toContain('/api/v2/test');
      expect(logCall[1]).toHaveProperty('component', 'ERROR');
      expect(logCall[1]).toHaveProperty('code', 'test_error');
    });

    it('should not include suggestion when not provided', () => {
      const error = new ApiError('test_error', 'Test message', null, 400);

      errorHandler(error, req, res, next);

      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall).not.toHaveProperty('suggestion');
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 with route info', () => {
      notFoundHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'route_not_found',
        message: 'Route GET /api/v2/test not found',
        suggestion: 'Check the API documentation at /api/v2/docs',
      });
    });

    it('should include correct method in message', () => {
      req.method = 'POST';
      req.path = '/api/v2/nonexistent';

      notFoundHandler(req, res);

      expect(res.json).toHaveBeenCalledWith({
        error: 'route_not_found',
        message: 'Route POST /api/v2/nonexistent not found',
        suggestion: 'Check the API documentation at /api/v2/docs',
      });
    });
  });
});
