import axios from 'axios';
import { CACHE_TTL_MS, REQUEST_TIMEOUT_MS } from '../constants/timings.js';
import { createLogger } from '../utils/logger.js';
import { hueHttpsAgent } from '../utils/httpsAgent.js';

const logger = createLogger('HUE_CLIENT');

/**
 * HueClient - Low-level Hue Bridge API client
 * Handles all communication with the Philips Hue Bridge
 * Includes caching for static resources (rooms, devices, zones, scenes)
 */
class HueClient {
  constructor() {
    this.httpsAgent = hueHttpsAgent;

    // Cache for static resources
    this.cache = new Map();
    this.cacheTTL = CACHE_TTL_MS;
  }

  /**
   * Get cached data or fetch fresh
   * @private
   */
  _getCached(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }
    return null;
  }

  /**
   * Store data in cache
   * @private
   */
  _setCache(key, data) {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.cacheTTL,
    });
  }

  /**
   * Clear cache for a specific bridge or all bridges
   */
  clearCache(bridgeIp = null) {
    if (bridgeIp) {
      for (const key of this.cache.keys()) {
        if (key.startsWith(bridgeIp)) {
          this.cache.delete(key);
        }
      }
      logger.debug('Cleared cache', { bridgeIp });
    } else {
      this.cache.clear();
      logger.debug('Cleared all cache');
    }
  }

  /**
   * Create a new user on the Hue Bridge (requires link button to be pressed)
   * Uses v1 API endpoint as user creation isn't available in v2
   * @param {string} bridgeIp - Bridge IP address
   * @returns {Promise<string>} The created username
   */
  async createUser(bridgeIp) {
    const url = `https://${bridgeIp}/api`;

    const config = {
      method: 'POST',
      url,
      headers: { 'Content-Type': 'application/json' },
      data: {
        devicetype: 'home-control#app',
        generateclientkey: true,
      },
      httpsAgent: this.httpsAgent,
      timeout: REQUEST_TIMEOUT_MS,
      validateStatus: () => true,
    };

    try {
      const response = await axios(config);

      // Hue v1 API returns an array
      const result = response.data?.[0];

      if (result?.error) {
        const errorType = result.error.type;
        if (errorType === 101) {
          throw new Error(
            'Link button not pressed. Press the button on your Hue Bridge and try again.'
          );
        }
        throw new Error(result.error.description || 'Failed to create user');
      }

      if (result?.success?.username) {
        logger.info('Created Hue user', { bridgeIp });
        return result.success.username;
      }

      throw new Error('Unexpected response from bridge');
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Cannot connect to bridge at ${bridgeIp}. Check IP address and network.`);
      }
      throw error;
    }
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
        'hue-application-key': username,
      },
      httpsAgent: this.httpsAgent,
      timeout: REQUEST_TIMEOUT_MS,
      validateStatus: () => true, // Accept all status codes
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
   * Get all lights (NOT cached - changes frequently)
   */
  async getLights(bridgeIp, username) {
    return this._request('GET', bridgeIp, '/clip/v2/resource/light', username);
  }

  /**
   * Get all rooms (cached - rarely changes)
   */
  async getRooms(bridgeIp, username) {
    const cacheKey = `${bridgeIp}:rooms`;
    const cached = this._getCached(cacheKey);
    if (cached) return cached;

    const data = await this._request('GET', bridgeIp, '/clip/v2/resource/room', username);
    this._setCache(cacheKey, data);
    return data;
  }

  /**
   * Get all devices (cached - rarely changes)
   */
  async getDevices(bridgeIp, username) {
    const cacheKey = `${bridgeIp}:devices`;
    const cached = this._getCached(cacheKey);
    if (cached) return cached;

    const data = await this._request('GET', bridgeIp, '/clip/v2/resource/device', username);
    this._setCache(cacheKey, data);
    return data;
  }

  /**
   * Get all scenes (cached - rarely changes)
   */
  async getScenes(bridgeIp, username) {
    const cacheKey = `${bridgeIp}:scenes`;
    const cached = this._getCached(cacheKey);
    if (cached) return cached;

    const data = await this._request('GET', bridgeIp, '/clip/v2/resource/scene', username);
    this._setCache(cacheKey, data);
    return data;
  }

  /**
   * Get all zones (cached - rarely changes)
   */
  async getZones(bridgeIp, username) {
    const cacheKey = `${bridgeIp}:zones`;
    const cached = this._getCached(cacheKey);
    if (cached) return cached;

    const data = await this._request('GET', bridgeIp, '/clip/v2/resource/zone', username);
    this._setCache(cacheKey, data);
    return data;
  }

  /**
   * Get a specific resource type
   * Caches static resources: behavior_instance
   * Does NOT cache dynamic resources: convenience_area_motion, light, etc.
   */
  async getResource(bridgeIp, username, resourceType) {
    // Cache behavior_instance (motion zone configuration - rarely changes)
    const cachedTypes = ['behavior_instance'];

    if (cachedTypes.includes(resourceType)) {
      const cacheKey = `${bridgeIp}:${resourceType}`;
      const cached = this._getCached(cacheKey);
      if (cached) return cached;

      const data = await this._request(
        'GET',
        bridgeIp,
        `/clip/v2/resource/${resourceType}`,
        username
      );
      this._setCache(cacheKey, data);
      return data;
    }

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
      recall: { action: 'active' },
    });
  }

  /**
   * Trigger a smart scene (automation)
   */
  async triggerSmartScene(bridgeIp, username, smartSceneId) {
    return this._request(
      'PUT',
      bridgeIp,
      `/clip/v2/resource/smart_scene/${smartSceneId}`,
      username,
      {
        recall: { action: 'activate' },
      }
    );
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

  /**
   * Get room hierarchy data (lights, rooms, devices) in parallel
   * Used by room-based operations
   */
  async getHierarchyData(bridgeIp, username) {
    const [lightsData, roomsData, devicesData] = await Promise.all([
      this.getLights(bridgeIp, username),
      this.getRooms(bridgeIp, username),
      this.getDevices(bridgeIp, username),
    ]);

    return { lightsData, roomsData, devicesData };
  }

  /**
   * Get zone hierarchy data (lights, zones, devices) in parallel
   * Used by zone-based operations
   */
  async getZoneHierarchyData(bridgeIp, username) {
    const [lightsData, zonesData, devicesData] = await Promise.all([
      this.getLights(bridgeIp, username),
      this.getZones(bridgeIp, username),
      this.getDevices(bridgeIp, username),
    ]);

    return { lightsData, zonesData, devicesData };
  }

  /**
   * Get dashboard data (lights, rooms, devices, scenes) in parallel
   * Used by dashboard endpoint
   */
  async getDashboardData(bridgeIp, username) {
    const [lightsData, roomsData, devicesData, scenesData] = await Promise.all([
      this.getLights(bridgeIp, username),
      this.getRooms(bridgeIp, username),
      this.getDevices(bridgeIp, username),
      this.getScenes(bridgeIp, username),
    ]);

    return { lightsData, roomsData, devicesData, scenesData };
  }
}

// Export singleton instance
export default new HueClient();
