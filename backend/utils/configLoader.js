/**
 * Config Loader Utility
 * Loads config.yaml and interpolates environment variables
 *
 * Supports two modes:
 * 1. Environment variable placeholders: clientId: ${SPOTIFY_CLIENT_ID}
 * 2. Direct values: clientId: 'your-actual-client-id'
 */

import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { load } from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Interpolate environment variables in a string
 * Replaces ${VAR_NAME} with process.env.VAR_NAME
 * @param {string} value - String that may contain ${VAR} patterns
 * @returns {string} - Interpolated string
 */
function interpolateEnvVars(value) {
  if (typeof value !== 'string') return value;

  return value.replace(/\$\{([^}]+)\}/g, (match, varName) => {
    const envValue = process.env[varName];
    // Return env var value if set, otherwise return empty string
    // (keeps the placeholder as-is if you want to see it wasn't set)
    return envValue !== undefined ? envValue : '';
  });
}

/**
 * Recursively process config object, interpolating env vars in all string values
 * @param {any} obj - Config object or value
 * @returns {any} - Processed config
 */
function processConfig(obj) {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return interpolateEnvVars(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(processConfig);
  }

  if (typeof obj === 'object') {
    const processed = {};
    for (const [key, value] of Object.entries(obj)) {
      processed[key] = processConfig(value);
    }
    return processed;
  }

  return obj;
}

/**
 * Load and process config.yaml
 * @returns {Object} - Processed config with env vars interpolated
 */
export function loadConfig() {
  const configPath = path.resolve(__dirname, '../../config.yaml');
  const rawConfig = load(readFileSync(configPath, 'utf-8'));
  return processConfig(rawConfig);
}

/**
 * Get Spotify config with validation
 * @param {Object} config - Full config object
 * @returns {Object|null} - Spotify config or null if not configured
 */
export function getSpotifyConfig(config) {
  const spotify = config?.spotify;
  if (!spotify) return null;

  // Check if credentials are actually set (not empty after env var interpolation)
  const hasClientId = spotify.clientId && spotify.clientId.trim() !== '';
  const hasClientSecret = spotify.clientSecret && spotify.clientSecret.trim() !== '';

  if (!hasClientId || !hasClientSecret) {
    return null;
  }

  return {
    clientId: spotify.clientId,
    clientSecret: spotify.clientSecret,
    redirectUri: spotify.redirectUri || 'http://localhost:3001/api/v2/services/spotify/callback',
    scopes: spotify.scopes || [],
  };
}

export default loadConfig;
