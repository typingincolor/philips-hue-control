/**
 * Demo mode middleware
 * Detects X-Demo-Mode header and sets req.demoMode flag
 */

/**
 * Detect demo mode from request headers
 * Sets req.demoMode = true when X-Demo-Mode: true (or "1") header is present
 */
export function detectDemoMode(req, res, next) {
  const headerValue = req.headers['x-demo-mode'];

  // Check for truthy values: "true", "1", "TRUE", etc.
  const isTruthy = headerValue && (headerValue.toLowerCase() === 'true' || headerValue === '1');

  req.demoMode = isTruthy || false;

  next();
}
