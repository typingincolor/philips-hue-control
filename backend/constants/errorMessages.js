/**
 * Centralized error codes for consistent API responses
 */
export const ERROR_CODES = {
  // Authentication
  AUTHENTICATION_ERROR: 'authentication_error',
  MISSING_CREDENTIALS: 'missing_credentials',
  INVALID_SESSION: 'invalid_session',
  SESSION_NOT_FOUND: 'session_not_found',

  // Bridge
  BRIDGE_CONNECTION_ERROR: 'bridge_connection_error',

  // Resources
  RESOURCE_NOT_FOUND: 'resource_not_found',
  INVALID_RESOURCE: 'invalid_resource',

  // Validation
  VALIDATION_ERROR: 'validation_error',

  // Other
  DATA_PROCESSING_ERROR: 'data_processing_error',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  INTERNAL_ERROR: 'internal_error',
  ROUTE_NOT_FOUND: 'route_not_found',
};

/**
 * Centralized error messages for consistent API responses
 */
export const ERROR_MESSAGES = {
  // Bridge
  BRIDGE_CONNECTION: (bridgeIp) => `Cannot connect to Philips Hue Bridge at ${bridgeIp}`,

  // Session
  SESSION_EXPIRED: 'Your session has expired or is invalid',
  SESSION_NOT_FOUND: 'No active session found',

  // Generic
  INTERNAL_ERROR: 'An unexpected error occurred',
  RATE_LIMIT: 'Too many requests',
  UNABLE_TO_COMMUNICATE: 'Unable to communicate with the bridge',
};

/**
 * Centralized error suggestions for consistent API responses
 */
export const ERROR_SUGGESTIONS = {
  // Authentication
  CHECK_CREDENTIALS: 'Check your bridge IP and username',
  AUTHENTICATE_AGAIN: 'Authenticate again to create a new session',
  CREATE_SESSION: 'Create a session by connecting to your bridge first',

  // Bridge
  BRIDGE_POWERED_ON: 'Check that the bridge IP address is correct and the bridge is powered on',
  BRIDGE_TIMEOUT:
    'The bridge is not responding. Check your network connection and bridge IP address',
  BRIDGE_REFUSED: 'Connection refused. Verify the bridge IP address is correct',
  CHECK_API_KEY: 'Check your username/API key is valid',

  // Retry
  TRY_AGAIN: 'This might be a temporary issue. Try again in a moment',
  CONTACT_SUPPORT: 'Try again or contact support if the problem persists',
  RATE_LIMIT: (seconds) => `Wait ${seconds} seconds before trying again`,

  // Resources
  CHECK_RESOURCE: (resourceType) =>
    `Check the ${resourceType} ID or refresh the dashboard to get current ${resourceType}s`,
  CHECK_RESOURCE_FORMAT: (resourceType) => `Check the ${resourceType} data format`,
  MISSING_PARAM: (param) => `Provide ${param} in the request headers or query parameters`,

  // API
  CHECK_API_DOCS: 'Check the API documentation at /api/v2/docs',
};
