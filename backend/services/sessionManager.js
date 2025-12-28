import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SESSION_EXPIRY_MS, SESSION_CLEANUP_INTERVAL_MS } from '../constants/timings.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('SESSION');

// Get the directory of this module for default credentials path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * SessionManager - Manages user sessions to avoid repeating bridge credentials
 * Stores bridge connection info server-side and issues session tokens
 */
class SessionManager {
  constructor() {
    // In-memory session storage: { sessionToken → { bridgeIp, username, createdAt, lastUsed } }
    this.sessions = new Map();

    // Persistent bridge credentials: { bridgeIp → username }
    // Once paired, credentials are reusable by any client
    this.bridgeCredentials = new Map();

    // Session configuration
    this.SESSION_EXPIRY = SESSION_EXPIRY_MS;
    this.CLEANUP_INTERVAL = SESSION_CLEANUP_INTERVAL_MS;

    // Default path for credentials file
    this.credentialsFilePath = path.join(__dirname, '..', 'data', 'bridge-credentials.json');

    // Load persisted credentials on startup
    this._loadCredentials();

    // Start cleanup interval
    this.startCleanup();
  }

  /**
   * Store bridge credentials for reuse by other clients
   * @param {string} bridgeIp - Bridge IP address
   * @param {string} username - Hue username/API key
   */
  storeBridgeCredentials(bridgeIp, username) {
    this.bridgeCredentials.set(bridgeIp, username);
    this._saveCredentials();
    logger.info('Stored bridge credentials', { bridgeIp });
  }

  /**
   * Get stored credentials for a bridge
   * @param {string} bridgeIp - Bridge IP address
   * @returns {string|null} Username or null if not found
   */
  getBridgeCredentials(bridgeIp) {
    return this.bridgeCredentials.get(bridgeIp) || null;
  }

  /**
   * Check if bridge has stored credentials
   * @param {string} bridgeIp - Bridge IP address
   * @returns {boolean} True if credentials exist
   */
  hasBridgeCredentials(bridgeIp) {
    return this.bridgeCredentials.has(bridgeIp);
  }

  /**
   * Get the first known bridge IP (for single-bridge setups)
   * @returns {string|null} Bridge IP or null if no bridges configured
   */
  getDefaultBridgeIp() {
    const bridges = Array.from(this.bridgeCredentials.keys());
    return bridges.length > 0 ? bridges[0] : null;
  }

  /**
   * Clear stored credentials for a bridge
   * @param {string} bridgeIp - Bridge IP address
   * @returns {boolean} True if credentials were found and cleared
   */
  clearBridgeCredentials(bridgeIp) {
    const existed = this.bridgeCredentials.has(bridgeIp);
    this.bridgeCredentials.delete(bridgeIp);
    this._saveCredentials();

    if (existed) {
      logger.info('Cleared bridge credentials', { bridgeIp });
    }

    return existed;
  }

  /**
   * Create a new session
   * @param {string} bridgeIp - Bridge IP address
   * @param {string} username - Hue username/API key
   * @returns {Object} Session info with token
   */
  createSession(bridgeIp, username) {
    // Generate secure random token
    const sessionToken = this._generateToken();

    // Store session
    this.sessions.set(sessionToken, {
      bridgeIp,
      username,
      createdAt: Date.now(),
      lastUsed: Date.now(),
    });

    logger.info('Created session', { token: sessionToken.substring(0, 8), bridgeIp });

    return {
      sessionToken,
      expiresIn: this.SESSION_EXPIRY / 1000, // seconds
      bridgeIp,
    };
  }

  /**
   * Get session data by token
   * @param {string} sessionToken - Session token
   * @returns {Object|null} Session data or null if not found/expired
   */
  getSession(sessionToken) {
    const session = this.sessions.get(sessionToken);

    if (!session) {
      return null;
    }

    // Check if expired
    const age = Date.now() - session.createdAt;
    if (age > this.SESSION_EXPIRY) {
      this.sessions.delete(sessionToken);
      logger.debug('Expired session', { token: sessionToken.substring(0, 8) });
      return null;
    }

    // Update last used
    session.lastUsed = Date.now();

    return {
      bridgeIp: session.bridgeIp,
      username: session.username,
    };
  }

