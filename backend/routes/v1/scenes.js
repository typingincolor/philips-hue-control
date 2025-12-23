import express from 'express';
import hueClient from '../../services/hueClient.js';
import roomService from '../../services/roomService.js';
import colorService from '../../services/colorService.js';
import { extractCredentials } from '../../middleware/auth.js';
import { ResourceNotFoundError } from '../../utils/errors.js';

const router = express.Router();

/**
 * POST /api/v1/scenes/:id/activate
 * Activate a scene and return affected lights
 *
 * Auth: Session token, headers, or query params
 */
router.post('/:id/activate', extractCredentials, async (req, res, next) => {
  try {
    const { id: sceneId } = req.params;
    const { bridgeIp, username } = req.hue;

    console.log(`[SCENES] Activating scene ${sceneId} (auth: ${req.hue.authMethod})`);

    // Activate scene
    await hueClient.activateScene(bridgeIp, username, sceneId);

    // Wait for lights to update (Hue Bridge takes ~500ms to apply scene)
    await new Promise(resolve => setTimeout(resolve, 500));

    // Fetch updated light states
    const [lightsData, roomsData, devicesData, scenesData] = await Promise.all([
      hueClient.getLights(bridgeIp, username),
      hueClient.getRooms(bridgeIp, username),
      hueClient.getDevices(bridgeIp, username),
      hueClient.getScenes(bridgeIp, username)
    ]);

    // Find the scene to determine affected room
    const scene = scenesData.data.find(s => s.id === sceneId);
    if (!scene) {
      // Scene activated but couldn't find it - just return success
      return res.json({
        success: true,
        affectedLights: []
      });
    }

    // Get lights in the scene's room
    const roomMap = roomService.buildRoomHierarchy(lightsData, roomsData, devicesData);
    const room = Object.values(roomMap).find(r => r.roomUuid === scene.group?.rid);

    const affectedLights = room
      ? room.lights.map(light => colorService.enrichLight(light))
      : [];

    console.log(`[SCENES] Scene activated, ${affectedLights.length} lights affected`);

    res.json({
      success: true,
      affectedLights
    });
  } catch (error) {
    next(error);
  }
});

export default router;
