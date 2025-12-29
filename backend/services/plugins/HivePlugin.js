/**
 * Hive Plugin - Service plugin for UK Hive heating integration
 */

import express from 'express';
import ServicePlugin from '../ServicePlugin.js';
import hiveService from '../hiveService.js';
import hiveCredentialsManager, { HIVE_DEMO_CREDENTIALS } from '../hiveCredentialsManager.js';

class HivePluginClass extends ServicePlugin {
  static id = 'hive';
  static displayName = 'Hive Heating';
  static description = 'Control Hive heating system';
  static authType = '2fa';

  constructor() {
    super();
    this._router = null;
  }

  /**
   * Connect to Hive API
   */
  async connect(credentials, demoMode = false) {
    const { username, password } = credentials;

    if (!username || !password) {
      return { success: false, error: 'username and password are required' };
    }

    return hiveService.connect(username, password, demoMode);
  }

  /**
   * Disconnect from Hive API
   */
  async disconnect() {
    await hiveService.disconnect();
  }

  /**
   * Check if connected to Hive
   */
  isConnected(demoMode = false) {
    if (demoMode) {
      return hiveService.isConnectedDemo();
    }
    return hiveService.isConnected();
  }

  /**
   * Get connection status
   */
  async getConnectionStatus(demoMode = false) {
    return hiveService.getConnectionStatus(demoMode);
  }

  /**
   * Get thermostat and hot water status
   */
  async getStatus(demoMode = false) {
    return hiveService.getStatus(demoMode);
  }

  /**
   * Check if credentials exist
   */
  hasCredentials() {
    return hiveCredentialsManager.hasCredentials();
  }

  /**
   * Clear all Hive credentials
   */
  async clearCredentials() {
    hiveCredentialsManager.clearCredentials();
    hiveCredentialsManager.clearDeviceCredentials();
    hiveCredentialsManager.clearSessionToken();
  }

  /**
   * Get demo credentials
   */
  getDemoCredentials() {
    return HIVE_DEMO_CREDENTIALS;
  }

  /**
   * Reset demo mode state
   */
  resetDemo() {
    hiveService.resetDemo();
  }

  /**
   * Verify 2FA code
   */
  async verify2fa(data, demoMode = false) {
    const { code, session, username } = data;
    return hiveService.verify2fa(code, session, username, demoMode);
  }

  /**
   * Get heating schedules
   */
  async getSchedules(demoMode = false) {
    return hiveService.getSchedules(demoMode);
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
        const demoMode = req.demoMode || false;
        const result = await this.verify2fa(req.body, demoMode);

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
        const demoMode = req.demoMode || false;
        const schedules = await this.getSchedules(demoMode);
        res.json(schedules);
      } catch (error) {
        next(error);
      }
    });

    // POST /reset-demo - Reset demo state
    router.post('/reset-demo', (req, res) => {
      const demoMode = req.demoMode || false;

      if (!demoMode) {
        return res.status(403).json({ error: 'Only available in demo mode' });
      }

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
   * @param {boolean} demoMode - Whether to use demo mode
   * @returns {Promise<Array>} Array of normalized devices
   */
  async getDevices(demoMode = false) {
    try {
      const status = await this.getStatus(demoMode);
      return hiveService.transformStatusToDevices(status);
    } catch {
      return [];
    }
  }

  /**
   * Update a device state
   * @param {string} deviceId - Device ID (heating or hotwater)
   * @param {Object} state - New state to apply
   * @param {boolean} demoMode - Whether to use demo mode
   * @returns {Promise<Object>} Result object
   */
  async updateDevice(deviceId, state, demoMode = false) {
    if (deviceId === 'heating' && state.targetTemperature !== undefined) {
      return hiveService.setTargetTemperature(state.targetTemperature, demoMode);
    }

    if (deviceId === 'hotwater' && state.isOn !== undefined) {
      return hiveService.setHotWater(state.isOn, demoMode);
    }

    throw new Error(`Unknown device or state: ${deviceId}`);
  }

  /**
   * Detect changes between previous and current status
   */
  detectChanges(previous, current) {
    if (!previous || !current) {
      return null;
    }

    // Simple deep comparison
    if (JSON.stringify(previous) === JSON.stringify(current)) {
      return null;
    }

    // Return changes object indicating what changed
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

// Export singleton instance
export default new HivePluginClass();
