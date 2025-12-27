/**
 * Hive Service
 * Handles communication with UK Hive heating system API
 * Provides thermostat status, hot water status, and schedules
 */

import hiveCredentialsManager, { HIVE_DEMO_CREDENTIALS } from './hiveCredentialsManager.js';
import hiveAuthService from './hiveAuthService.js';
import { getMockHiveStatus, getMockHiveSchedules } from './mockData.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('HIVE');

const HIVE_API_URL = 'https://api.hivehome.com/v6';

class HiveService {
  constructor() {
    this._demoConnected = false;
  }

  /**
   * Check if connected to Hive (has valid session token)
   * @returns {boolean}
   */
  isConnected() {
    return hiveCredentialsManager.getSessionToken() !== null;
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
   * Uses AWS Cognito SRP authentication with SMS 2FA
   * @param {string} username - Hive account email
   * @param {string} password - Hive account password
   * @param {boolean} demoMode - Whether in demo mode
   * @returns {Promise<{success?: boolean, requires2fa?: boolean, session?: string, error?: string}>}
   */
  async connect(username, password, demoMode = false) {
    // Demo mode - validate demo credentials (always requires 2FA like real Hive)
    if (demoMode) {
      if (
        username === HIVE_DEMO_CREDENTIALS.username &&
        password === HIVE_DEMO_CREDENTIALS.password
      ) {
        logger.debug('Demo mode: requiring 2FA');
        return { requires2fa: true, session: 'demo-2fa-session' };
      }

      logger.debug('Demo mode: invalid demo credentials');
      return { success: false, error: 'Invalid demo credentials' };
    }

    try {
      logger.info('Connecting to Hive API via Cognito', { username });

      // Use the auth service for Cognito authentication
      const result = await hiveAuthService.initiateAuth(username, password, demoMode);

      // Handle 2FA requirement
      if (result.requires2fa) {
        return {
          requires2fa: true,
          session: result.session,
        };
      }

      // Handle authentication error
      if (result.error) {
        return { success: false, error: result.error };
      }

      // Handle successful direct authentication (device credentials skipped 2FA)
      if (result.accessToken) {
        logger.info('Connected to Hive successfully (device auth)');
        return { success: true };
      }

      // Shouldn't reach here, but handle gracefully
      return { success: false, error: 'Unexpected authentication response' };
    } catch (error) {
      logger.error('Hive connection error', { error: error.message });
      return {
        success: false,
        error: `Network error: ${error.message}`,
      };
    }
  }

  /**
   * Verify 2FA code and complete authentication
   * @param {string} code - SMS verification code
   * @param {string} session - Cognito session token
   * @param {string} username - Username for the session
   * @param {boolean} demoMode - Whether in demo mode
   * @returns {Promise<{success?: boolean, error?: string}>}
   */
  async verify2fa(code, session, username, demoMode = false) {
    // Demo mode handling
    if (demoMode) {
      if (code === HIVE_DEMO_CREDENTIALS.code) {
        logger.debug('Demo mode: 2FA verified');
        this._demoConnected = true;
        return { success: true };
      }
      return { success: false, error: 'Invalid verification code' };
    }

    try {
      logger.info('Verifying 2FA code', { username });

      const result = await hiveAuthService.verify2fa(code, session, username, demoMode);

      if (result.error) {
        return { success: false, error: result.error };
      }

      if (result.success || result.accessToken) {
        logger.info('2FA verification successful');
        return { success: true };
      }

      return { success: false, error: 'Verification failed' };
    } catch (error) {
      logger.error('2FA verification error', { error: error.message });
      return { success: false, error: 'Verification failed' };
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
