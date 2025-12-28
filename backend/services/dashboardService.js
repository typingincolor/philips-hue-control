import { getHueClientForBridge } from './hueClientFactory.js';
import { enrichLight } from '../utils/colorConversion.js';
import roomService from './roomService.js';
import statsService from './statsService.js';
import motionService from './motionService.js';
import zoneService from './zoneService.js';
import ServiceRegistry from './ServiceRegistry.js';
import { createLogger } from '../utils/logger.js';
import { normalizeDashboardLight } from './deviceNormalizer.js';
import slugMappingService from './slugMappingService.js';

const logger = createLogger('DASHBOARD');

/**
 * Dashboard Service
 * Provides dashboard data fetching for WebSocket and HTTP routes
 */
class DashboardService {
  /**
   * Get unified dashboard data with pre-computed colors, shadows, and statistics
   * @param {string} bridgeIp - Bridge IP address
   * @param {string} username - Hue API username
   * @returns {Promise<Object>} Dashboard data with summary and rooms
   */
  async getDashboard(bridgeIp, username) {
    logger.debug('Fetching data', { bridgeIp });

    // Get the appropriate client (mock for demo, real otherwise)
    const hueClient = getHueClientForBridge(bridgeIp);

    // Step 1: Fetch all data in parallel (including motion zones and zones)
    const [lightsData, roomsData, devicesData, scenesData, zonesData, motionZonesResult] =
      await Promise.all([
        hueClient.getLights(bridgeIp, username),
        hueClient.getRooms(bridgeIp, username),
        hueClient.getDevices(bridgeIp, username),
        hueClient.getScenes(bridgeIp, username),
        hueClient.getZones(bridgeIp, username).catch((err) => {
          logger.warn('Failed to fetch zones', { error: err.message });
          return { data: [] }; // Return empty array on error
        }),
        motionService.getMotionZones(bridgeIp, username).catch((err) => {
          logger.warn('Failed to fetch motion zones', { error: err.message });
          return { zones: [] }; // Return empty array on error
        }),
      ]);

    logger.debug('Fetched data', {
      lights: lightsData.data?.length || 0,
      rooms: roomsData.data?.length || 0,
      zones: zonesData.data?.length || 0,
      motionZones: motionZonesResult.zones?.length || 0,
    });

    // Step 2: Build room hierarchy
    const roomMap = roomService.buildRoomHierarchy(lightsData, roomsData, devicesData);

    if (!roomMap) {
      throw new Error('Failed to build room hierarchy');
    }

    logger.debug('Built room hierarchy', { roomCount: Object.keys(roomMap).length });

    // Step 3: Process each room
    const rooms = Object.entries(roomMap).map(([roomName, roomData]) => {
      // Enrich lights with pre-computed colors and shadows
      const enrichedLights = roomData.lights.map((light) => enrichLight(light));

      // Calculate room statistics
      const stats = roomService.calculateRoomStats(roomData.lights);

      // Get scenes for this room
      const scenes = roomData.roomUuid
        ? roomService.getScenesForRoom(scenesData, roomData.roomUuid)
        : [];

      // Create stable slug for room
      const roomSlug = roomData.roomUuid
        ? slugMappingService.getSlug('hue:room', roomData.roomUuid, roomName)
        : null;

      return {
        id: roomSlug,
        _uuid: roomData.roomUuid,
        name: roomName,
        stats,
        lights: enrichedLights,
        scenes: scenes.map((scene) => ({
          ...scene,
          id: slugMappingService.getSlug('hue:scene', scene.id, scene.name),
          _uuid: scene.id,
        })),
      };
    });

    // Step 4: Build zone hierarchy and process zones
    const zoneMap = zoneService.buildZoneHierarchy(lightsData, zonesData, devicesData) || {};

    const zones = Object.entries(zoneMap).map(([zoneName, zoneData]) => {
      // Enrich lights with pre-computed colors and shadows
      const enrichedLights = zoneData.lights.map((light) => enrichLight(light));

      // Calculate zone statistics
      const stats = zoneService.calculateZoneStats(zoneData.lights);

      // Get scenes for this zone
      const scenes = zoneData.zoneUuid
        ? zoneService.getScenesForZone(scenesData, zoneData.zoneUuid)
        : [];

      // Create stable slug for zone
      const zoneSlug = zoneData.zoneUuid
        ? slugMappingService.getSlug('hue:zone', zoneData.zoneUuid, zoneName)
        : null;

      return {
        id: zoneSlug,
        _uuid: zoneData.zoneUuid,
        name: zoneName,
        stats,
        lights: enrichedLights,
        scenes: scenes.map((scene) => ({
          ...scene,
          id: slugMappingService.getSlug('hue:scene', scene.id, scene.name),
          _uuid: scene.id,
        })),
      };
    });

    // Step 5: Calculate dashboard summary
    const summary = statsService.calculateDashboardStats(lightsData, roomMap, scenesData);

    logger.debug('Summary', {
      lightsOn: summary.lightsOn,
      totalLights: summary.totalLights,
      roomCount: summary.roomCount,
      zoneCount: zones.length,
    });

    // Step 6: Fetch status from all connected service plugins
    const services = {};
    for (const plugin of ServiceRegistry.getAll()) {
      const pluginId = plugin.constructor.id;
      if (pluginId === 'hue') continue; // Hue is core, handled separately

      try {
        if (plugin.isConnected()) {
          services[pluginId] = await plugin.getStatus();
        }
      } catch {
        // Plugin not connected or error - skip
      }
    }

    // Step 7: Return unified response with zones, motion zones, and services
    return {
      summary,
      rooms,
      zones,
      motionZones: motionZonesResult.zones || [],
      services,
    };
  }

  /**
   * Transform a dashboard room to Home format
   * @param {Object} room - Dashboard room object
   * @returns {Object} Home-formatted room with normalized devices
   */
  transformRoomToHomeFormat(room) {
    return {
      id: room.id, // Already a slug from getDashboard
      _uuid: room._uuid,
      name: room.name,
      devices: (room.lights || []).map(normalizeDashboardLight),
      scenes: (room.scenes || []).map((scene) => ({
        id: scene.id, // Already a slug from getDashboard
        _uuid: scene._uuid,
        name: scene.name,
        serviceId: 'hue',
      })),
    };
  }
}

export default new DashboardService();
