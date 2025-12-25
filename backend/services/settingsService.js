/**
 * Settings Service
 * Manages per-session user settings (location, units)
 * Settings persist in memory (reset on server restart)
 */

import { getMockSettings } from './mockData.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('SETTINGS');

const VALID_UNITS = ['celsius', 'fahrenheit'];

// In-memory storage: sessionId -> settings
const sessionSettings = new Map();

// Default settings for new sessions
const getDefaultSettings = () => ({
  location: null,
  units: 'celsius',
});

/**
 * Validate units value
 */
const validateUnits = (units) => {
  if (!VALID_UNITS.includes(units)) {
    throw new Error(`Invalid units value: ${units}. Must be one of: ${VALID_UNITS.join(', ')}`);
  }
};

/**
 * Validate location object
 */
const validateLocation = (location) => {
  if (location === null) return; // null is valid (clearing location)

  if (typeof location !== 'object') {
    throw new Error('Location must be an object');
  }

  if (typeof location.lat !== 'number' || typeof location.lon !== 'number') {
    throw new Error('Location must have numeric lat and lon properties');
  }

  if (location.lat < -90 || location.lat > 90) {
    throw new Error('Latitude must be between -90 and 90');
  }

  if (location.lon < -180 || location.lon > 180) {
    throw new Error('Longitude must be between -180 and 180');
  }
};

class SettingsService {
  /**
   * Get settings for a session
   * @param {string} sessionId - Session identifier
   * @param {boolean} demoMode - Whether in demo mode
   * @returns {object} Settings object
   */
  getSettings(sessionId, demoMode = false) {
    // Return existing settings if stored
    if (sessionSettings.has(sessionId)) {
      return { ...sessionSettings.get(sessionId) };
    }

    // Demo mode returns mock settings as defaults
    if (demoMode) {
      return getMockSettings();
    }

    return getDefaultSettings();
  }

  /**
   * Update settings for a session
   * @param {string} sessionId - Session identifier
   * @param {object} updates - Settings updates (location, units)
   * @returns {object} Updated settings
   */
  updateSettings(sessionId, updates) {
    // Validate updates
    if (updates.units !== undefined) {
      validateUnits(updates.units);
    }

    if (updates.location !== undefined) {
      validateLocation(updates.location);
    }

    // Get existing settings or defaults
    const existing = sessionSettings.has(sessionId)
      ? sessionSettings.get(sessionId)
      : getDefaultSettings();

    // Merge updates
    const newSettings = {
      ...existing,
      ...(updates.units !== undefined && { units: updates.units }),
      ...(updates.location !== undefined && { location: updates.location }),
    };

    sessionSettings.set(sessionId, newSettings);
    logger.debug('Updated settings', { sessionId, updates });

    return { ...newSettings };
  }

  /**
   * Update location only
   * @param {string} sessionId - Session identifier
   * @param {object} location - Location object { lat, lon, name? }
   * @returns {object} Updated settings
   */
  updateLocation(sessionId, location) {
    return this.updateSettings(sessionId, { location });
  }

  /**
   * Clear location for a session
   * @param {string} sessionId - Session identifier
   * @returns {object} Updated settings
   */
  clearLocation(sessionId) {
    return this.updateSettings(sessionId, { location: null });
  }

  /**
   * Clear all session settings (for testing)
   */
  clearAll() {
    sessionSettings.clear();
    logger.debug('Cleared all session settings');
  }
}

export default new SettingsService();
