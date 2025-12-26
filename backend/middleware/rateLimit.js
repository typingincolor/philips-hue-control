// Rate limiting middleware
// Tracks requests per IP with configurable limits

const DEFAULT_MAX_REQUESTS = 100;
const DEFAULT_WINDOW_MS = 60 * 1000; // 1 minute

/**
 * Get client identifier from request
 */
function getClientKey(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || 'unknown';
}

/**
 * Clean up expired entries from a store
 */
function cleanupExpired(store, windowMs) {
  const now = Date.now();
  for (const [key, data] of store.entries()) {
    if (now - data.startTime >= windowMs) {
      store.delete(key);
    }
  }
}

/**
 * Create a rate limiter with custom configuration
 */
export function createRateLimiter(options = {}) {
  const {
    maxRequests = DEFAULT_MAX_REQUESTS,
    windowMs = DEFAULT_WINDOW_MS,
    skip = null,
    keyGenerator = null,
  } = options;

  const store = new Map();

  return function rateLimiter(req, res, next) {
    // Demo mode bypass
    if (req.demoMode) {
      return next();
    }

    // Check skip function
    if (skip && skip(req)) {
      return next();
    }

    // Periodic cleanup
    cleanupExpired(store, windowMs);

    const now = Date.now();
    const key = keyGenerator ? keyGenerator(req) : getClientKey(req);

    // Get or create entry
    let entry = store.get(key);
    if (!entry || now - entry.startTime >= windowMs) {
      entry = { count: 0, startTime: now };
      store.set(key, entry);
    }

    entry.count++;

    const remaining = Math.max(0, maxRequests - entry.count);
    const resetTime = Math.ceil((entry.startTime + windowMs - now) / 1000);

    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': String(maxRequests),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(resetTime),
    });

    // Check if over limit
    if (entry.count > maxRequests) {
      res.set({ 'Retry-After': String(resetTime) });
      return res.status(429).json({
        error: {
          code: 'rate_limit_exceeded',
          message: 'Too many requests, please try again later',
        },
      });
    }

    next();
  };
}

// Default rate limiter instance
const defaultLimiter = createRateLimiter();

/**
 * Default rate limiter middleware (100 requests per minute)
 */
export function rateLimit(req, res, next) {
  return defaultLimiter(req, res, next);
}

// Discovery rate limiter instance (stricter: 10 requests per minute)
const discoveryLimiter = createRateLimiter({ maxRequests: 10 });

/**
 * Stricter rate limiter for discovery endpoint (10 requests per minute)
 */
export function discoveryRateLimit(req, res, next) {
  return discoveryLimiter(req, res, next);
}
