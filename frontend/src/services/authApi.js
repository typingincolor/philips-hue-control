/**
 * Auth API - Client for the V2 Auth API
 */

const API_BASE = '/api/v2/auth';

// Session token management
let sessionToken = null;

export const setSessionToken = (token) => {
  sessionToken = token;
};

export const getSessionToken = () => {
  return sessionToken;
};

export const clearSessionToken = () => {
  sessionToken = null;
};

/**
 * Get request headers
 * @param {boolean} includeAuth - Include authorization header
 * @returns {Object} Headers object
 */
function getHeaders(includeAuth = false) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (includeAuth && sessionToken) {
    headers['Authorization'] = `Bearer ${sessionToken}`;
  }

  return headers;
}

/**
 * Handle fetch response
 * @param {Response} response - Fetch response
 * @returns {Promise<Object>} Response data
 */
async function handleResponse(response) {
  const data = await response.json();

  if (!response.ok) {
    // Handle specific error cases
    if (response.status === 424 && data.requiresLinkButton) {
      throw new Error('Please press the link button on the bridge');
    }
    if (response.status === 401 && data.requiresPairing) {
      throw new Error('PAIRING_REQUIRED');
    }
    throw new Error(data.error || `HTTP error! status: ${response.status}`);
  }

  return data;
}

/**
 * Pair with a Hue Bridge
 * @param {string} bridgeIp - Bridge IP address
 * @param {string} appName - Application name (optional)
 * @returns {Promise<string>} Username from pairing
 */
export async function pair(bridgeIp, appName = 'hue_control_app') {
  const response = await fetch(`${API_BASE}/pair`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ bridgeIp, appName }),
  });

  const data = await handleResponse(response);
  return data.username;
}

/**
 * Connect to a bridge using stored credentials
 * @param {string} bridgeIp - Bridge IP address
 * @returns {Promise<Object>} Session info { sessionToken, expiresIn }
 */
export async function connect(bridgeIp) {
  const response = await fetch(`${API_BASE}/connect`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ bridgeIp }),
  });

  return handleResponse(response);
}

/**
 * Create a new session
 * @param {string} bridgeIp - Bridge IP address
 * @param {string} username - Hue API username
 * @returns {Promise<Object>} Session info { sessionToken, expiresIn }
 */
export async function createSession(bridgeIp, username) {
  const response = await fetch(`${API_BASE}/session`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ bridgeIp, username }),
  });

  return handleResponse(response);
}

/**
 * Refresh the current session
 * @returns {Promise<Object>} New session info { sessionToken, expiresIn }
 */
export async function refreshSession() {
  const response = await fetch(`${API_BASE}/refresh`, {
    method: 'POST',
    headers: getHeaders(true),
  });

  return handleResponse(response);
}

/**
 * Revoke the current session
 * @returns {Promise<Object>} Result { success: boolean }
 */
export async function revokeSession() {
  const response = await fetch(`${API_BASE}/session`, {
    method: 'DELETE',
    headers: getHeaders(true),
  });

  return handleResponse(response);
}

/**
 * Disconnect and clear credentials
 * @returns {Promise<Object>} Result { success: boolean }
 */
export async function disconnect() {
  const response = await fetch(`${API_BASE}/disconnect`, {
    method: 'POST',
    headers: getHeaders(true),
  });

  return handleResponse(response);
}

/**
 * Check if bridge has stored credentials
 * @param {string} bridgeIp - Bridge IP address
 * @returns {Promise<boolean>} Whether credentials exist
 */
export async function checkBridgeStatus(bridgeIp) {
  try {
    const response = await fetch(`${API_BASE}/bridge-status?bridgeIp=${bridgeIp}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    const data = await response.json();
    return data.hasCredentials ?? false;
  } catch {
    return false;
  }
}
