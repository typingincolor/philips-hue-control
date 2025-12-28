/**
 * Room Mapping Service - Maps service-specific rooms to unified Home rooms
 * Persists mappings to backend/data/roomMappings.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('ROOM_MAPPING');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const MAPPINGS_FILE = path.join(DATA_DIR, 'roomMappings.json');

class RoomMappingServiceClass {
  constructor() {
    // serviceKey -> homeRoomId (e.g., 'hue:room-1' -> 'home-room-1')
    this._mappings = {};
    // homeRoomId -> room name
    this._roomNames = {};
    this._initialized = false;
  }

  /**
   * Initialize the service by loading existing mappings
   */
  initialize() {
    try {
      if (fs.existsSync(MAPPINGS_FILE)) {
        const data = fs.readFileSync(MAPPINGS_FILE, 'utf-8');
        const saved = JSON.parse(data);
        this._mappings = saved.mappings || saved;
        this._roomNames = saved.roomNames || {};
        logger.info('Loaded room mappings', { count: Object.keys(this._mappings).length });
      } else {
        this._mappings = {};
        this._roomNames = {};
        logger.info('No existing room mappings found');
      }
    } catch (error) {
      logger.error('Failed to load room mappings', { error: error.message });
      this._mappings = {};
      this._roomNames = {};
    }
    this._initialized = true;
  }

  /**
   * Reset internal state (for testing)
   */
  reset() {
    this._mappings = {};
    this._roomNames = {};
    this._initialized = false;
  }

  /**
   * Get all current mappings
   * @returns {Object} Mappings object
   */
  getAllMappings() {
    return { ...this._mappings };
  }

  /**
   * Map a service room to a home room
   * @param {string} serviceId - Service identifier (hue, hive, etc.)
   * @param {string} roomId - Service-specific room ID
   * @param {string} name - Room name
   * @returns {string} Home room ID
   */
  mapServiceRoom(serviceId, roomId, name) {
    const serviceKey = `${serviceId}:${roomId}`;

    // Return existing mapping if present
    if (this._mappings[serviceKey]) {
      return this._mappings[serviceKey];
    }

    // Create new mapping
    const homeRoomId = `home-${roomId}`;
    this._mappings[serviceKey] = homeRoomId;
    this._roomNames[homeRoomId] = name;

    this._persist();
    logger.info('Created room mapping', { serviceKey, homeRoomId, name });

    return homeRoomId;
  }

  /**
   * Get home room ID for a service room
   * @param {string} serviceId - Service identifier
   * @param {string} roomId - Service-specific room ID
   * @returns {string|null} Home room ID or null if not mapped
   */
  getHomeRoomId(serviceId, roomId) {
    const serviceKey = `${serviceId}:${roomId}`;
    return this._mappings[serviceKey] || null;
  }

  /**
   * Get all service room IDs mapped to a home room
   * @param {string} homeRoomId - Home room ID
   * @returns {Array<{serviceId: string, roomId: string}>} Service room references
   */
  getServiceRoomIds(homeRoomId) {
    const results = [];

    for (const [serviceKey, mappedHomeId] of Object.entries(this._mappings)) {
      if (mappedHomeId === homeRoomId) {
        const [serviceId, roomId] = serviceKey.split(':');
        results.push({ serviceId, roomId });
      }
    }

    return results;
  }

  /**
   * Merge multiple service rooms into one home room
   * @param {string[]} serviceKeys - Array of service keys ('serviceId:roomId')
   * @param {string} homeRoomId - Target home room ID
   */
  mergeRooms(serviceKeys, homeRoomId) {
    for (const serviceKey of serviceKeys) {
      this._mappings[serviceKey] = homeRoomId;
    }
    this._persist();
    logger.info('Merged rooms', { serviceKeys, homeRoomId });
  }

  /**
   * Delete a service room mapping
   * @param {string} serviceId - Service identifier
   * @param {string} roomId - Service-specific room ID
   */
  deleteMapping(serviceId, roomId) {
    const serviceKey = `${serviceId}:${roomId}`;
    delete this._mappings[serviceKey];
    this._persist();
    logger.info('Deleted room mapping', { serviceKey });
  }

  /**
   * Get room name for a service room
   * @param {string} serviceId - Service identifier
   * @param {string} roomId - Service-specific room ID
   * @returns {string|null} Room name or null
   */
  getRoomName(serviceId, roomId) {
    const homeRoomId = this.getHomeRoomId(serviceId, roomId);
    if (homeRoomId) {
      return this._roomNames[homeRoomId] || null;
    }
    return null;
  }

  /**
   * Get room name by home room ID
   * @param {string} homeRoomId - Home room ID
   * @returns {string|null} Room name or null
   */
  getRoomNameById(homeRoomId) {
    return this._roomNames[homeRoomId] || null;
  }

  /**
   * Set room name for a home room
   * @param {string} homeRoomId - Home room ID
   * @param {string} name - New room name
   */
  setRoomName(homeRoomId, name) {
    this._roomNames[homeRoomId] = name;
    this._persist();
    logger.info('Updated room name', { homeRoomId, name });
  }

  /**
   * Persist mappings to disk
   */
  _persist() {
    try {
      // Ensure data directory exists
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      const data = JSON.stringify(
        {
          mappings: this._mappings,
          roomNames: this._roomNames,
        },
        null,
        2
      );
      fs.writeFileSync(MAPPINGS_FILE, data, 'utf-8');
    } catch (error) {
      logger.error('Failed to persist room mappings', { error: error.message });
    }
  }
}

const roomMappingService = new RoomMappingServiceClass();
export default roomMappingService;