  /**
   * Revoke a session
   * @param {string} sessionToken - Session token to revoke
   * @returns {boolean} True if session was found and revoked
   */
  revokeSession(sessionToken) {
    const existed = this.sessions.has(sessionToken);
    this.sessions.delete(sessionToken);

    if (existed) {
      logger.info('Revoked session', { token: sessionToken.substring(0, 8) });
    }

    return existed;
  }

  /**
   * Get session stats (for monitoring)
   */
  getStats() {
    return {
      activeSessions: this.sessions.size,
      oldestSession: this._getOldestSessionAge(),
      newestSession: this._getNewestSessionAge(),
    };
  }

  /**
   * Clean up expired sessions
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [token, session] of this.sessions.entries()) {
      const age = now - session.createdAt;
      if (age > this.SESSION_EXPIRY) {
        this.sessions.delete(token);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug('Cleaned up expired sessions', { count: cleaned });
    }

    return cleaned;
  }

  /**
   * Start automatic cleanup interval
   */
  startCleanup() {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL);

    logger.info('Started automatic session cleanup');
  }

  /**
   * Stop automatic cleanup (for testing/shutdown)
   */
  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logger.info('Stopped automatic session cleanup');
    }
  }

  /**
   * Generate a cryptographically secure random token
   * @private
   */
  _generateToken() {
    // Generate 32 bytes of random data and encode as hex
    // Format: hue_sess_<64 hex characters>
    const randomBytes = crypto.randomBytes(32);
    return `hue_sess_${randomBytes.toString('hex')}`;
  }

  /**
   * Get age of oldest session in milliseconds
   * @private
   */
  _getOldestSessionAge() {
    if (this.sessions.size === 0) return 0;

    const now = Date.now();
    let oldest = 0;

    for (const session of this.sessions.values()) {
      const age = now - session.createdAt;
      if (age > oldest) oldest = age;
    }

    return oldest;
  }

  /**
   * Get age of newest session in milliseconds
   * @private
   */
  _getNewestSessionAge() {
    if (this.sessions.size === 0) return 0;

    const now = Date.now();
    let newest = Infinity;

    for (const session of this.sessions.values()) {
      const age = now - session.createdAt;
      if (age < newest) newest = age;
    }

    return newest;
  }

  /**
   * Save bridge credentials to file
   * @private
   */
  _saveCredentials() {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.credentialsFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Convert Map to object for JSON serialization
      const credentials = Object.fromEntries(this.bridgeCredentials);
      fs.writeFileSync(this.credentialsFilePath, JSON.stringify(credentials, null, 2));
      logger.debug('Saved bridge credentials to file');
    } catch (error) {
      logger.warn('Failed to save bridge credentials', { error: error.message });
    }
  }

  /**
   * Load bridge credentials from file
   * @private
   */
  _loadCredentials() {
    try {
      if (!fs.existsSync(this.credentialsFilePath)) {
        logger.debug('No credentials file found, starting fresh');
        return;
      }

      const contents = fs.readFileSync(this.credentialsFilePath, 'utf8');
      if (!contents || contents.trim() === '') {
        logger.debug('Credentials file is empty, starting fresh');
        return;
      }

      const credentials = JSON.parse(contents);
      this.bridgeCredentials = new Map(Object.entries(credentials));
      logger.info('Loaded bridge credentials from file', { count: this.bridgeCredentials.size });
    } catch (error) {
      logger.warn('Failed to load bridge credentials', { error: error.message });
      // Start with empty credentials on error
      this.bridgeCredentials = new Map();
    }
  }
}

// Export singleton instance
export default new SessionManager();
