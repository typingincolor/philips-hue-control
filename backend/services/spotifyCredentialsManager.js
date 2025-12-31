import fs from 'fs';
import path from 'path';
import { encrypt, decrypt, getEncryptionKey } from '../utils/encryption.js';
import { createLogger } from '../utils/logger.js';
import { SPOTIFY_CREDENTIALS_FILE } from '../constants/paths.js';

const logger = createLogger('SpotifyCredentials');

/**
 * SpotifyCredentialsManager - Manages Spotify OAuth tokens
 * Stores tokens globally (shared by all clients) with encryption
 */
class SpotifyCredentialsManager {
  constructor() {
    // OAuth tokens
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiresAt = null;

    // User info (cached from Spotify API)
    this.userId = null;
    this.userDisplayName = null;

    // Path for credentials file
    this.credentialsFilePath = SPOTIFY_CREDENTIALS_FILE;

    // Load persisted credentials on startup
    this._loadCredentials();
  }

  /**
   * Store OAuth tokens from Spotify
   * @param {Object} tokens - Token response from Spotify
   * @param {string} tokens.access_token - Access token
   * @param {string} tokens.refresh_token - Refresh token
   * @param {number} tokens.expires_in - Token lifetime in seconds
   */
  storeTokens(tokens) {
    if (!tokens || !tokens.access_token) {
      throw new Error('Invalid tokens: access_token is required');
    }

    this.accessToken = tokens.access_token;

    // Only update refresh token if provided (not always returned on refresh)
    if (tokens.refresh_token) {
      this.refreshToken = tokens.refresh_token;
    }

    // Calculate expiry time (subtract 60s buffer for safety)
    const expiresIn = tokens.expires_in || 3600;
    this.tokenExpiresAt = Date.now() + (expiresIn - 60) * 1000;

    // Persist to file
    this._saveCredentials();

    logger.info('Stored Spotify tokens', {
      expiresAt: new Date(this.tokenExpiresAt).toISOString(),
    });
  }

  /**
   * Get access token if still valid
   * @returns {string|null} Access token or null if expired/not set
   */
  getAccessToken() {
    if (!this.accessToken || !this.tokenExpiresAt) {
      return null;
    }

    // Check if expired
    if (Date.now() >= this.tokenExpiresAt) {
      logger.debug('Spotify access token expired');
      return null;
    }

    return this.accessToken;
  }

  /**
   * Get refresh token for obtaining new access token
   * @returns {string|null} Refresh token or null if not set
   */
  getRefreshToken() {
    return this.refreshToken;
  }

  /**
   * Check if we have valid credentials (unexpired access token or refresh token)
   * @returns {boolean}
   */
  hasCredentials() {
    // Have valid access token
    if (this.accessToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt) {
      return true;
    }
    // Have refresh token to get new access token
    return !!this.refreshToken;
  }

  /**
   * Check if access token needs refresh
   * @returns {boolean}
   */
  needsRefresh() {
    if (!this.refreshToken) {
      return false;
    }
    // Needs refresh if no access token or expired
    return !this.accessToken || !this.tokenExpiresAt || Date.now() >= this.tokenExpiresAt;
  }

  /**
   * Store user info from Spotify API
   * @param {Object} user - User profile from Spotify
   */
  setUserInfo(user) {
    if (!user) return;

    this.userId = user.id || null;
    this.userDisplayName = user.display_name || null;

    this._saveCredentials();
    logger.debug('Stored Spotify user info', { userId: this.userId });
  }

  /**
   * Get cached user info
   * @returns {Object|null}
   */
  getUserInfo() {
    if (!this.userId) return null;

    return {
      id: this.userId,
      displayName: this.userDisplayName,
    };
  }

  /**
   * Clear all credentials
   */
  clearCredentials() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiresAt = null;
    this.userId = null;
    this.userDisplayName = null;

    this._saveCredentials();
    logger.info('Cleared Spotify credentials');
  }

  /**
   * Save credentials to file (encrypted)
   * @private
   */
  _saveCredentials() {
    try {
      // Ensure parent directory exists
      const dir = path.dirname(this.credentialsFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const data = {};

      // Encrypt tokens if present
      if (this.refreshToken) {
        const key = getEncryptionKey();
        const encrypted = encrypt(this.refreshToken, key);
        data.encryptedRefreshToken = encrypted.encrypted;
        data.iv = encrypted.iv;
        data.authTag = encrypted.authTag;
      }

      // Store access token (short-lived, less sensitive)
      if (this.accessToken && this.tokenExpiresAt) {
        data.accessToken = this.accessToken;
        data.tokenExpiresAt = this.tokenExpiresAt;
      }

      // Store user info
      if (this.userId) {
        data.userId = this.userId;
        data.userDisplayName = this.userDisplayName;
      }

      fs.writeFileSync(this.credentialsFilePath, JSON.stringify(data, null, 2), { mode: 0o600 });
      logger.debug('Saved Spotify credentials to file');
    } catch (error) {
      logger.warn('Failed to save Spotify credentials', { error: error.message });
    }
  }

  /**
   * Load credentials from file
   * @private
   */
  _loadCredentials() {
    try {
      if (!fs.existsSync(this.credentialsFilePath)) {
        logger.debug('No Spotify credentials file found');
        return;
      }

      const contents = fs.readFileSync(this.credentialsFilePath, 'utf8');
      if (!contents || contents.trim() === '') {
        logger.debug('Spotify credentials file is empty');
        return;
      }

      const data = JSON.parse(contents);

      // Decrypt refresh token if present
      if (data.encryptedRefreshToken && data.iv && data.authTag) {
        try {
          const key = getEncryptionKey();
          this.refreshToken = decrypt(data.encryptedRefreshToken, data.iv, data.authTag, key);
        } catch (decryptError) {
          logger.warn('Failed to decrypt Spotify refresh token', { error: decryptError.message });
          this.refreshToken = null;
        }
      }

      // Load access token if not expired
      if (data.accessToken && data.tokenExpiresAt) {
        if (Date.now() < data.tokenExpiresAt) {
          this.accessToken = data.accessToken;
          this.tokenExpiresAt = data.tokenExpiresAt;
        }
      }

      // Load user info
      if (data.userId) {
        this.userId = data.userId;
        this.userDisplayName = data.userDisplayName || null;
      }

      if (this.hasCredentials()) {
        logger.info('Loaded Spotify credentials from file', { userId: this.userId });
      }
    } catch (error) {
      logger.warn('Failed to load Spotify credentials', { error: error.message });
    }
  }
}

// Export singleton instance
export default new SpotifyCredentialsManager();
