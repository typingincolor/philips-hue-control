import hueClient from './hueClient.js';
import colorService from './colorService.js';
import roomService from './roomService.js';
import statsService from './statsService.js';
import motionService from './motionService.js';
import zoneService from './zoneService.js';

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
    console.log(`[DASHBOARD SERVICE] Fetching data for bridge ${bridgeIp}`);

    // Step 1: Fetch all data in parallel (including motion zones and zones)
    const [lightsData, roomsData, devicesData, scenesData, zonesData, motionZonesResult] = await Promise.all([
      hueClient.getLights(bridgeIp, username),
      hueClient.getRooms(bridgeIp, username),
      hueClient.getDevices(bridgeIp, username),
      hueClient.getScenes(bridgeIp, username),
      hueClient.getZones(bridgeIp, username).catch(err => {
        console.error(`[DASHBOARD SERVICE] Failed to fetch zones: ${err.message}`);
        return { data: [] }; // Return empty array on error
      }),
      motionService.getMotionZones(bridgeIp, username).catch(err => {
        console.error(`[DASHBOARD SERVICE] Failed to fetch motion zones: ${err.message}`);
        return { zones: [] }; // Return empty array on error
      })
    ]);

    console.log(`[DASHBOARD SERVICE] Fetched ${lightsData.data?.length || 0} lights, ${roomsData.data?.length || 0} rooms, ${zonesData.data?.length || 0} zones, ${motionZonesResult.zones?.length || 0} motion zones`);

    // Step 2: Build room hierarchy
    const roomMap = roomService.buildRoomHierarchy(lightsData, roomsData, devicesData);

    if (!roomMap) {
      throw new Error('Failed to build room hierarchy');
    }

    console.log(`[DASHBOARD SERVICE] Built hierarchy with ${Object.keys(roomMap).length} rooms`);

    // Step 3: Process each room
    const rooms = Object.entries(roomMap).map(([roomName, roomData]) => {
      // Enrich lights with pre-computed colors and shadows
      const enrichedLights = roomData.lights.map(light => colorService.enrichLight(light));

      // Calculate room statistics
      const stats = roomService.calculateRoomStats(roomData.lights);

      // Get scenes for this room
      const scenes = roomData.roomUuid
        ? roomService.getScenesForRoom(scenesData, roomData.roomUuid)
        : [];

      return {
        id: roomData.roomUuid,
        name: roomName,
        stats,
        lights: enrichedLights,
        scenes
      };
    });

    // Step 4: Build zone hierarchy and process zones
    const zoneMap = zoneService.buildZoneHierarchy(lightsData, zonesData, devicesData) || {};

    const zones = Object.entries(zoneMap).map(([zoneName, zoneData]) => {
      // Enrich lights with pre-computed colors and shadows
      const enrichedLights = zoneData.lights.map(light => colorService.enrichLight(light));

      // Calculate zone statistics
      const stats = zoneService.calculateZoneStats(zoneData.lights);

      // Get scenes for this zone
      const scenes = zoneData.zoneUuid
        ? zoneService.getScenesForZone(scenesData, zoneData.zoneUuid)
        : [];

      return {
        id: zoneData.zoneUuid,
        name: zoneName,
        stats,
        lights: enrichedLights,
        scenes
      };
    });

    // Step 5: Calculate dashboard summary
    const summary = statsService.calculateDashboardStats(lightsData, roomMap, scenesData);

    console.log(`[DASHBOARD SERVICE] Summary: ${summary.lightsOn}/${summary.totalLights} lights on, ${summary.roomCount} rooms, ${zones.length} zones`);

    // Step 6: Return unified response with zones and motion zones
    return {
      summary,
      rooms,
      zones,
      motionZones: motionZonesResult.zones || []
    };
  }
}

export default new DashboardService();
