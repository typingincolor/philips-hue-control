/**
 * Hue Plugin - Service plugin for Philips Hue integration
 */

import express from 'express';
import ServicePlugin from '../ServicePlugin.js';
import sessionManager from '../sessionManager.js';
import dashboardService from '../dashboardService.js';
import { getHueClient, getHueClientForBridge } from '../hueClientFactory.js';
import { DEMO_BRIDGE_IP, DEMO_USERNAME } from '../mockData.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('HUE_PLUGIN');

class HuePluginClass extends ServicePlugin {
  static id = 'hue';
  static displayName = 'Philips Hue';
  static description = 'Control Philips Hue lights';
  static authType = 'pairing';

  constructor() {
    super();
    this._bridgeIp = null;
    this._router = null;
  }

  /**
   * Set the current bridge IP for operations
   */
  setBridgeIp(bridgeIp) {
    this._bridgeIp = bridgeIp;
  }

  /**
   * Connect to the Hue bridge
   */
  async connect(credentials, demoMode = false) {
    const { bridgeIp } = credentials;

    if (!bridgeIp) {
      return { success: false, error: 'bridgeIp is required' };
    }

    // Demo mode - always succeeds
    if (demoMode) {
      logger.debug('Demo mode: connecting to demo bridge');
      return {
        success: true,
        demoMode: true,
        sessionToken: 'demo-session',
        bridgeIp: DEMO_BRIDGE_IP,
      };
    }

    this._bridgeIp = bridgeIp;

    // Check if we have stored credentials for this bridge
    if (sessionManager.hasBridgeCredentials(bridgeIp)) {
      const username = sessionManager.getBridgeCredentials(bridgeIp);
      const session = sessionManager.createSession(bridgeIp, username);

      logger.info('Connected with stored credentials', { bridgeIp });
      return {
        success: true,
        sessionToken: session.sessionToken,
        expiresIn: session.expiresIn,
        bridgeIp: session.bridgeIp,
      };
    }

    // No credentials - need to pair first
    return { requiresPairing: true };
  }

  /**
   * Disconnect from the Hue bridge
   */
  async disconnect() {
    if (this._bridgeIp) {
      sessionManager.clearBridgeCredentials(this._bridgeIp);
      logger.info('Disconnected from bridge', { bridgeIp: this._bridgeIp });
    }
  }

  /**
   * Check if connected to a Hue bridge
   */
  isConnected(demoMode = false) {
    if (demoMode) {
      return true;
    }
    return this._bridgeIp && sessionManager.hasBridgeCredentials(this._bridgeIp);
  }

  /**
   * Get connection status
   */
  getConnectionStatus(demoMode = false) {
    if (demoMode) {
      return { connected: true, bridgeIp: DEMO_BRIDGE_IP };
    }
    return {
      connected: this.isConnected(false),
      bridgeIp: this._bridgeIp,
    };
  }

  /**
   * Get dashboard status data
   */
  async getStatus(demoMode = false) {
    if (demoMode) {
      return dashboardService.getDashboard(DEMO_BRIDGE_IP, DEMO_USERNAME);
    }

    const username = sessionManager.getBridgeCredentials(this._bridgeIp);
    if (!username) {
      throw new Error('Not connected');
    }

    return dashboardService.getDashboard(this._bridgeIp, username);
  }

  /**
   * Check if credentials exist for the current bridge
   */
  hasCredentials() {
    return this._bridgeIp && sessionManager.hasBridgeCredentials(this._bridgeIp);
  }

  /**
   * Clear credentials for the current bridge
   */
  async clearCredentials() {
    if (this._bridgeIp) {
      sessionManager.clearBridgeCredentials(this._bridgeIp);
    }
  }

  /**
   * Get demo credentials
   */
  getDemoCredentials() {
    return {
      bridgeIp: DEMO_BRIDGE_IP,
      username: DEMO_USERNAME,
    };
  }

