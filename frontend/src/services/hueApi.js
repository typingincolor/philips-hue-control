// Use relative URLs - works with Vite proxy in dev and same-origin in production
const PROXY_URL = '';

/**
 * Centralized request handler for Hue API calls
 * Handles HTTP errors, V2 API errors, and network errors consistently
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Response data
 */
const request = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // V2 API error handling
    if (data.errors && data.errors.length > 0) {
      throw new Error(data.errors[0].description);
    }

    return data;
  } catch (error) {
    console.error(`[HueApi] Request failed:`, error);

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
      console.error('Bridge discovery error:', error);
      throw new Error('Could not discover bridges. Please enter IP manually.');
    }
  },

  /**
   * Create a new user (requires link button press)
   * @param {string} bridgeIp - The IP address of the bridge
   * @param {string} appName - The application name for device type
   * @returns {Promise<string>} The generated username
   */
  async createUser(bridgeIp, appName = 'hue_verification_app') {
    try {
      const url = `${PROXY_URL}/api/hue/api?bridgeIp=${bridgeIp}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ devicetype: appName })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Check for error (link button not pressed)
      if (data[0]?.error) {
        throw new Error(data[0].error.description);
      }

      // Return username
      if (data[0]?.success?.username) {
        return data[0].success.username;
      }

      throw new Error('Unexpected response format');
    } catch (error) {
      console.error('Authentication error:', error);

      // Check if it's a network error
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        throw new Error('Could not connect to proxy server. Make sure it is running.');
      }

      throw error;
    }
  },

  /**
   * Get all resources using Hue API v2
   * @param {string} bridgeIp - The IP address of the bridge
   * @param {string} username - The authenticated username (used as application key)
   * @param {string} resourceType - The resource type (e.g., 'light', 'room', 'device', 'scene', 'behavior_instance')
   * @returns {Promise<Object>} Object containing resource data
   */
  async getResource(bridgeIp, username, resourceType) {
    const url = `${PROXY_URL}/api/hue/clip/v2/resource/${resourceType}?bridgeIp=${bridgeIp}`;
    return request(url, {
      headers: { 'hue-application-key': username }
    });
  },

  /**
   * Get all lights using Hue API v2
   * Convenience wrapper around getResource
   * @param {string} bridgeIp - The IP address of the bridge
   * @param {string} username - The authenticated username (used as application key)
   * @returns {Promise<Object>} Object containing light data
   */
  getLights: (bridgeIp, username) => hueApi.getResource(bridgeIp, username, 'light'),

  /**
   * Get all rooms using Hue API v2
   * Convenience wrapper around getResource
   * @param {string} bridgeIp - The IP address of the bridge
   * @param {string} username - The authenticated username (used as application key)
   * @returns {Promise<Object>} Object containing room data
   */
  getRooms: (bridgeIp, username) => hueApi.getResource(bridgeIp, username, 'room'),

  /**
   * Get all scenes using Hue API v2
   * Convenience wrapper around getResource
   * @param {string} bridgeIp - The IP address of the bridge
   * @param {string} username - The authenticated username (used as application key)
   * @returns {Promise<Object>} Object containing scene data
   */
  getScenes: (bridgeIp, username) => hueApi.getResource(bridgeIp, username, 'scene'),

  /**
   * Set light state using Hue API v2
   * @param {string} bridgeIp - The IP address of the bridge
   * @param {string} username - The authenticated username (used as application key)
   * @param {string} lightId - The light UUID
   * @param {Object} state - The state to set (e.g., { on: { on: true } })
   * @returns {Promise<Object>} Response from the bridge
   */
  async setLightState(bridgeIp, username, lightId, state) {
    const url = `${PROXY_URL}/api/hue/clip/v2/resource/light/${lightId}?bridgeIp=${bridgeIp}`;
    return request(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'hue-application-key': username
      },
      body: JSON.stringify(state)
    });
  },

  /**
   * Activate a scene using Hue API v2
   * @param {string} bridgeIp - The IP address of the bridge
   * @param {string} username - The authenticated username (used as application key)
   * @param {string} sceneId - The scene UUID
   * @returns {Promise<Object>} Response from the bridge
   */
  async activateScene(bridgeIp, username, sceneId) {
    const url = `${PROXY_URL}/api/hue/clip/v2/resource/scene/${sceneId}?bridgeIp=${bridgeIp}`;
    return request(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'hue-application-key': username
      },
      body: JSON.stringify({ recall: { action: 'active' } })
    });
  }
};
