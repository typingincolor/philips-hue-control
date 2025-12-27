/**
 * Hive Service
 * Handles communication with UK Hive heating system API
 * Provides thermostat status, hot water status, and schedules
 */

import hiveCredentialsManager from './hiveCredentialsManager.js';
import { getMockHiveStatus, getMockHiveSchedules } from './mockData.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('HIVE');

const HIVE_API_URL = 'https://api.hivehome.com/v6';

// Demo mode credentials
const DEMO_USERNAME = 'demo@hive.com';
const DEMO_PASSWORD = 'demo';

class HiveService {
  constructor() {
    this._demoConnected = false;
  }

  /**
   * Check if connected to Hive (has valid credentials and session)
   * @returns {boolean}
   */
  isConnected() {
    return (
      hiveCredentialsManager.hasCredentials() && hiveCredentialsManager.getSessionToken() !== null
    );
  }

  /**
   * Check if connected to Hive in demo mode
   * @returns {boolean}
   */
  isConnectedDemo() {
    return this._demoConnected;
  }

  /**
   * Get connection status
   * @param {boolean} demoMode - Whether in demo mode
   * @returns {{connected: boolean}}
   */
  getConnectionStatus(demoMode = false) {
    if (demoMode) {
      return { connected: this._demoConnected };
    }
    return { connected: this.isConnected() };
  }

  /**
   * Connect to Hive API with username and password
   * @param {string} username - Hive account email
   * @param {string} password - Hive account password
   * @param {boolean} demoMode - Whether in demo mode
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async connect(username, password, demoMode = false) {
    // Demo mode - validate demo credentials
    if (demoMode) {
      if (username !== DEMO_USERNAME || password !== DEMO_PASSWORD) {
        logger.debug('Demo mode: invalid demo credentials');
        return { success: false, error: 'Invalid demo credentials' };
      }
      logger.debug('Demo mode: simulating Hive connection');
      this._demoConnected = true;
      return { success: true };
    }

    try {
      logger.info('Connecting to Hive API', { username });

      const response = await fetch(`${HIVE_API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.warn('Hive login failed', { status: response.status });
        return {
          success: false,
          error: errorData.error || 'Invalid credentials',
        };
      }

      const data = await response.json();

      // Store session token (expires in 1 hour typically)
      const expiresAt = Date.now() + 60 * 60 * 1000;
      hiveCredentialsManager.setSessionToken(data.token, expiresAt);

      logger.info('Connected to Hive successfully');
      return { success: true };
    } catch (error) {
      logger.error('Hive connection error', { error: error.message });
      return {
        success: false,
        error: `Network error: ${error.message}`,
      };
    }
  }

  /**
   * Disconnect from Hive
   * @returns {Promise<void>}
   */
  async disconnect() {
    hiveCredentialsManager.clearSessionToken();
    this._demoConnected = false;
    logger.info('Disconnected from Hive');
  }

  /**
   * Get current thermostat and hot water status
   * @param {boolean} demoMode - Whether in demo mode
   * @returns {Promise<{heating: object, hotWater: object}>}
   */
  async getStatus(demoMode = false) {
    // Demo mode - return mock data
    if (demoMode) {
      logger.debug('Demo mode: returning mock Hive status');
      return getMockHiveStatus();
    }

    if (!this.isConnected()) {
      throw new Error('Not connected to Hive');
    }

    try {
      const token = hiveCredentialsManager.getSessionToken();
      const response = await fetch(`${HIVE_API_URL}/nodes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Hive API error: ${response.status}`);
      }

      const data = await response.json();
      return this._transformStatus(data);
    } catch (error) {
      logger.error('Failed to get Hive status', { error: error.message });
      throw error;
    }
  }

  /**
   * Get heating and hot water schedules
   * @param {boolean} demoMode - Whether in demo mode
   * @returns {Promise<Array>}
   */
  async getSchedules(demoMode = false) {
    // Demo mode - return mock data
    if (demoMode) {
      logger.debug('Demo mode: returning mock Hive schedules');
      return getMockHiveSchedules();
    }

    if (!this.isConnected()) {
      throw new Error('Not connected to Hive');
    }

    try {
      const token = hiveCredentialsManager.getSessionToken();
      const response = await fetch(`${HIVE_API_URL}/schedules`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Hive API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      logger.error('Failed to get Hive schedules', { error: error.message });
      throw error;
    }
  }

  /**
   * Transform Hive API response to our format
   * @private
   */
  _transformStatus(apiData) {
    // This would need to be adapted to actual Hive API response format
    return {
      heating: {
        currentTemperature: apiData.heating?.currentTemperature || 0,
        targetTemperature: apiData.heating?.targetTemperature || 0,
        isHeating: apiData.heating?.isHeating || false,
        mode: apiData.heating?.mode || 'off',
      },
      hotWater: {
        isOn: apiData.hotWater?.isOn || false,
        mode: apiData.hotWater?.mode || 'off',
      },
    };
  }
}

export default new HiveService();
