/**
 * Home Service - Aggregates data from all service plugins into unified Home model
 */

import { createHome } from '../models/Home.js';
import ServiceRegistry from './ServiceRegistry.js';
import roomMappingService from './roomMappingService.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('HOME');

class HomeServiceClass {
  constructor() {
    // Initialize room mappings on first use
    this._initialized = false;
  }

  _ensureInitialized() {
    if (!this._initialized) {
      roomMappingService.initialize();
      this._initialized = true;
    }
  }

  /**
   * Get the full home structure
   * @param {boolean} demoMode - Whether to use demo mode
   * @returns {Promise<Object>} Home object
   */
  async getHome(demoMode = false) {
    this._ensureInitialized();

    const allRooms = [];
    const allDevices = [];

    // ServiceRegistry automatically uses request context to determine demo mode
    const plugins = ServiceRegistry.getAll();

    for (const plugin of plugins) {
      const serviceId = plugin.constructor.id;

      try {
        // Check if plugin is connected
        const isConnected = plugin.isConnected(demoMode);
        if (!isConnected) {
          continue;
        }

        // Get rooms from plugin
        if (typeof plugin.getRooms === 'function') {
          try {
            const rooms = await plugin.getRooms(demoMode);
            for (const room of rooms) {
              // Map service room to home room
              const homeRoomId = roomMappingService.mapServiceRoom(serviceId, room.id, room.name);
              allRooms.push({
                ...room,
                id: homeRoomId,
              });
            }
          } catch (error) {
            logger.error('Failed to get rooms from plugin', { serviceId, error: error.message });
          }
        }

        // Get home-level devices from plugin
        if (typeof plugin.getDevices === 'function') {
          try {
            const devices = await plugin.getDevices(demoMode);
            allDevices.push(...devices);
          } catch (error) {
            logger.error('Failed to get devices from plugin', { serviceId, error: error.message });
          }
        }
      } catch (error) {
        logger.error('Error processing plugin', { serviceId, error: error.message });
      }
    }

    return createHome({
      rooms: allRooms,
      devices: allDevices,
      zones: [],
    });
  }

  /**
   * Get a single room by home room ID
   * @param {string} homeRoomId - Home room ID
   * @param {boolean} demoMode - Whether to use demo mode
   * @returns {Promise<Object|null>} Room object or null
   */
  async getRoom(homeRoomId, demoMode = false) {
    const home = await this.getHome(demoMode);
    return home.rooms.find((r) => r.id === homeRoomId) || null;
  }

  /**
   * Update a device state
   * @param {string} deviceId - Device ID in format 'serviceId:originalId'
   * @param {Object} state - New state to apply
   * @param {boolean} demoMode - Whether to use demo mode
   * @returns {Promise<Object>} Result object
   */
  async updateDevice(deviceId, state, demoMode = false) {
    const [serviceId, originalId] = deviceId.split(':');

    if (!serviceId || !originalId) {
      throw new Error(`Invalid device ID format: ${deviceId}`);
    }

    const plugin = ServiceRegistry.get(serviceId, demoMode);

    if (!plugin) {
      throw new Error(`Unknown service: ${serviceId}`);
    }

    if (typeof plugin.updateDevice !== 'function') {
      throw new Error(`Service ${serviceId} does not support device updates`);
    }

    return plugin.updateDevice(originalId, state);
  }

  /**
   * Activate a scene
   * @param {string} sceneId - Scene ID in format 'serviceId:originalId'
   * @param {boolean} demoMode - Whether to use demo mode
   * @returns {Promise<Object>} Result object
   */
  async activateScene(sceneId, demoMode = false) {
    const [serviceId, originalId] = sceneId.split(':');

    if (!serviceId || !originalId) {
      throw new Error(`Invalid scene ID format: ${sceneId}`);
    }

    const plugin = ServiceRegistry.get(serviceId, demoMode);

    if (!plugin) {
      throw new Error(`Unknown service: ${serviceId}`);
    }

    if (typeof plugin.activateScene !== 'function') {
      throw new Error(`Service ${serviceId} does not support scene activation`);
    }

    return plugin.activateScene(originalId);
  }

  /**
   * Update all devices in a room
   * @param {string} roomId - Room ID (home room ID like 'home-living-room' or serviceId:roomId)
   * @param {Object} state - New state to apply
   * @param {boolean} demoMode - Whether to use demo mode
   * @returns {Promise<Object>} Result object
   */
  async updateRoomDevices(roomId, state, demoMode = false) {
    this._ensureInitialized();

    // If roomId is in serviceId:roomId format, use it directly
    if (roomId.includes(':')) {
      const [serviceId, originalId] = roomId.split(':');
      const plugin = ServiceRegistry.get(serviceId, demoMode);

      if (!plugin) {
        throw new Error(`Unknown service: ${serviceId}`);
      }

      if (typeof plugin.updateRoomDevices !== 'function') {
        throw new Error(`Service ${serviceId} does not support room updates`);
      }

      return plugin.updateRoomDevices(originalId, state);
    }

    // Resolve home room ID to service room IDs
    let serviceRooms = roomMappingService.getServiceRoomIds(roomId);

    // Fallback: try with 'home-' prefix if not found (handles V1-style IDs from WebSocket)
    if (serviceRooms.length === 0 && !roomId.startsWith('home-')) {
      serviceRooms = roomMappingService.getServiceRoomIds(`home-${roomId}`);
    }

    if (serviceRooms.length === 0) {
      throw new Error(`Room not found: ${roomId}`);
    }

    // Update each service's room
    const results = [];
    for (const { serviceId, roomId: serviceRoomId } of serviceRooms) {
      const plugin = ServiceRegistry.get(serviceId, demoMode);

      if (!plugin) {
        continue;
      }

      if (typeof plugin.updateRoomDevices !== 'function') {
        continue;
      }

      const result = await plugin.updateRoomDevices(serviceRoomId, state);
      results.push(result);
    }

    return {
      success: results.every((r) => r.success),
      updatedLights: results.flatMap((r) => r.updatedLights || []),
    };
  }

  /**
   * Update all devices in a zone
   * @param {string} zoneId - Zone ID (can be plain ID or prefixed with serviceId:)
   * @param {Object} state - New state to apply
   * @param {boolean} demoMode - Whether to use demo mode
   * @returns {Promise<Object>} Result object
   */
  async updateZoneDevices(zoneId, state, demoMode = false) {
    // Zone IDs may or may not be prefixed - try to find the service
    let serviceId = 'hue';
    let originalId = zoneId;

    if (zoneId.includes(':')) {
      [serviceId, originalId] = zoneId.split(':');
    }

    const plugin = ServiceRegistry.get(serviceId, demoMode);

    if (!plugin) {
      throw new Error(`Unknown service: ${serviceId}`);
    }

    if (typeof plugin.updateZoneDevices !== 'function') {
      throw new Error(`Service ${serviceId} does not support zone updates`);
    }

    return plugin.updateZoneDevices(originalId, state);
  }
}

const homeService = new HomeServiceClass();
export default homeService;
