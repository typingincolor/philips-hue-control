import express from 'express';
import hueClient from '../../services/hueClient.js';
import colorService from '../../services/colorService.js';
import roomService from '../../services/roomService.js';
import statsService from '../../services/statsService.js';
import { extractCredentials } from '../../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/v1/dashboard
 * Returns unified dashboard data with pre-computed colors, shadows, and statistics
 *
 * Auth: Session token, headers, or query params
 */
router.get('/', extractCredentials, async (req, res, next) => {
  try {
    const { bridgeIp, username } = req.hue;

    console.log(`[DASHBOARD] Fetching data for bridge ${bridgeIp} (auth: ${req.hue.authMethod})`);

    // Step 1: Fetch all data in parallel
    const [lightsData, roomsData, devicesData, scenesData] = await Promise.all([
      hueClient.getLights(bridgeIp, username),
      hueClient.getRooms(bridgeIp, username),
      hueClient.getDevices(bridgeIp, username),
      hueClient.getScenes(bridgeIp, username)
    ]);

    console.log(`[DASHBOARD] Fetched ${lightsData.data?.length || 0} lights, ${roomsData.data?.length || 0} rooms`);

    // Step 2: Build room hierarchy
    const roomMap = roomService.buildRoomHierarchy(lightsData, roomsData, devicesData);

    if (!roomMap) {
      return res.status(500).json({
        error: 'Failed to build room hierarchy'
      });
    }

    console.log(`[DASHBOARD] Built hierarchy with ${Object.keys(roomMap).length} rooms`);

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

    // Step 4: Calculate dashboard summary
    const summary = statsService.calculateDashboardStats(lightsData, roomMap, scenesData);

    console.log(`[DASHBOARD] Summary: ${summary.lightsOn}/${summary.totalLights} lights on, ${summary.roomCount} rooms`);

    // Step 5: Return unified response
    res.json({
      summary,
      rooms
    });
  } catch (error) {
    next(error);
  }
});

export default router;
