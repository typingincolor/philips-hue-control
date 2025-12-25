import { createLogger } from '../utils/logger';

const logger = createLogger('HueApi');

// Use relative URLs - works with Vite proxy in dev and same-origin in production
const PROXY_URL = '';

// Check if demo mode from URL (cached for performance)
let demoModeCache = null;
const isDemoMode = () => {
  if (demoModeCache === null) {
    const params = new URLSearchParams(window.location.search);
    demoModeCache = params.get('demo') === 'true';
  }
  return demoModeCache;
};

// Reset cache when needed (e.g., for testing)
export const resetDemoModeCache = () => {
  demoModeCache = null;
};

/**
 * Centralized request handler for Hue API calls
 * Handles HTTP errors, V2 API errors, and network errors consistently
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @param {string} sessionToken - Optional session token for Authorization header
 * @returns {Promise<Object>} Response data
 */
const request = async (url, options = {}, sessionToken = null) => {
  try {
    // Initialize headers object
    options.headers = options.headers || {};

    // Add demo mode header if in demo mode
    if (isDemoMode()) {
      options.headers['X-Demo-Mode'] = 'true';
    }

    // Add session token to Authorization header if provided
    if (sessionToken) {
      options.headers.Authorization = `Bearer ${sessionToken}`;
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      // Check for session expiration (401 Unauthorized)
      if (response.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // V2 API error handling
    if (data.errors && data.errors.length > 0) {
      throw new Error(data.errors[0].description);
    }

    return data;
  } catch (error) {
    logger.error('Request failed:', error);

    // Network error detection
    if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
      throw new Error('Could not connect to proxy server. Make sure it is running.');
    }
    throw error;
  }
};

export const hueApi = {
  /**
   * Discover Hue bridges on the network
   * @returns {Promise<Array>} Array of bridge objects with id and internalipaddress
   */
  async discoverBridge() {
    try {
      const response = await fetch(`${PROXY_URL}/api/discovery`);
      if (!response.ok) throw new Error('Discovery failed');
      const data = await response.json();
      return data;
    } catch (error) {
      logger.error('Bridge discovery error:', error);
      throw new Error('Could not discover bridges. Please enter IP manually.');
    }
  },

  /**
   * Create a new user (requires link button press)
   * @param {string} bridgeIp - The IP address of the bridge
   * @param {string} appName - The application name for device type
   * @returns {Promise<string>} The generated username
   */
  async createUser(bridgeIp, appName = 'hue_control_app') {
    const url = `${PROXY_URL}/api/v1/auth/pair`;
    logger.info('createUser: sending pair request', { bridgeIp, url });
    const data = await request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bridgeIp, appName }),
    });
    logger.info('createUser: received response', { username: data.username });
    return data.username;
  },

  /**
   * Connect to a bridge using stored server-side credentials (no pairing needed)
   * In demo mode, returns a demo session automatically
   * @param {string} bridgeIp - The IP address of the bridge
   * @returns {Promise<Object>} Session info with token, or throws if pairing required
   */
  async connect(bridgeIp) {
    const url = `${PROXY_URL}/api/v1/auth/connect`;
    logger.info('connect: trying stored credentials', { bridgeIp, demoMode: isDemoMode() });

    const headers = { 'Content-Type': 'application/json' };
    if (isDemoMode()) {
      headers['X-Demo-Mode'] = 'true';
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ bridgeIp }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.requiresPairing) {
        logger.info('connect: pairing required');
        throw new Error('PAIRING_REQUIRED');
      }
      throw new Error(data.error || 'Failed to connect');
    }

    logger.info('connect: connected with stored credentials');
    return data;
  },

  /**
   * Check if a bridge has stored credentials on the server
   * @param {string} bridgeIp - The IP address of the bridge
   * @returns {Promise<boolean>} True if credentials exist
   */
  async checkBridgeStatus(bridgeIp) {
    const url = `${PROXY_URL}/api/v1/auth/bridge-status?bridgeIp=${encodeURIComponent(bridgeIp)}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      return data.hasCredentials;
    } catch {
      return false;
    }
  },

  // ============================================================
  // V1 API Methods (Simplified, Pre-computed Data)
  // ============================================================

  /**
   * Create a session token (V1 API)
   * @param {string} bridgeIp - The IP address of the bridge
   * @param {string} username - The authenticated username
   * @returns {Promise<Object>} Session info with token
   */
  async createSession(bridgeIp, username) {
    const url = `${PROXY_URL}/api/v1/auth/session`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bridgeIp, username }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create session');
    }

    return response.json();
  },

  /**
   * Get unified dashboard data (V1 API)
   * Returns pre-computed colors, shadows, room hierarchy, and statistics in a single call
   * @param {string} sessionToken - Session token
   * @returns {Promise<Object>} Dashboard data with summary and rooms
   */
  async getDashboard(sessionToken) {
    const url = `${PROXY_URL}/api/v1/dashboard`;
    return request(url, {}, sessionToken);
  },

  /**
   * Get motion zones (V1 API)
   * Returns parsed MotionAware zones with status
   * @param {string} sessionToken - Session token
   * @returns {Promise<Object>} Motion zones data
   */
  async getMotionZones(sessionToken) {
    const url = `${PROXY_URL}/api/v1/motion-zones`;
    return request(url, {}, sessionToken);
  },

  /**
   * Update a light (V1 API - simplified)
   * @param {string} sessionToken - Session token
   * @param {string} lightId - The light UUID
   * @param {Object} state - Simplified state { on: boolean, brightness: number }
   * @returns {Promise<Object>} Updated light with pre-computed color/shadow
   */
  async updateLight(sessionToken, lightId, state) {
    const url = `${PROXY_URL}/api/v1/lights/${lightId}`;

    return request(
      url,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      },
      sessionToken
    );
  },

  /**
   * Update all lights in a room (V1 API)
   * @param {string} sessionToken - Session token
   * @param {string} roomId - The room UUID
   * @param {Object} state - Simplified state { on: boolean, brightness: number }
   * @returns {Promise<Object>} Updated lights with pre-computed colors/shadows
   */
  async updateRoomLights(sessionToken, roomId, state) {
    const url = `${PROXY_URL}/api/v1/rooms/${roomId}/lights`;

    return request(
      url,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      },
      sessionToken
    );
  },

  /**
   * Update all lights in a zone (V1 API)
   * @param {string} sessionToken - Session token
   * @param {string} zoneId - The zone UUID
   * @param {Object} state - Simplified state { on: boolean, brightness: number }
   * @returns {Promise<Object>} Updated lights with pre-computed colors/shadows
   */
  async updateZoneLights(sessionToken, zoneId, state) {
    const url = `${PROXY_URL}/api/v1/zones/${zoneId}/lights`;

    return request(
      url,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      },
      sessionToken
    );
  },

  /**
   * Activate a scene (V1 API)
   * @param {string} sessionToken - Session token
   * @param {string} sceneId - The scene UUID
   * @returns {Promise<Object>} Affected lights with pre-computed colors/shadows
   */
  async activateSceneV1(sessionToken, sceneId) {
    const url = `${PROXY_URL}/api/v1/scenes/${sceneId}/activate`;
    return request(url, { method: 'POST' }, sessionToken);
  },

  /**
   * Refresh session token (extends expiration)
   * @param {string} sessionToken - Current session token
   * @returns {Promise<Object>} New session info { sessionToken, expiresIn, bridgeIp }
   */
  async refreshSession(sessionToken) {
    const url = `${PROXY_URL}/api/v1/auth/refresh`;
    return request(url, { method: 'POST' }, sessionToken);
  },

  /**
   * Revoke current session (logout)
   * @param {string} sessionToken - Session token to revoke
   * @returns {Promise<Object>} Success response
   */
  async revokeSession(sessionToken) {
    const url = `${PROXY_URL}/api/v1/auth/session`;
    return request(url, { method: 'DELETE' }, sessionToken);
  },

  // ============================================================
  // Settings API Methods
  // ============================================================

  /**
   * Get current settings (location, units)
   * @param {string} sessionToken - Session token
   * @returns {Promise<Object>} Settings { location, units }
   */
  async getSettings(sessionToken) {
    const url = `${PROXY_URL}/api/v1/settings`;
    return request(url, {}, sessionToken);
  },

  /**
   * Update settings
   * @param {string} sessionToken - Session token
   * @param {Object} settings - Settings to update { location, units }
   * @returns {Promise<Object>} Updated settings
   */
  async updateSettings(sessionToken, settings) {
    const url = `${PROXY_URL}/api/v1/settings`;
    return request(
      url,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      },
      sessionToken
    );
  },

  /**
   * Update location setting
   * @param {string} sessionToken - Session token
   * @param {Object} location - Location { lat, lon, name }
   * @returns {Promise<Object>} Updated settings
   */
  async updateLocation(sessionToken, location) {
    const url = `${PROXY_URL}/api/v1/settings/location`;
    return request(
      url,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(location),
      },
      sessionToken
    );
  },

  /**
   * Clear location setting
   * @param {string} sessionToken - Session token
   * @returns {Promise<Object>} Updated settings
   */
  async clearLocation(sessionToken) {
    const url = `${PROXY_URL}/api/v1/settings/location`;
    return request(url, { method: 'DELETE' }, sessionToken);
  },

  // ============================================================
  // Weather API Methods
  // ============================================================

  /**
   * Get weather for current location
   * @param {string} sessionToken - Session token
   * @returns {Promise<Object>} Weather data { current, forecast }
   */
  async getWeather(sessionToken) {
    const url = `${PROXY_URL}/api/v1/weather`;
    return request(url, {}, sessionToken);
  },
};
