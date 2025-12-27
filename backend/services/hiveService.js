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

// Hive beekeeper API - UK endpoint
const HIVE_API_URL = 'https://beekeeper-uk.hivehome.com/1.0';

class HiveService {
  constructor() {
    this._demoConnected = false;
    this._refreshing = null; // Prevent concurrent refresh attempts
  }

  /**
   * Check if connected to Hive (has valid session token)
   * @returns {boolean}
   */
  isConnected() {
    return hiveCredentialsManager.getSessionToken() !== null;
  }

  /**
   * Try to refresh the session token if expired but we have a refresh token
   * @returns {Promise<boolean>} - True if session is valid (or was refreshed), false otherwise
   */
  async ensureValidSession() {
    // Already have a valid token
    if (hiveCredentialsManager.getSessionToken()) {
      return true;
    }

    // Check if we have a refresh token to try
    const refreshToken = hiveCredentialsManager.getRefreshToken();
    if (!refreshToken) {
      logger.debug('No refresh token available for session refresh');
      return false;
    }

    // Prevent concurrent refresh attempts
    if (this._refreshing) {
      logger.debug('Refresh already in progress, waiting...');
      return this._refreshing;
    }

    logger.info('Session expired, attempting token refresh');

    // Start refresh and store promise to prevent concurrent attempts
    this._refreshing = (async () => {
      try {
        const result = await hiveAuthService.refreshTokens(refreshToken);
        if (result.error) {
          logger.warn('Token refresh failed', { error: result.error });
          return false;
        }
        logger.info('Session refreshed successfully');
        return true;
      } catch (error) {
        logger.error('Token refresh error', { error: error.message });
        return false;
      } finally {
        this._refreshing = null;
      }
    })();

    return this._refreshing;
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

    // Try to refresh session if expired
    await this.ensureValidSession();

    if (!this.isConnected()) {
      throw new Error('Not connected to Hive');
    }

    try {
      const token = hiveCredentialsManager.getSessionToken();
      // Beekeeper API uses lowercase 'authorization' header without Bearer prefix
      const response = await fetch(`${HIVE_API_URL}/nodes/all?products=true&devices=true&actions=true`, {
        headers: {
          'Content-Type': 'application/json',
          authorization: token,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Hive API error', { status: response.status, body: errorText });
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

    // Try to refresh session if expired
    await this.ensureValidSession();

    if (!this.isConnected()) {
      throw new Error('Not connected to Hive');
    }

    try {
      const token = hiveCredentialsManager.getSessionToken();
      // Beekeeper API uses lowercase 'authorization' header without Bearer prefix
      const response = await fetch(`${HIVE_API_URL}/nodes/all?products=true&devices=true&actions=true`, {
        headers: {
          'Content-Type': 'application/json',
          authorization: token,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Hive API error', { status: response.status, body: errorText });
        throw new Error(`Hive API error: ${response.status}`);
      }

      const data = await response.json();
      return this._transformSchedules(data);
    } catch (error) {
      logger.error('Failed to get Hive schedules', { error: error.message });
      throw error;
    }
  }

  /**
   * Transform Hive beekeeper API response to our status format
   * @private
   */
  _transformStatus(apiData) {
    // Beekeeper API returns { products: [...], devices: [...], actions: [...] }
    const products = apiData.products || [];

    // Find heating thermostat
    const heating = products.find((p) => p.type === 'heating') || {};
    const heatingProps = heating.props || {};
    const heatingState = heating.state || {};

    // Find hot water
    const hotWater = products.find((p) => p.type === 'hotwater') || {};
    const hotWaterState = hotWater.state || {};

    logger.debug('Transformed Hive status', {
      heatingType: heating.type,
      hotWaterType: hotWater.type,
      productsCount: products.length,
    });

    return {
      heating: {
        currentTemperature: heatingProps.temperature || 0,
        targetTemperature: heatingState.target || 0,
        isHeating: heatingState.status === 'ON',
        mode: heatingState.mode || 'off',
      },
      hotWater: {
        isOn: hotWaterState.status === 'ON',
        mode: hotWaterState.mode || 'off',
      },
    };
  }

  /**
   * Transform Hive beekeeper API response to schedules format
   * @private
   */
  _transformSchedules(apiData) {
    // Beekeeper API returns { products: [...], devices: [...], actions: [...] }
    const actions = apiData.actions || [];

    // Filter for schedule-type actions
    const schedules = actions
      .filter((a) => a.type === 'schedule' || a.enabled !== undefined)
      .map((action) => ({
        id: action.id,
        name: action.name || 'Unnamed Schedule',
        type: action.type,
        enabled: action.enabled,
        start: action.start,
        end: action.end,
        days: action.days || [],
      }));

    logger.debug('Transformed Hive schedules', { count: schedules.length });

    return schedules;
  }
}

export default new HiveService();
