/**
 * Hive Demo Plugin - Demo mode implementation for Hive heating
 * Uses mock data instead of real Hive API.
 */

import express from 'express';
import ServicePlugin from '../ServicePlugin.js';
import { HIVE_DEMO_CREDENTIALS } from '../hiveCredentialsManager.js';
import { getMockHiveStatus, getMockHiveSchedules } from '../mockData.js';
import hiveService from '../hiveService.js';

class HiveDemoPluginClass extends ServicePlugin {
  static id = 'hive';
  static displayName = 'Hive Heating';
  static description = 'Control Hive heating system (Demo)';
  static authType = '2fa';

  constructor() {
    super();
    this._router = null;
    this._connected = false;
  }

  /**
   * Connect with demo credentials
   */
  async connect(credentials) {
    const { username, password } = credentials;

    if (!username || !password) {
      return { success: false, error: 'username and password are required' };
    }

    if (
      username === HIVE_DEMO_CREDENTIALS.username &&
      password === HIVE_DEMO_CREDENTIALS.password
    ) {
      return { requires2fa: true, session: 'demo-2fa-session' };
    }

    return { success: false, error: 'Invalid demo credentials' };
  }

  /**
   * Disconnect from demo
   */
  async disconnect() {
    this._connected = false;
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this._connected;
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return { connected: this._connected };
  }

  /**
   * Get mock thermostat status
   */
  async getStatus() {
    return getMockHiveStatus();
  }

  /**
   * Demo always has credentials available
   */
  hasCredentials() {
    return true;
  }

  /**
   * Clear credentials (reset connection)
   */
  async clearCredentials() {
    this._connected = false;
  }

  /**
   * Get demo credentials
   */
  getDemoCredentials() {
    return HIVE_DEMO_CREDENTIALS;
  }

  /**
   * Reset demo state
   */
  resetDemo() {
    this._connected = false;
  }

  /**
   * Verify 2FA code
   */
  async verify2fa(data) {
    const { code } = data;

    if (code === HIVE_DEMO_CREDENTIALS.code) {
      this._connected = true;
      return { success: true };
    }

    return { success: false, error: 'Invalid verification code' };
  }

  /**
   * Get mock schedules
   */
  async getSchedules() {
    return getMockHiveSchedules();
  }

  /**
   * Get Express router for Hive-specific endpoints
   */
  getRouter() {
    if (this._router) {
      return this._router;
    }

    const router = express.Router();

    // POST /verify-2fa - Verify 2FA code
    router.post('/verify-2fa', async (req, res, next) => {
      try {
        const result = await this.verify2fa(req.body);

        if (!result.success) {
          return res.status(401).json({ error: result.error });
        }

        res.json({ success: true });
      } catch (error) {
        next(error);
      }
    });

    // GET /schedules - Get heating schedules
    router.get('/schedules', async (req, res, next) => {
      try {
        const schedules = await this.getSchedules();
        res.json(schedules);
      } catch (error) {
        next(error);
      }
    });

    // POST /reset-demo - Reset demo state
    router.post('/reset-demo', (req, res) => {
      this.resetDemo();
      res.json({ success: true });
    });

    this._router = router;
    return router;
  }

  /**
   * Get rooms for Home abstraction (Hive has no rooms)
   * @returns {Promise<Array>} Empty array
   */
  async getRooms() {
    return [];
  }

  /**
   * Get home-level devices (heating, hot water)
   * @returns {Promise<Array>} Array of normalized devices
   */
  async getDevices() {
    try {
      const status = await this.getStatus();
      return hiveService.transformStatusToDevices(status);
    } catch {
      return [];
    }
  }

  /**
   * Update a device state (demo mode - just returns success)
   * @param {string} deviceId - Device ID
   * @param {Object} state - New state
   * @returns {Promise<Object>} Result object
   */
  async updateDevice() {
    return { success: true };
  }

  /**
   * Detect changes between previous and current status
   */
  detectChanges(previous, current) {
    if (!previous || !current) {
      return null;
    }

    if (JSON.stringify(previous) === JSON.stringify(current)) {
      return null;
    }

    const changes = {};

    if (JSON.stringify(previous.heating) !== JSON.stringify(current.heating)) {
      changes.heating = current.heating;
    }

    if (JSON.stringify(previous.hotWater) !== JSON.stringify(current.hotWater)) {
      changes.hotWater = current.hotWater;
    }

    return Object.keys(changes).length > 0 ? changes : null;
  }
}

export default new HiveDemoPluginClass();
