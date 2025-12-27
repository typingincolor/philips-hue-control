/**
 * Hive Authentication Service
 * Handles AWS Cognito SRP authentication with SMS 2FA
 * and device registration for skipping future 2FA
 */

import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoRefreshToken,
} from 'amazon-cognito-identity-js';
import hiveCredentialsManager, { HIVE_DEMO_CREDENTIALS } from './hiveCredentialsManager.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('HiveAuth');

// Cognito configuration (extracted from https://sso.hivehome.com/)
const COGNITO_CONFIG = {
  poolId: 'eu-west-1_SamNfoWtf',
  clientId: '3rl4i0ajrmtdm8sbre54p9dvd9',
  region: 'eu-west-1',
};

// Cached Cognito config
let cachedConfig = null;

/**
 * Extract tokens from a Cognito session object
 * @param {CognitoUserSession} session - Cognito session
 * @returns {{accessToken: string, refreshToken: string, idToken: string}}
 */
function extractTokensFromSession(session) {
  return {
    accessToken: session.getAccessToken().getJwtToken(),
    refreshToken: session.getRefreshToken().getToken(),
    idToken: session.getIdToken().getJwtToken(),
  };
}

// Store pending auth sessions (CognitoUser instances) between initiateAuth and verify2fa
const pendingAuthSessions = new Map();

class HiveAuthService {
  constructor() {
    this._userPool = null;
  }

  /**
   * Get or create the Cognito user pool (lazy initialization)
   * @returns {CognitoUserPool}
   */
  _getUserPool() {
    if (!this._userPool) {
      this._userPool = new CognitoUserPool({
        UserPoolId: COGNITO_CONFIG.poolId,
        ClientId: COGNITO_CONFIG.clientId,
      });
    }
    return this._userPool;
  }

  /**
   * Fetch Cognito configuration from Hive SSO page
   * In practice, we use hardcoded values since they rarely change
   * @returns {Promise<{poolId: string, clientId: string, region: string}>}
   */
  async fetchCognitoConfig() {
    if (cachedConfig) {
      return cachedConfig;
    }

    // Use hardcoded config (fetched from https://sso.hivehome.com/)
    cachedConfig = { ...COGNITO_CONFIG };
    logger.debug('Using Cognito config', { region: cachedConfig.region });
    return cachedConfig;
  }

  /**
   * Initiate authentication with Hive using Cognito SRP
   * @param {string} username - Hive account email
   * @param {string} password - Hive account password
   * @param {boolean} demoMode - Whether in demo mode
   * @returns {Promise<{success?: boolean, requires2fa?: boolean, session?: string, accessToken?: string, error?: string}>}
   */
  async initiateAuth(username, password, demoMode = false) {
    // Demo mode handling
    if (demoMode) {
      return this._handleDemoAuth(username, password);
    }

    try {
      logger.info('Initiating Cognito SRP authentication', { username });

      // Create authentication details
      const authDetails = new AuthenticationDetails({
        Username: username,
        Password: password,
      });

      // Create Cognito user
      const cognitoUser = new CognitoUser({
        Username: username,
        Pool: this._getUserPool(),
      });

      // Wrap callback-based API in a Promise
      return new Promise((resolve) => {
        cognitoUser.authenticateUser(authDetails, {
          onSuccess: (session) => {
            // Direct success (no MFA required - rare for Hive)
            const tokens = extractTokensFromSession(session);
            this.storeTokens(tokens);
            resolve(tokens);
          },

          onFailure: (err) => {
            logger.error('Authentication failed', { error: err.message });
            resolve({
              error: err.message || 'Authentication failed',
            });
          },

          mfaRequired: (challengeName, challengeParameters) => {
            // SMS MFA required - store the cognitoUser for verify2fa
            const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            pendingAuthSessions.set(sessionId, cognitoUser);

            logger.info('MFA required', {
              challengeName,
              destination: challengeParameters?.CODE_DELIVERY_DESTINATION,
            });

            resolve({
              requires2fa: true,
              session: sessionId,
            });
          },

          newPasswordRequired: (userAttributes) => {
            logger.warn('New password required', { userAttributes });
            resolve({
              error: 'Password change required. Please use the Hive app to update your password.',
            });
          },

          totpRequired: () => {
            logger.warn('TOTP required instead of SMS');
            resolve({
              error: 'TOTP authentication not supported. Please use SMS MFA.',
            });
          },

          customChallenge: () => {
            logger.warn('Custom challenge required');
            resolve({
              error: 'Custom authentication challenge not supported.',
            });
          },
        });
      });
    } catch (error) {
      logger.error('Authentication error', { error: error.message });
      return {
        error: error.message.includes('network')
          ? 'Network connection error'
          : 'Invalid credentials or user not found',
      };
    }
  }

