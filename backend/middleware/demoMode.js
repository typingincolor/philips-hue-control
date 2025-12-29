/**
 * Demo mode middleware
 * Detects X-Demo-Mode header and sets req.demoMode flag
 * Also stores in request context for services to access
 */

import { runWithContext } from '../utils/requestContext.js';

/**
 * Detect demo mode from request headers
 * Sets req.demoMode = true when X-Demo-Mode: true (or "1") header is present
 * Also wraps the request in a context so services can access demoMode
 */
export function detectDemoMode(req, res, next) {
  const headerValue = req.headers['x-demo-mode'];

  // Check for truthy values: "true", "1", "TRUE", etc.
  const isTruthy = headerValue && (headerValue.toLowerCase() === 'true' || headerValue === '1');

  req.demoMode = isTruthy || false;

  // Run the rest of the request within a context
  runWithContext({ demoMode: req.demoMode }, () => {
    next();
  });
}