  /**
   * Pair with the Hue bridge (press link button first)
   */
  async pair(credentials) {
    const { bridgeIp } = credentials;

    if (!bridgeIp) {
      return { success: false, error: 'bridgeIp is required' };
    }

    try {
      // Create a mock request object for the client factory
      const req = { demoMode: false };
      const client = getHueClient(req);
      const username = await client.createUser(bridgeIp);

      // Store the credentials
      sessionManager.storeBridgeCredentials(bridgeIp, username);
      this._bridgeIp = bridgeIp;

      logger.info('Paired with bridge', { bridgeIp });

      return { success: true, username };
    } catch (error) {
      logger.error('Pairing failed', { bridgeIp, error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get Express router for Hue-specific endpoints
   */
  getRouter() {
    if (this._router) {
      return this._router;
    }

    const router = express.Router();

    // POST /pair - Pair with bridge
    router.post('/pair', async (req, res, next) => {
      try {
        const result = await this.pair(req.body);
        if (!result.success) {
          return res.status(400).json({ error: result.error });
        }
        res.json(result);
      } catch (error) {
        next(error);
      }
    });

    // GET /dashboard - Get dashboard data
    router.get('/dashboard', async (req, res, next) => {
      try {
        const demoMode = req.demoMode || false;
        const status = await this.getStatus(demoMode);
        res.json(status);
      } catch (error) {
        next(error);
      }
    });

    // PUT /lights/:id - Update light state
    router.put('/lights/:id', async (req, res, next) => {
      try {
        const { id } = req.params;
        const demoMode = req.demoMode || false;
        const client = getHueClient({ demoMode });

        let bridgeIp, username;
        if (demoMode) {
          bridgeIp = DEMO_BRIDGE_IP;
          username = DEMO_USERNAME;
        } else {
          bridgeIp = this._bridgeIp || req.hue?.bridgeIp;
          username = sessionManager.getBridgeCredentials(bridgeIp);
        }

        const result = await client.updateLight(bridgeIp, username, id, req.body);
        res.json(result);
      } catch (error) {
        next(error);
      }
    });

    this._router = router;
    return router;
  }

  /**
   * Get rooms with normalized devices for Home abstraction
   * @param {boolean} demoMode - Whether to use demo mode
   * @returns {Promise<Array>} Rooms with normalized devices
   */
  async getRooms(demoMode = false) {
    const status = await this.getStatus(demoMode);
    const rooms = status.rooms || [];
    return rooms.map((room) => dashboardService.transformRoomToHomeFormat(room));
  }

  /**
   * Get home-level devices (Hue has none)
   * @returns {Promise<Array>} Empty array
   */
  async getDevices() {
    return [];
  }

  /**
   * Update a device state
   * @param {string} deviceId - Device ID (without service prefix)
   * @param {Object} state - New state to apply
   * @returns {Promise<Object>} Result object
   */
  async updateDevice(deviceId, state) {
    const bridgeIp = this._bridgeIp;
    const username = sessionManager.getBridgeCredentials(bridgeIp);
    const client = getHueClientForBridge(bridgeIp);

    return client.updateLight(bridgeIp, username, deviceId, state);
  }

  /**
   * Activate a scene
   * @param {string} sceneId - Scene ID (without service prefix)
   * @returns {Promise<Object>} Result object
   */
  async activateScene(sceneId) {
    const bridgeIp = this._bridgeIp;
    const username = sessionManager.getBridgeCredentials(bridgeIp);
    const client = getHueClientForBridge(bridgeIp);

    return client.activateScene(bridgeIp, username, sceneId);
  }

  /**
   * Detect changes between previous and current status
   * Returns array of change objects or null if no changes
   */
  detectChanges(previous, current) {
    if (!previous || !current) {
      return null;
    }

    const changes = [];

    // Compare rooms
    const prevRooms = previous.rooms || [];
    const currRooms = current.rooms || [];

    for (const currRoom of currRooms) {
      const prevRoom = prevRooms.find((r) => r.id === currRoom.id);

      if (!prevRoom) {
        changes.push({ type: 'room', action: 'added', room: currRoom });
        continue;
      }

      // Check for any changes in the room
      if (JSON.stringify(prevRoom) !== JSON.stringify(currRoom)) {
        changes.push({ type: 'room', action: 'changed', room: currRoom });
      }
    }

    return changes.length > 0 ? changes : null;
  }
}

// Export singleton instance
export default new HuePluginClass();
