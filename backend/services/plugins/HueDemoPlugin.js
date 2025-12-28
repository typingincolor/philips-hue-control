/**
 * Hue Demo Plugin - Demo mode implementation for Philips Hue
 * Uses mock data instead of real Hue Bridge API.
 */

import express from 'express';
import ServicePlugin from '../ServicePlugin.js';
import dashboardService from '../dashboardService.js';
import mockHueClient from '../mockHueClient.js';
import { DEMO_BRIDGE_IP, DEMO_USERNAME } from '../mockData.js';

class HueDemoPluginClass extends ServicePlugin {
  static id = 'hue';
  static displayName = 'Philips Hue';
  static description = 'Control Philips Hue lights (Demo)';
  static authType = 'pairing';

  constructor() {
    super();
    this._router = null;
  }

  /**
   * Connect to demo bridge (always succeeds)
   */
  async connect() {
    return {
      success: true,
      demoMode: true,
      sessionToken: 'demo-session',
      bridgeIp: DEMO_BRIDGE_IP,
    };
  }

  /**
   * Disconnect (no-op for demo)
   */
  async disconnect() {
    // No-op for demo mode
  }

  /**
   * Demo is always connected
   */
  isConnected() {
    return true;
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return { connected: true, bridgeIp: DEMO_BRIDGE_IP };
  }

  /**
   * Get mock dashboard data
   */
  async getStatus() {
    return dashboardService.getDashboard(DEMO_BRIDGE_IP, DEMO_USERNAME);
  }

  /**
   * Demo always has credentials
   */
  hasCredentials() {
    return true;
  }

  /**
   * Clear credentials (no-op for demo)
   */
  async clearCredentials() {
    // No-op for demo mode
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
   * Pair with demo bridge (always succeeds)
   */
  async pair() {
    return { success: true, username: DEMO_USERNAME };
  }

  /**
   * Get Express router for Hue-specific endpoints
   */
  getRouter() {
    if (this._router) {
      return this._router;
    }

    const router = express.Router();

    // POST /pair - Pair with bridge (demo always succeeds)
    router.post('/pair', async (req, res) => {
      res.json({ success: true, username: DEMO_USERNAME });
    });

    // GET /dashboard - Get dashboard data
    router.get('/dashboard', async (req, res, next) => {
      try {
        const status = await this.getStatus();
        res.json(status);
      } catch (error) {
        next(error);
      }
    });

    // PUT /lights/:id - Update light state
    router.put('/lights/:id', async (req, res, next) => {
      try {
        const { id } = req.params;
        const result = await mockHueClient.updateLight(DEMO_BRIDGE_IP, DEMO_USERNAME, id, req.body);
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
   * @returns {Promise<Array>} Rooms with normalized devices
   */
  async getRooms() {
    const status = await this.getStatus();
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
   * @param {string} deviceId - Device ID
   * @param {Object} state - New state to apply
   * @returns {Promise<Object>} Result object
   */
  async updateDevice(deviceId, state) {
    return mockHueClient.updateLight(DEMO_BRIDGE_IP, DEMO_USERNAME, deviceId, state);
  }

  /**
   * Activate a scene
   * @param {string} sceneId - Scene ID
   * @returns {Promise<Object>} Result object
   */
  async activateScene(sceneId) {
    return mockHueClient.activateScene(DEMO_BRIDGE_IP, DEMO_USERNAME, sceneId);
  }

  /**
   * Update all devices in a room
   * @param {string} roomId - Room ID
   * @param {Object} state - New state to apply
   * @returns {Promise<Object>} Result object with updatedLights
   */
  async updateRoomDevices(roomId, state) {
    // Get room from mock data
    const status = await this.getStatus();
    const room = status.rooms?.find((r) => r.id === roomId);

    if (!room) {
      throw new Error(`Room not found: ${roomId}`);
    }

    // Update all lights in room
    const lightUpdates = room.lights.map((light) => ({
      lightId: light.id,
      state,
    }));

    await mockHueClient.updateLights(DEMO_BRIDGE_IP, DEMO_USERNAME, lightUpdates);

    return { success: true, updatedLights: room.lights };
  }

  /**
   * Update all devices in a zone
   * @param {string} zoneId - Zone ID
   * @param {Object} state - New state to apply
   * @returns {Promise<Object>} Result object with updatedLights
   */
  async updateZoneDevices(zoneId, state) {
    // Get zone from mock data
    const status = await this.getStatus();
    const zone = status.zones?.find((z) => z.id === zoneId);

    if (!zone) {
      throw new Error(`Zone not found: ${zoneId}`);
    }

    // Update all lights in zone
    const lightUpdates = zone.lights.map((light) => ({
      lightId: light.id,
      state,
    }));

    await mockHueClient.updateLights(DEMO_BRIDGE_IP, DEMO_USERNAME, lightUpdates);

    return { success: true, updatedLights: zone.lights };
  }

  /**
   * Detect changes between previous and current status
   */
  detectChanges(previous, current) {
    if (!previous || !current) {
      return null;
    }

    const changes = [];
    const prevRooms = previous.rooms || [];
    const currRooms = current.rooms || [];

    for (const currRoom of currRooms) {
      const prevRoom = prevRooms.find((r) => r.id === currRoom.id);

      if (!prevRoom) {
        changes.push({ type: 'room', action: 'added', room: currRoom });
        continue;
      }

      if (JSON.stringify(prevRoom) !== JSON.stringify(currRoom)) {
        changes.push({ type: 'room', action: 'changed', room: currRoom });
      }
    }

    return changes.length > 0 ? changes : null;
  }
}

export default new HueDemoPluginClass();
