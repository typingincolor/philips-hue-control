/**
 * Shared API utilities for V2 API clients
 */

import { getSessionToken } from './authApi';

/**
 * Get request headers with optional auth and demo mode
 * @param {Object} options - Header options
 * @param {boolean} options.includeAuth - Include authorization header (default: true)
 * @param {boolean} options.demoMode - Include demo mode header
 * @returns {Object} Headers object
 */
export function getHeaders({ includeAuth = true, demoMode = false } = {}) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = getSessionToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  if (demoMode) {
    headers['X-Demo-Mode'] = 'true';
  }

  return headers;
}

/**
 * Handle fetch response with standard error handling
 * @param {Response} response - Fetch response
 * @param {Object} options - Handler options
 * @param {Object} options.errorMap - Map of status codes to error messages
 * @returns {Promise<Object>} Response data
 */
export async function handleResponse(response, { errorMap = {} } = {}) {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));

    // Check custom error map first
    if (errorMap[response.status]) {
      throw new Error(errorMap[response.status]);
    }

    throw new Error(data.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}
