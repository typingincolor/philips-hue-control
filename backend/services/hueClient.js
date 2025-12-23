import axios from 'axios';
import https from 'https';

/**
 * HueClient - Low-level Hue Bridge API client
 * Handles all communication with the Philips Hue Bridge
 */
class HueClient {
  constructor() {
    // Create HTTPS agent that accepts self-signed certificates
    this.httpsAgent = new https.Agent({
      rejectUnauthorized: false
    });
  }

  /**
   * Make a request to the Hue Bridge
   * @private
   */
  async _request(method, bridgeIp, path, username, data = null) {
    const url = `https://${bridgeIp}${path}`;

    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        'hue-application-key': username
      },
      httpsAgent: this.httpsAgent,
      validateStatus: () => true // Accept all status codes
    };

    if (data && method !== 'GET') {
      config.data = data;
    }

    try {
      const response = await axios(config);

      // Check for HTTP errors
      if (response.status >= 400) {
        throw new Error(`Bridge returned ${response.status}: ${JSON.stringify(response.data)}`);
      }

      // Check for Hue API v2 errors
      if (response.data?.errors && response.data.errors.length > 0) {
        const error = response.data.errors[0];
        throw new Error(`Hue API error: ${error.description || JSON.stringify(error)}`);
      }

      return response.data;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Cannot connect to bridge at ${bridgeIp}. Check IP address and network.`);
      }
      if (error.code === 'ETIMEDOUT') {
        throw new Error(`Bridge at ${bridgeIp} timed out. Check network connection.`);
      }
      throw error;
    }
  }

  /**
   * Get all lights
   */
  async getLights(bridgeIp, username) {
    return this._request('GET', bridgeIp, '/clip/v2/resource/light', username);
  }

  /**
   * Get all rooms
   */
  async getRooms(bridgeIp, username) {
    return this._request('GET', bridgeIp, '/clip/v2/resource/room', username);
  }

  /**
   * Get all devices
   */
  async getDevices(bridgeIp, username) {
    return this._request('GET', bridgeIp, '/clip/v2/resource/device', username);
  }

  /**
   * Get all scenes
   */
  async getScenes(bridgeIp, username) {
    return this._request('GET', bridgeIp, '/clip/v2/resource/scene', username);
  }

  /**
   * Get all zones
   */
  async getZones(bridgeIp, username) {
    return this._request('GET', bridgeIp, '/clip/v2/resource/zone', username);
  }

  /**
   * Get a specific resource type
   */
  async getResource(bridgeIp, username, resourceType) {
    return this._request('GET', bridgeIp, `/clip/v2/resource/${resourceType}`, username);
  }

  /**
   * Update a light's state
   */
  async updateLight(bridgeIp, username, lightId, state) {
    return this._request('PUT', bridgeIp, `/clip/v2/resource/light/${lightId}`, username, state);
  }

  /**
   * Activate a scene
   */
  async activateScene(bridgeIp, username, sceneId) {
    return this._request('PUT', bridgeIp, `/clip/v2/resource/scene/${sceneId}`, username, {
      recall: { action: 'active' }
    });
  }

  /**
   * Update multiple lights in parallel
   */
  async updateLights(bridgeIp, username, lightUpdates) {
    const promises = lightUpdates.map(({ lightId, state }) =>
      this.updateLight(bridgeIp, username, lightId, state)
    );
    return Promise.all(promises);
  }
}

// Export singleton instance
export default new HueClient();