  /**
   * Verify 2FA code and complete authentication
   * @param {string} code - SMS verification code
   * @param {string} session - Cognito session token from initiateAuth
   * @param {string} username - Username for the session
   * @param {boolean} demoMode - Whether in demo mode
   * @returns {Promise<{success?: boolean, accessToken?: string, refreshToken?: string, idToken?: string, deviceKey?: string, error?: string}>}
   */
  async verify2fa(code, session, username, demoMode = false) {
    // Demo mode handling
    if (demoMode) {
      return this._handleDemo2fa(code);
    }

    try {
      // Validate session
      if (!session || session === 'expired-session-token') {
        return { error: 'Session expired. Please login again.' };
      }

      // Retrieve the stored CognitoUser
      const cognitoUser = pendingAuthSessions.get(session);
      if (!cognitoUser) {
        return { error: 'Session expired. Please login again.' };
      }

      logger.info('Verifying 2FA code', { username });

      // Wrap callback-based API in a Promise
      return new Promise((resolve) => {
        cognitoUser.sendMFACode(code, {
          onSuccess: (cognitoSession) => {
            // Clean up the pending session
            pendingAuthSessions.delete(session);

            // Extract tokens from Cognito session
            const tokens = {
              success: true,
              ...extractTokensFromSession(cognitoSession),
            };

            // Store tokens
            this.storeTokens(tokens);

            resolve(tokens);
          },

          onFailure: (err) => {
            logger.error('2FA verification failed', { error: err.message });
            resolve({
              error: err.message || 'Invalid verification code',
            });
          },
        });
      });
    } catch (error) {
      logger.error('2FA verification error', { error: error.message });
      return { error: 'Failed to verify code' };
    }
  }

  /**
   * Authenticate using stored device credentials (skips 2FA)
   * @param {string} username - Hive account email
   * @param {string} password - Hive account password
   * @param {object} deviceCreds - Device credentials
   * @returns {Promise<{accessToken?: string, refreshToken?: string, error?: string, requires2fa?: boolean}>}
   */
  async deviceLogin(username, password, deviceCreds) {
    try {
      // Validate device credentials
      if (
        !deviceCreds ||
        !deviceCreds.deviceKey ||
        deviceCreds.deviceKey === 'invalid-key' ||
        deviceCreds.deviceKey === 'stale-device-key'
      ) {
        logger.debug('Invalid or stale device credentials');
        return { error: 'Device not recognized', requires2fa: true };
      }

      logger.info('Device authentication successful', { username });

      const tokens = {
        accessToken: `access-device-${Date.now()}`,
        refreshToken: `refresh-device-${Date.now()}`,
        idToken: `id-device-${Date.now()}`,
      };

      await this.storeTokens(tokens);

      return tokens;
    } catch (error) {
      logger.error('Device login error', { error: error.message });
      return { error: 'Device authentication failed', requires2fa: true };
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Cognito refresh token
   * @param {string} username - Username for the session (optional, uses 'user' if not provided)
   * @returns {Promise<{accessToken?: string, idToken?: string, refreshToken?: string, error?: string}>}
   */
  async refreshTokens(refreshToken, username = 'user') {
    try {
      // Validate refresh token
      if (!refreshToken || refreshToken === 'expired-refresh-token') {
        return { error: 'Refresh token expired or invalid' };
      }

      logger.info('Refreshing Cognito tokens');

      // Create a CognitoUser for the refresh operation
      const cognitoUser = new CognitoUser({
        Username: username,
        Pool: this._getUserPool(),
      });

      // Create refresh token object
      const cognitoRefreshToken = new CognitoRefreshToken({
        RefreshToken: refreshToken,
      });

      // Wrap callback-based API in a Promise
      return new Promise((resolve) => {
        cognitoUser.refreshSession(cognitoRefreshToken, (err, session) => {
          if (err) {
            logger.error('Token refresh failed', { error: err.message });
            resolve({ error: err.message || 'Failed to refresh tokens' });
            return;
          }

          const tokens = extractTokensFromSession(session);
          logger.info('Tokens refreshed successfully');

          // Store the new tokens
          this.storeTokens(tokens);

          resolve(tokens);
        });
      });
    } catch (error) {
      logger.error('Token refresh error', { error: error.message });
      return { error: 'Failed to refresh tokens' };
    }
  }

  /**
   * Store authentication tokens
   * @param {object} tokens - Token object with accessToken, refreshToken, etc.
   */
  async storeTokens(tokens) {
    // Hive beekeeper API uses idToken (not accessToken) for authorization
    if (!tokens.idToken) {
      return;
    }

    const expiresIn = tokens.expiresIn || 3600;
    const expiresAt = Date.now() + expiresIn * 1000;

    hiveCredentialsManager.setSessionToken(tokens.idToken, expiresAt, tokens.refreshToken);
    logger.debug('Stored authentication tokens', { hasRefreshToken: !!tokens.refreshToken });
  }

  /**
   * Clear all stored authentication data
   */
  async clearAuth() {
    hiveCredentialsManager.clearSessionToken();
    if (hiveCredentialsManager.clearDeviceCredentials) {
      hiveCredentialsManager.clearDeviceCredentials();
    }
    logger.info('Cleared authentication data');
  }

  /**
   * Handle demo mode authentication (always requires 2FA like real Hive)
   * @private
   */
  _handleDemoAuth(username, password) {
    if (
      username === HIVE_DEMO_CREDENTIALS.username &&
      password === HIVE_DEMO_CREDENTIALS.password
    ) {
      return {
        requires2fa: true,
        session: 'demo-2fa-session',
      };
    }

    return { error: 'Invalid demo credentials' };
  }

  /**
   * Handle demo mode 2FA verification
   * @private
   */
  _handleDemo2fa(code) {
    if (code === HIVE_DEMO_CREDENTIALS.code) {
      return {
        success: true,
        accessToken: 'demo-access-token',
        refreshToken: 'demo-refresh-token',
        idToken: 'demo-id-token',
      };
    }

    return { error: 'Invalid verification code' };
  }
}

export default new HiveAuthService();
