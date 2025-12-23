/**
 * Custom error classes for client-friendly error messages
 */

export class ApiError extends Error {
  constructor(code, message, suggestion = null, statusCode = 500) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.suggestion = suggestion;
    this.statusCode = statusCode;
  }
}

// Authentication errors
export class AuthenticationError extends ApiError {
  constructor(message, suggestion = 'Check your bridge IP and username') {
    super('authentication_error', message, suggestion, 401);
  }
}

export class MissingCredentialsError extends ApiError {
  constructor(missing) {
    super(
      'missing_credentials',
      `Missing required parameter: ${missing}`,
      `Provide ${missing} in the request headers or query parameters`,
      400
    );
  }
}

// Bridge connection errors
export class BridgeConnectionError extends ApiError {
  constructor(bridgeIp, originalError) {
    const message = `Cannot connect to Philips Hue Bridge at ${bridgeIp}`;
    let suggestion = 'Check that the bridge IP address is correct and the bridge is powered on';

    if (originalError?.code === 'ETIMEDOUT') {
      suggestion = 'The bridge is not responding. Check your network connection and bridge IP address';
    } else if (originalError?.code === 'ECONNREFUSED') {
      suggestion = 'Connection refused. Verify the bridge IP address is correct';
    }

    super('bridge_connection_error', message, suggestion, 503);
  }
}

// Resource errors
export class ResourceNotFoundError extends ApiError {
  constructor(resourceType, resourceId) {
    super(
      'resource_not_found',
      `The ${resourceType} '${resourceId}' was not found`,
      `Check the ${resourceType} ID or refresh the dashboard to get current ${resourceType}s`,
      404
    );
  }
}

export class InvalidResourceError extends ApiError {
  constructor(resourceType, reason) {
    super(
      'invalid_resource',
      `Invalid ${resourceType}: ${reason}`,
      `Check the ${resourceType} data format`,
      400
    );
  }
}

// Data processing errors
export class DataProcessingError extends ApiError {
  constructor(operation, originalError) {
    super(
      'data_processing_error',
      `Failed to ${operation}`,
      'This might be a temporary issue. Try again in a moment',
      500
    );
    this.originalError = originalError?.message;
  }
}

// Session errors
export class InvalidSessionError extends ApiError {
  constructor() {
    super(
      'invalid_session',
      'Your session has expired or is invalid',
      'Authenticate again to create a new session',
      401
    );
  }
}

export class SessionNotFoundError extends ApiError {
  constructor() {
    super(
      'session_not_found',
      'No active session found',
      'Create a session by connecting to your bridge first',
      401
    );
  }
}

// Validation errors
export class ValidationError extends ApiError {
  constructor(field, reason) {
    super(
      'validation_error',
      `Invalid ${field}: ${reason}`,
      `Check the ${field} format and try again`,
      400
    );
  }
}

// Rate limiting
export class RateLimitError extends ApiError {
  constructor(retryAfter = 60) {
    super(
      'rate_limit_exceeded',
      'Too many requests',
      `Wait ${retryAfter} seconds before trying again`,
      429
    );
    this.retryAfter = retryAfter;
  }
}

/**
 * Convert any error to a standardized API error response
 */
export function toApiError(error) {
  if (error instanceof ApiError) {
    return error;
  }

  // Bridge connection errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    // Try to extract bridge IP from error message
    const bridgeIpMatch = error.message.match(/(\d+\.\d+\.\d+\.\d+)/);
    const bridgeIp = bridgeIpMatch ? bridgeIpMatch[1] : 'unknown';
    return new BridgeConnectionError(bridgeIp, error);
  }

  // Hue API errors
  if (error.message?.includes('Bridge returned')) {
    return new AuthenticationError(
      'Unable to communicate with the bridge',
      'Check your username/API key is valid'
    );
  }

  if (error.message?.includes('Hue API error')) {
    return new DataProcessingError('communicate with the bridge', error);
  }

  // Generic errors
  return new ApiError(
    'internal_error',
    'An unexpected error occurred',
    'Try again or contact support if the problem persists',
    500
  );
}
