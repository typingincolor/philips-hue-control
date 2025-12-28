/**
 * Hue Plugin - Service plugin for Philips Hue integration
 */

import express from 'express';
import ServicePlugin from '../ServicePlugin.js';
import sessionManager from '../sessionManager.js';
import dashboardService from '../dashboardService.js';
import { getHueClient, getHueClientForBridge } from '../hueClientFactory.js';
import { DEMO_BRIDGE_IP, DEMO_USERNAME } from '../mockData.js';
import { convertToHueState } from '../../utils/stateConversion.js';
import { createLogger } from '../../utils/logger.js';
import slugMappingService from '../slugMappingService.js';

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
    // Check stored bridgeIp first, fall back to any stored credentials
    const bridgeIp = this._bridgeIp || sessionManager.getDefaultBridgeIp();
    return bridgeIp && sessionManager.hasBridgeCredentials(bridgeIp);
  }

  /**
   * Get connection status
   */
  getConnectionStatus(demoMode = false) {
    if (demoMode) {
      return { connected: true, bridgeIp: DEMO_BRIDGE_IP };
    }
    const bridgeIp = this._bridgeIp || sessionManager.getDefaultBridgeIp();
    return {
      connected: this.isConnected(false),
      bridgeIp,
    };
  }

  /**
   * Get dashboard status data
   */
  async getStatus(demoMode = false) {
    if (demoMode) {
      return dashboardService.getDashboard(DEMO_BRIDGE_IP, DEMO_USERNAME);
    }

    const bridgeIp = this._bridgeIp || sessionManager.getDefaultBridgeIp();
    const username = sessionManager.getBridgeCredentials(bridgeIp);
    if (!username) {
      throw new Error('Not connected');
    }

    return dashboardService.getDashboard(bridgeIp, username);
  }

  /**
   * Check if credentials exist for the current bridge
   */
  hasCredentials() {
    const bridgeIp = this._bridgeIp || sessionManager.getDefaultBridgeIp();
    return bridgeIp && sessionManager.hasBridgeCredentials(bridgeIp);
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
   * @param {string} deviceId - Device ID (slug, without service prefix)
   * @param {Object} state - New state to apply (simple format: { on, brightness })
   * @returns {Promise<Object>} Result object with success and applied state
   */
  async updateDevice(deviceId, state) {
    const bridgeIp = this._bridgeIp || sessionManager.getDefaultBridgeIp();
    if (!bridgeIp) {
      throw new Error('No Hue bridge configured');
    }
    const username = sessionManager.getBridgeCredentials(bridgeIp);
    const client = getHueClientForBridge(bridgeIp);

    // Translate slug to UUID for API call
    const uuid = slugMappingService.getUuid('hue', deviceId) || deviceId;

    // Convert simplified state to Hue API v2 format internally
    const hueState = convertToHueState(state);
    await client.updateLight(bridgeIp, username, uuid, hueState);

    // Return normalized response (not raw Hue format)
    return {
      success: true,
      deviceId,
      appliedState: state,
    };
  }

  /**
   * Activate a scene
   * @param {string} sceneId - Scene ID (slug, without service prefix)
   * @returns {Promise<Object>} Result object
   */
  async activateScene(sceneId) {
    const bridgeIp = this._bridgeIp || sessionManager.getDefaultBridgeIp();
    if (!bridgeIp) {
      throw new Error('No Hue bridge configured');
    }
    const username = sessionManager.getBridgeCredentials(bridgeIp);
    const client = getHueClientForBridge(bridgeIp);

    // Translate slug to UUID for API call
    const uuid = slugMappingService.getUuid('hue:scene', sceneId) || sceneId;

    return client.activateScene(bridgeIp, username, uuid);
  }

  /**
   * Update all devices in a room
   * @param {string} roomId - Room ID (slug, without service prefix)
   * @param {Object} state - New state to apply
   * @returns {Promise<Object>} Result object with updatedLights
   */
  async updateRoomDevices(roomId, state) {
    const bridgeIp = this._bridgeIp || sessionManager.getDefaultBridgeIp();
    if (!bridgeIp) {
      throw new Error('No Hue bridge configured');
    }
    const username = sessionManager.getBridgeCredentials(bridgeIp);
    const client = getHueClientForBridge(bridgeIp);

    // Get room hierarchy to find lights (room.id is already a slug)
    const status = await this.getStatus(false);
    const room = status.rooms?.find((r) => r.id === roomId);

    if (!room) {
      throw new Error(`Room not found: ${roomId}`);
    }

    // Convert simplified state to Hue API v2 format
    const hueState = convertToHueState(state);

    // Use original UUIDs for light updates (stored in _uuid from enrichLight)
    const lightUpdates = room.lights.map((light) => ({
      lightId: light._uuid || light.id,
      state: hueState,
    }));

    await client.updateLights(bridgeIp, username, lightUpdates);

    // Return lights with applied state merged in for optimistic updates
    const updatedLights = room.lights.map((light) => ({
      ...light,
      ...state,
    }));

    return { success: true, updatedLights };
  }

  /**
   * Update all devices in a zone
   * @param {string} zoneId - Zone ID (slug, without service prefix)
   * @param {Object} state - New state to apply
   * @returns {Promise<Object>} Result object with updatedLights
   */
  async updateZoneDevices(zoneId, state) {
    const bridgeIp = this._bridgeIp || sessionManager.getDefaultBridgeIp();
    if (!bridgeIp) {
      throw new Error('No Hue bridge configured');
    }
    const username = sessionManager.getBridgeCredentials(bridgeIp);
    const client = getHueClientForBridge(bridgeIp);

    // Get zones from dashboard (zone.id is already a slug)
    const status = await this.getStatus(false);
    const zone = status.zones?.find((z) => z.id === zoneId);

    if (!zone) {
      throw new Error(`Zone not found: ${zoneId}`);
    }

    // Convert simplified state to Hue API v2 format
    const hueState = convertToHueState(state);

    // Use original UUIDs for light updates (stored in _uuid from enrichLight)
    const lightUpdates = zone.lights.map((light) => ({
      lightId: light._uuid || light.id,
      state: hueState,
    }));

    await client.updateLights(bridgeIp, username, lightUpdates);

    // Return lights with applied state merged in for optimistic updates
    const updatedLights = zone.lights.map((light) => ({
      ...light,
      ...state,
    }));

    return { success: true, updatedLights };
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
