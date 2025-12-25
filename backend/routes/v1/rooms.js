import express from 'express';
import { getHueClient } from '../../services/hueClientFactory.js';
import roomService from '../../services/roomService.js';
import { enrichLight } from '../../utils/colorConversion.js';
import { extractCredentials } from '../../middleware/auth.js';
import { convertToHueState } from '../../utils/stateConversion.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('ROOMS');
const router = express.Router();

/**
 * PUT /api/v1/rooms/:id/lights
 * Update all lights in a room
 *
 * Auth: Session token, headers, or query params
 */
router.put('/:id/lights', extractCredentials, async (req, res, next) => {
  try {
    const { id: roomId } = req.params;
    const { bridgeIp, username } = req.hue;
    const state = req.body;
    const hueClient = getHueClient(req);

    logger.info('Updating lights in room', { roomId, authMethod: req.hue.authMethod });

    // Fetch room hierarchy to get lights in this room
    const { lightsData, roomsData, devicesData } = await hueClient.getHierarchyData(
      bridgeIp,
      username
    );

    const roomMap = roomService.buildRoomHierarchy(lightsData, roomsData, devicesData);

    // Find the room
    const room = Object.values(roomMap).find((r) => r.roomUuid === roomId);

    if (!room) {
      return res.status(404).json({
        error: 'Room not found',
      });
    }

    logger.debug('Found lights in room', { count: room.lights.length });

    // Convert simplified state to Hue API v2 format
    const hueState = convertToHueState(state);

    // Update all lights in parallel
    const lightUpdates = room.lights.map((light) => ({
      lightId: light.id,
      state: hueState,
    }));

    await hueClient.updateLights(bridgeIp, username, lightUpdates);

    logger.info('Updated lights', { count: lightUpdates.length });

    // Fetch updated light states
    const updatedLightsData = await hueClient.getLights(bridgeIp, username);
    const updatedLights = room.lights
      .map((light) => {
        const updated = updatedLightsData.data.find((l) => l.id === light.id);
        return updated ? enrichLight(updated) : null;
      })
      .filter(Boolean);

    res.json({
      success: true,
      updatedLights,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
