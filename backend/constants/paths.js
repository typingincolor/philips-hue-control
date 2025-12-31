/**
 * Path constants for the backend
 *
 * DATA_DIR is the directory where persistent data is stored.
 * Can be configured via DATA_DIR environment variable.
 *
 * Default paths:
 * - Docker: /app/data (set via Dockerfile)
 * - Development: ./data (relative to backend folder)
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default to ./data relative to backend folder for development
const DEFAULT_DATA_DIR = path.join(__dirname, '..', 'data');

// Use environment variable if set, otherwise use default
export const DATA_DIR = process.env.DATA_DIR || DEFAULT_DATA_DIR;

// File paths for persistent data
export const BRIDGE_CREDENTIALS_FILE = path.join(DATA_DIR, 'bridge-credentials.json');
export const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
export const HIVE_CREDENTIALS_FILE = path.join(DATA_DIR, 'hive-credentials.json');
export const SPOTIFY_CREDENTIALS_FILE = path.join(DATA_DIR, 'spotify-credentials.json');
export const SLUG_MAPPINGS_FILE = path.join(DATA_DIR, 'slug-mappings.json');
export const ROOM_MAPPINGS_FILE = path.join(DATA_DIR, 'roomMappings.json');
