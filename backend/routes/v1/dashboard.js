import express from 'express';
import { getHueClient } from '../../services/hueClientFactory.js';
import { enrichLight } from '../../utils/colorConversion.js';
import roomService from '../../services/roomService.js';
import statsService from '../../services/statsService.js';
import { extractCredentials } from '../../middleware/auth.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('DASHBOARD_ROUTE');
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
    const hueClient = getHueClient(req);

    logger.info('Fetching data', { bridgeIp, authMethod: req.hue.authMethod });

    // Step 1: Fetch all data in parallel
    const { lightsData, roomsData, devicesData, scenesData } = await hueClient.getDashboardData(
      bridgeIp,
      username
    );

    logger.debug('Fetched data', {
      lights: lightsData.data?.length || 0,
      rooms: roomsData.data?.length || 0,
    });

    // Step 2: Build room hierarchy
    const roomMap = roomService.buildRoomHierarchy(lightsData, roomsData, devicesData);

    if (!roomMap) {
      return res.status(500).json({
        error: 'Failed to build room hierarchy',
      });
    }

    logger.debug('Built hierarchy', { roomCount: Object.keys(roomMap).length });

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

      return {
        id: roomData.roomUuid,
        name: roomName,
        stats,
        lights: enrichedLights,
        scenes,
      };
    });

    // Step 4: Calculate dashboard summary
    const summary = statsService.calculateDashboardStats(lightsData, roomMap, scenesData);

    logger.debug('Summary', {
      lightsOn: summary.lightsOn,
      totalLights: summary.totalLights,
      roomCount: summary.roomCount,
    });

    // Step 5: Return unified response
    res.json({
      summary,
      rooms,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
