// Use relative URLs - works with Vite proxy in dev and same-origin in production
const PROXY_URL = '';

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
   * Test connection by fetching lights
   * @param {string} bridgeIp - The IP address of the bridge
   * @param {string} username - The authenticated username
   * @returns {Promise<Object>} Object containing light data
   */
  async getLights(bridgeIp, username) {
    try {
      const url = `${PROXY_URL}/api/hue/api/${username}/lights?bridgeIp=${bridgeIp}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Check for API error
      if (data[0]?.error) {
        throw new Error(data[0].error.description);
      }

      return data;
    } catch (error) {
      console.error('Get lights error:', error);

      // Check if it's a network error
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        throw new Error('Could not connect to proxy server. Make sure it is running.');
      }

      throw error;
    }
  },

  /**
   * Get bridge configuration (unauthenticated)
   * @param {string} bridgeIp - The IP address of the bridge
   * @returns {Promise<Object>} Bridge configuration data
   */
  async getBridgeConfig(bridgeIp) {
    try {
      const url = `${PROXY_URL}/api/hue/api/config?bridgeIp=${bridgeIp}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get config error:', error);
      throw error;
    }
  },

  /**
   * Get all groups/rooms
   * @param {string} bridgeIp - The IP address of the bridge
   * @param {string} username - The authenticated username
   * @returns {Promise<Object>} Object containing group data
   */
  async getGroups(bridgeIp, username) {
    try {
      const url = `${PROXY_URL}/api/hue/api/${username}/groups?bridgeIp=${bridgeIp}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Check for API error
      if (data[0]?.error) {
        throw new Error(data[0].error.description);
      }

      return data;
    } catch (error) {
      console.error('Get groups error:', error);

      // Check if it's a network error
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        throw new Error('Could not connect to proxy server. Make sure it is running.');
      }

      throw error;
    }
  },

  /**
   * Set light state (on/off, brightness, color, etc.)
   * @param {string} bridgeIp - The IP address of the bridge
   * @param {string} username - The authenticated username
   * @param {string} lightId - The light ID
   * @param {Object} state - The state to set (e.g., { on: true })
   * @returns {Promise<Object>} Response from the bridge
   */
  async setLightState(bridgeIp, username, lightId, state) {
    try {
      const url = `${PROXY_URL}/api/hue/api/${username}/lights/${lightId}/state?bridgeIp=${bridgeIp}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Check for API error
      if (data[0]?.error) {
        throw new Error(data[0].error.description);
      }

      return data;
    } catch (error) {
      console.error('Set light state error:', error);

      // Check if it's a network error
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        throw new Error('Could not connect to proxy server. Make sure it is running.');
      }

      throw error;
    }
  },

  /**
   * Get all scenes
   * @param {string} bridgeIp - The IP address of the bridge
   * @param {string} username - The authenticated username
   * @returns {Promise<Object>} Object containing scene data
   */
  async getScenes(bridgeIp, username) {
    try {
      const url = `${PROXY_URL}/api/hue/api/${username}/scenes?bridgeIp=${bridgeIp}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Check for API error
      if (data[0]?.error) {
        throw new Error(data[0].error.description);
      }

      return data;
    } catch (error) {
      console.error('Get scenes error:', error);

      // Check if it's a network error
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        throw new Error('Could not connect to proxy server. Make sure it is running.');
      }

      throw error;
    }
  },

  /**
   * Activate a scene for a group
   * @param {string} bridgeIp - The IP address of the bridge
   * @param {string} username - The authenticated username
   * @param {string} groupId - The group ID
   * @param {string} sceneId - The scene ID to activate
   * @returns {Promise<Object>} Response from the bridge
   */
  async activateScene(bridgeIp, username, groupId, sceneId) {
    try {
      const url = `${PROXY_URL}/api/hue/api/${username}/groups/${groupId}/action?bridgeIp=${bridgeIp}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scene: sceneId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Check for API error
      if (data[0]?.error) {
        throw new Error(data[0].error.description);
      }

      return data;
    } catch (error) {
      console.error('Activate scene error:', error);

      // Check if it's a network error
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        throw new Error('Could not connect to proxy server. Make sure it is running.');
      }

      throw error;
    }
  }
};
