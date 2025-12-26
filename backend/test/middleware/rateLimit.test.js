import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rateLimit, createRateLimiter } from '../../middleware/rateLimit.js';

describe('Rate Limit Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    vi.useFakeTimers();
    req = {
      ip: '192.168.1.100',
      headers: {},
      path: '/api/v1/dashboard',
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      set: vi.fn(),
    };
    next = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('rateLimit (default config)', () => {
    it('should call next() when under rate limit', () => {
      rateLimit(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should set rate limit headers on response', () => {
      rateLimit(req, res, next);

      expect(res.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'X-RateLimit-Limit': expect.any(String),
          'X-RateLimit-Remaining': expect.any(String),
          'X-RateLimit-Reset': expect.any(String),
        })
      );
    });

    it('should return 429 when rate limit exceeded', () => {
      // Make 101 requests (default limit is 100)
      for (let i = 0; i < 100; i++) {
        rateLimit(req, res, next);
      }

      // Reset mocks for the 101st request
      next.mockClear();
      res.status.mockClear();

      rateLimit(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(next).not.toHaveBeenCalled();
    });

    it('should include retry-after header when rate limited', () => {
      // Exceed the limit
      for (let i = 0; i < 101; i++) {
        rateLimit(req, res, next);
      }

      expect(res.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Retry-After': expect.any(String),
        })
      );
    });

    it('should return error response with rate_limit_exceeded code', () => {
      // Exceed the limit
      for (let i = 0; i < 101; i++) {
        rateLimit(req, res, next);
      }

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'rate_limit_exceeded',
          }),
        })
      );
    });

    it('should reset rate limit after window expires', () => {
      // Use up the limit
      for (let i = 0; i < 100; i++) {
        rateLimit(req, res, next);
      }

      // Advance time by 1 minute (default window)
      vi.advanceTimersByTime(60 * 1000);

      next.mockClear();
      rateLimit(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should track requests per IP address', () => {
      // First IP makes 100 requests
      for (let i = 0; i < 100; i++) {
        rateLimit(req, res, next);
      }

      // Second IP should still be allowed
      req.ip = '192.168.1.200';
      next.mockClear();

      rateLimit(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should use X-Forwarded-For header when present', () => {
      req.headers['x-forwarded-for'] = '10.0.0.1, 192.168.1.1';

      rateLimit(req, res, next);

      // Make requests from same forwarded IP
      for (let i = 0; i < 99; i++) {
        rateLimit(req, res, next);
      }

      // Change the forwarded IP - should reset count
      req.headers['x-forwarded-for'] = '10.0.0.2';
      next.mockClear();

      rateLimit(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('createRateLimiter (custom config)', () => {
    it('should allow custom request limit', () => {
      const customLimiter = createRateLimiter({ maxRequests: 5 });

      // Make 5 requests (at limit)
      for (let i = 0; i < 5; i++) {
        customLimiter(req, res, next);
      }

      next.mockClear();
      customLimiter(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
    });

    it('should allow custom time window', () => {
      const customLimiter = createRateLimiter({
        maxRequests: 5,
        windowMs: 10000, // 10 seconds
      });

      // Exceed limit
      for (let i = 0; i < 6; i++) {
        customLimiter(req, res, next);
      }

      // Advance 10 seconds
      vi.advanceTimersByTime(10000);

      next.mockClear();
      res.status.mockClear();
      customLimiter(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalledWith(429);
    });

    it('should allow skip function to bypass rate limiting', () => {
      const customLimiter = createRateLimiter({
        maxRequests: 1,
        skip: (req) => req.path === '/api/v1/health',
      });

      req.path = '/api/v1/health';

      // Should not be rate limited even after many requests
      for (let i = 0; i < 10; i++) {
        customLimiter(req, res, next);
      }

      expect(next).toHaveBeenCalledTimes(10);
      expect(res.status).not.toHaveBeenCalledWith(429);
    });

    it('should allow custom key generator', () => {
      const customLimiter = createRateLimiter({
        maxRequests: 2,
        keyGenerator: (req) => req.headers.authorization || req.ip,
      });

      req.headers.authorization = 'Bearer token1';

      // Make 2 requests with token1
      customLimiter(req, res, next);
      customLimiter(req, res, next);

      // Third request with same token should be limited
      next.mockClear();
      customLimiter(req, res, next);
      expect(res.status).toHaveBeenCalledWith(429);

      // Different token should be allowed
      req.headers.authorization = 'Bearer token2';
      next.mockClear();
      res.status.mockClear();
      customLimiter(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Demo mode bypass', () => {
    it('should not rate limit demo mode requests', () => {
      req.demoMode = true;

      // Make many requests in demo mode
      for (let i = 0; i < 200; i++) {
        rateLimit(req, res, next);
      }

      expect(next).toHaveBeenCalledTimes(200);
      expect(res.status).not.toHaveBeenCalledWith(429);
    });
  });

  describe('Edge cases', () => {
    it('should handle missing IP gracefully', () => {
      req.ip = undefined;

      expect(() => rateLimit(req, res, next)).not.toThrow();
      expect(next).toHaveBeenCalled();
    });

    it('should handle concurrent requests from same IP', () => {
      // Use unique IP to avoid state from other tests
      req.ip = '10.99.99.99';

      // Make 50 concurrent requests from same IP
      for (let i = 0; i < 50; i++) {
        rateLimit(req, res, next);
      }

      // All 50 should be allowed (under 100 limit)
      expect(next).toHaveBeenCalledTimes(50);
    });

    it('should clean up expired entries to prevent memory leaks', () => {
      // Make request from many different IPs
      for (let i = 0; i < 1000; i++) {
        req.ip = `192.168.${Math.floor(i / 256)}.${i % 256}`;
        rateLimit(req, res, next);
      }

      // Advance time past the window
      vi.advanceTimersByTime(60 * 1000 + 1);

      // Trigger cleanup (implementation detail - next request should clean up)
      req.ip = '10.0.0.1';
      rateLimit(req, res, next);

      // The middleware should have cleaned up old entries
      // (This is more of an implementation hint than a strict test)
      expect(next).toHaveBeenCalled();
    });
  });

  describe('discoveryRateLimit (stricter limits for discovery endpoint)', () => {
    it('should export a discoveryRateLimit middleware', async () => {
      const { discoveryRateLimit } = await import('../../middleware/rateLimit.js');
      expect(discoveryRateLimit).toBeDefined();
      expect(typeof discoveryRateLimit).toBe('function');
    });

    it('should have a lower request limit than default (10 requests per minute)', async () => {
      const { discoveryRateLimit } = await import('../../middleware/rateLimit.js');
      req.ip = '10.20.30.40';

      // Make 10 requests (at the stricter limit)
      for (let i = 0; i < 10; i++) {
        discoveryRateLimit(req, res, next);
      }

      // 11th request should be rate limited
      next.mockClear();
      res.status.mockClear();
      discoveryRateLimit(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(next).not.toHaveBeenCalled();
    });

    it('should still bypass for demo mode', async () => {
      const { discoveryRateLimit } = await import('../../middleware/rateLimit.js');
      req.ip = '10.20.30.41';
      req.demoMode = true;

      // Make many requests in demo mode
      for (let i = 0; i < 50; i++) {
        discoveryRateLimit(req, res, next);
      }

      expect(next).toHaveBeenCalledTimes(50);
      expect(res.status).not.toHaveBeenCalledWith(429);
    });

    it('should set appropriate rate limit headers', async () => {
      const { discoveryRateLimit } = await import('../../middleware/rateLimit.js');
      req.ip = '10.20.30.42';

      discoveryRateLimit(req, res, next);

      expect(res.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '9',
        })
      );
    });
  });
});
