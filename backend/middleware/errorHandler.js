import { toApiError } from '../utils/errors.js';
import logger from '../utils/logger.js';

/**
 * Global error handler middleware
 * Converts all errors to standardized, client-friendly JSON responses
 */
export function errorHandler(err, req, res, _next) {
  // Convert to ApiError if needed
  const apiError = toApiError(err);

  // Log error details for debugging
  logger.error(`${req.method} ${req.path}`, {
    component: 'ERROR',
    code: apiError.code,
    message: apiError.message,
    statusCode: apiError.statusCode,
    originalError: err.message !== apiError.message ? err.message : undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Build response
  const response = {
    error: apiError.code,
    message: apiError.message,
  };

  // Add suggestion if available
  if (apiError.suggestion) {
    response.suggestion = apiError.suggestion;
  }

  // Add retryAfter for rate limit errors
  if (apiError.retryAfter) {
    response.retryAfter = apiError.retryAfter;
    res.set('Retry-After', apiError.retryAfter);
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development' && err.stack) {
    response.stack = err.stack;
  }

  // Send response
  res.status(apiError.statusCode).json(response);
}

/**
 * 404 handler for unknown routes
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'route_not_found',
    message: `Route ${req.method} ${req.path} not found`,
    suggestion: 'Check the API documentation at /api/v2/docs',
  });
}
