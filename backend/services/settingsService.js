/**
 * Settings Service
 * Manages user settings (location, units) with file persistence
 * Settings persist across server restarts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getMockSettings } from './mockData.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('SETTINGS');

// Get the directory of this module for default settings path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VALID_UNITS = ['celsius', 'fahrenheit'];
const VALID_SERVICES = ['hue', 'hive'];

// In-memory storage: sessionId -> settings
const sessionSettings = new Map();

// Default services configuration
const getDefaultServices = () => ({
  hue: { enabled: true },
  hive: { enabled: false },
});

// Global settings (persisted to file)
let globalSettings = {
  location: null,
  units: 'celsius',
  services: getDefaultServices(),
};

// Default settings for new sessions
const getDefaultSettings = () => ({
  location: globalSettings.location,
  units: globalSettings.units,
  services: { ...globalSettings.services },
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
 * Validate services object
 */
const validateServices = (services) => {
  if (typeof services !== 'object' || services === null) {
    throw new Error('Invalid services: must be an object');
  }

  for (const [serviceName, config] of Object.entries(services)) {
    if (!VALID_SERVICES.includes(serviceName)) {
      throw new Error(`Invalid services structure: unknown service '${serviceName}'`);
    }

    if (typeof config !== 'object' || config === null) {
      throw new Error(`Invalid services structure: ${serviceName} must be an object`);
    }

    if (config.enabled !== undefined && typeof config.enabled !== 'boolean') {
      throw new Error(`Invalid enabled value: must be boolean for ${serviceName}`);
    }
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
  constructor() {
    // Default path for settings file
    this.settingsFilePath = path.join(__dirname, '..', 'data', 'settings.json');

    // Load persisted settings on startup
    this._loadSettings();
  }

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

    // Demo mode always returns mock settings (with all services enabled)
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

    if (updates.services !== undefined) {
      validateServices(updates.services);
    }

    // Get existing settings or defaults
    const existing = sessionSettings.has(sessionId)
      ? sessionSettings.get(sessionId)
      : getDefaultSettings();

    // Deep merge services if provided
    let mergedServices = existing.services || getDefaultServices();
    if (updates.services) {
      mergedServices = {
        ...mergedServices,
        ...Object.fromEntries(
          Object.entries(updates.services).map(([key, value]) => [
            key,
            { ...mergedServices[key], ...value },
          ])
        ),
      };
    }

    // Merge updates
    const newSettings = {
      ...existing,
      ...(updates.units !== undefined && { units: updates.units }),
      ...(updates.location !== undefined && { location: updates.location }),
      services: mergedServices,
    };

    sessionSettings.set(sessionId, newSettings);

    // Update global settings and persist
    if (updates.location !== undefined) {
      globalSettings.location = updates.location;
    }
    if (updates.units !== undefined) {
      globalSettings.units = updates.units;
    }
    if (updates.services !== undefined) {
      globalSettings.services = mergedServices;
    }
    this._saveSettings();

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
    globalSettings = { location: null, units: 'celsius', services: getDefaultServices() };
    logger.debug('Cleared all session settings');
  }

  /**
   * Save settings to file
   * @private
   */
  _saveSettings() {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.settingsFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const data = {
        location: globalSettings.location,
        units: globalSettings.units,
        services: globalSettings.services,
      };

      fs.writeFileSync(this.settingsFilePath, JSON.stringify(data, null, 2));
      logger.debug('Saved settings to file');
    } catch (error) {
      logger.warn('Failed to save settings', { error: error.message });
    }
  }

  /**
   * Load settings from file
   * @private
   */
  _loadSettings() {
    try {
      if (!fs.existsSync(this.settingsFilePath)) {
        logger.debug('No settings file found');
        return;
      }

      const contents = fs.readFileSync(this.settingsFilePath, 'utf8');
      if (!contents || contents.trim() === '') {
        logger.debug('Settings file is empty');
        return;
      }

      const data = JSON.parse(contents);

      // Load location if present
      if (data.location !== undefined) {
        globalSettings.location = data.location;
      }

      // Load units if present
      if (data.units !== undefined) {
        globalSettings.units = data.units;
      }

      // Load services if present
      if (data.services !== undefined) {
        globalSettings.services = {
          ...getDefaultServices(),
          ...data.services,
        };
      }

      if (globalSettings.location) {
        logger.info('Loaded settings from file', { location: globalSettings.location.name });
      }
    } catch (error) {
      logger.warn('Failed to load settings', { error: error.message });
      // Start with default settings on error
      globalSettings = { location: null, units: 'celsius', services: getDefaultServices() };
    }
  }
}

export default new SettingsService();
