/**
 * Services API - Client for the unified V2 Services API
 */

const API_BASE = '/api/v2/services';

/**
 * Get request headers including demo mode if enabled
 * @param {boolean} demoMode - Whether demo mode is enabled
 * @returns {Object} Headers object
 */
function getHeaders(demoMode = false) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (demoMode) {
    headers['X-Demo-Mode'] = 'true';
  }

  return headers;
}

/**
 * Handle fetch response, throwing on error
 * @param {Response} response - Fetch response
 * @returns {Promise<Object>} Response data
 */
async function handleResponse(response) {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

/**
 * Get all available services
 * @param {boolean} demoMode - Whether demo mode is enabled
 * @returns {Promise<Object>} Object with services array
 */
export async function getServices(demoMode = false) {
  const response = await fetch(API_BASE, {
    method: 'GET',
    headers: getHeaders(demoMode),
  });
  return handleResponse(response);
}

/**
 * Get a single service by ID
 * @param {string} serviceId - Service ID (e.g., 'hue', 'hive')
 * @param {boolean} demoMode - Whether demo mode is enabled
 * @returns {Promise<Object>} Service info and connection status
 */
export async function getService(serviceId, demoMode = false) {
  const response = await fetch(`${API_BASE}/${serviceId}`, {
    method: 'GET',
    headers: getHeaders(demoMode),
  });
  return handleResponse(response);
}

/**
 * Connect to a service
 * @param {string} serviceId - Service ID
 * @param {Object} credentials - Service-specific credentials
 * @param {boolean} demoMode - Whether demo mode is enabled
 * @returns {Promise<Object>} Connection result (may include requires2fa or requiresPairing)
 */
export async function connectService(serviceId, credentials, demoMode = false) {
  const response = await fetch(`${API_BASE}/${serviceId}/connect`, {
    method: 'POST',
    headers: getHeaders(demoMode),
    body: JSON.stringify(credentials),
  });
  return handleResponse(response);
}

/**
 * Disconnect from a service
 * @param {string} serviceId - Service ID
 * @param {boolean} demoMode - Whether demo mode is enabled
 * @returns {Promise<Object>} Result object
 */
export async function disconnectService(serviceId, demoMode = false) {
  const response = await fetch(`${API_BASE}/${serviceId}/disconnect`, {
    method: 'POST',
    headers: getHeaders(demoMode),
  });
  return handleResponse(response);
}

/**
 * Get service status/data
 * @param {string} serviceId - Service ID
 * @param {boolean} demoMode - Whether demo mode is enabled
 * @returns {Promise<Object>} Service-specific status data
 */
export async function getServiceStatus(serviceId, demoMode = false) {
  const response = await fetch(`${API_BASE}/${serviceId}/status`, {
    method: 'GET',
    headers: getHeaders(demoMode),
  });
  return handleResponse(response);
}

// ============================================================================
// Hue-specific endpoints
// ============================================================================

/**
 * Pair with a Hue bridge (user must press link button first)
 * @param {string} bridgeIp - Bridge IP address
 * @param {boolean} demoMode - Whether demo mode is enabled
 * @returns {Promise<Object>} Result with success and username
 */
export async function pairHue(bridgeIp, demoMode = false) {
  const response = await fetch(`${API_BASE}/hue/pair`, {
    method: 'POST',
    headers: getHeaders(demoMode),
    body: JSON.stringify({ bridgeIp }),
  });
  return handleResponse(response);
}

// ============================================================================
// Hive-specific endpoints
// ============================================================================

/**
 * Verify Hive 2FA code
 * @param {string} code - SMS verification code
 * @param {string} session - 2FA session from connect response
 * @param {string} username - Hive username/email
 * @param {boolean} demoMode - Whether demo mode is enabled
 * @returns {Promise<Object>} Result object
 */
export async function verifyHive2fa(code, session, username, demoMode = false) {
  const response = await fetch(`${API_BASE}/hive/verify-2fa`, {
    method: 'POST',
    headers: getHeaders(demoMode),
    body: JSON.stringify({ code, session, username }),
  });
  return handleResponse(response);
}

/**
 * Get Hive heating schedules
 * @param {boolean} demoMode - Whether demo mode is enabled
 * @returns {Promise<Array>} Array of schedule objects
 */
export async function getHiveSchedules(demoMode = false) {
  const response = await fetch(`${API_BASE}/hive/schedules`, {
    method: 'GET',
    headers: getHeaders(demoMode),
  });
  return handleResponse(response);
}

// ============================================================================
// Spotify-specific endpoints
// ============================================================================

/**
 * Get Spotify OAuth authorization URL
 * @param {boolean} demoMode - Whether demo mode is enabled
 * @returns {Promise<Object>} Object with authUrl
 */
export async function getSpotifyAuthUrl(demoMode = false) {
  const response = await fetch(`${API_BASE}/spotify/auth-url`, {
    method: 'GET',
    headers: getHeaders(demoMode),
  });
  return handleResponse(response);
}

/**
 * Get Spotify available devices
 * @param {boolean} demoMode - Whether demo mode is enabled
 * @returns {Promise<Object>} Object with devices array
 */
export async function getSpotifyDevices(demoMode = false) {
  const response = await fetch(`${API_BASE}/spotify/devices`, {
    method: 'GET',
    headers: getHeaders(demoMode),
  });
  return handleResponse(response);
}

/**
 * Get Spotify user's playlists
 * @param {boolean} demoMode - Whether demo mode is enabled
 * @returns {Promise<Object>} Object with playlists array
 */
export async function getSpotifyPlaylists(demoMode = false) {
  const response = await fetch(`${API_BASE}/spotify/playlists`, {
    method: 'GET',
    headers: getHeaders(demoMode),
  });
  return handleResponse(response);
}

/**
 * Get Spotify current playback state
 * @param {boolean} demoMode - Whether demo mode is enabled
 * @returns {Promise<Object>} Object with playback state
 */
export async function getSpotifyPlayback(demoMode = false) {
  const response = await fetch(`${API_BASE}/spotify/playback`, {
    method: 'GET',
    headers: getHeaders(demoMode),
  });
  return handleResponse(response);
}

/**
 * Start or resume Spotify playback
 * @param {Object} options - Playback options
 * @param {string} options.deviceId - Target device ID
 * @param {string} options.contextUri - Playlist/album URI to play
 * @param {Array<string>} options.uris - Track URIs to play
 * @param {boolean} demoMode - Whether demo mode is enabled
 * @returns {Promise<Object>} Result object
 */
export async function spotifyPlay(options = {}, demoMode = false) {
  const response = await fetch(`${API_BASE}/spotify/play`, {
    method: 'POST',
    headers: getHeaders(demoMode),
    body: JSON.stringify(options),
  });
  return handleResponse(response);
}

/**
 * Pause Spotify playback
 * @param {string} deviceId - Target device ID
 * @param {boolean} demoMode - Whether demo mode is enabled
 * @returns {Promise<Object>} Result object
 */
export async function spotifyPause(deviceId, demoMode = false) {
  const response = await fetch(`${API_BASE}/spotify/pause`, {
    method: 'POST',
    headers: getHeaders(demoMode),
    body: JSON.stringify({ deviceId }),
  });
  return handleResponse(response);
}

/**
 * Skip to next track
 * @param {string} deviceId - Target device ID
 * @param {boolean} demoMode - Whether demo mode is enabled
 * @returns {Promise<Object>} Result object
 */
export async function spotifyNext(deviceId, demoMode = false) {
  const response = await fetch(`${API_BASE}/spotify/next`, {
    method: 'POST',
    headers: getHeaders(demoMode),
    body: JSON.stringify({ deviceId }),
  });
  return handleResponse(response);
}

/**
 * Skip to previous track
 * @param {string} deviceId - Target device ID
 * @param {boolean} demoMode - Whether demo mode is enabled
 * @returns {Promise<Object>} Result object
 */
export async function spotifyPrevious(deviceId, demoMode = false) {
  const response = await fetch(`${API_BASE}/spotify/previous`, {
    method: 'POST',
    headers: getHeaders(demoMode),
    body: JSON.stringify({ deviceId }),
  });
  return handleResponse(response);
}

/**
 * Set Spotify playback volume
 * @param {number} volumePercent - Volume 0-100
 * @param {string} deviceId - Target device ID
 * @param {boolean} demoMode - Whether demo mode is enabled
 * @returns {Promise<Object>} Result object
 */
export async function setSpotifyVolume(volumePercent, deviceId, demoMode = false) {
  const response = await fetch(`${API_BASE}/spotify/volume`, {
    method: 'PUT',
    headers: getHeaders(demoMode),
    body: JSON.stringify({ volumePercent, deviceId }),
  });
  return handleResponse(response);
}

/**
 * Toggle Spotify shuffle mode
 * @param {boolean} state - Shuffle on/off
 * @param {string} deviceId - Target device ID
 * @param {boolean} demoMode - Whether demo mode is enabled
 * @returns {Promise<Object>} Result object
 */
export async function setSpotifyShuffle(state, deviceId, demoMode = false) {
  const response = await fetch(`${API_BASE}/spotify/shuffle`, {
    method: 'PUT',
    headers: getHeaders(demoMode),
    body: JSON.stringify({ state, deviceId }),
  });
  return handleResponse(response);
}

/**
 * Transfer playback to a device
 * @param {string} deviceId - Target device ID
 * @param {boolean} play - Start playing on new device
 * @param {boolean} demoMode - Whether demo mode is enabled
 * @returns {Promise<Object>} Result object
 */
export async function setSpotifyDevice(deviceId, play = true, demoMode = false) {
  const response = await fetch(`${API_BASE}/spotify/device`, {
    method: 'PUT',
    headers: getHeaders(demoMode),
    body: JSON.stringify({ deviceId, play }),
  });
  return handleResponse(response);
}
