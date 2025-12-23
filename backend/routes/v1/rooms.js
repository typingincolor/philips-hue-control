import express from 'express';
import hueClient from '../../services/hueClient.js';
import roomService from '../../services/roomService.js';
import colorService from '../../services/colorService.js';
import { extractCredentials } from '../../middleware/auth.js';
import { ResourceNotFoundError } from '../../utils/errors.js';

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

    console.log(`[ROOMS] Updating lights in room ${roomId} (auth: ${req.hue.authMethod})`);

    // Fetch room hierarchy to get lights in this room
    const [lightsData, roomsData, devicesData] = await Promise.all([
      hueClient.getLights(bridgeIp, username),
      hueClient.getRooms(bridgeIp, username),
      hueClient.getDevices(bridgeIp, username)
    ]);

    const roomMap = roomService.buildRoomHierarchy(lightsData, roomsData, devicesData);

    // Find the room
    const room = Object.values(roomMap).find(r => r.roomUuid === roomId);

    if (!room) {
      return res.status(404).json({
        error: 'Room not found'
      });
    }

    console.log(`[ROOMS] Found ${room.lights.length} lights in room`);

    // Convert simplified state to Hue API v2 format
    const hueState = {};
    if (typeof state.on !== 'undefined') {
      hueState.on = { on: state.on };
    }
    if (typeof state.brightness !== 'undefined') {
      hueState.dimming = { brightness: state.brightness };
    }

    // Update all lights in parallel
    const lightUpdates = room.lights.map(light => ({
      lightId: light.id,
      state: hueState
    }));

    await hueClient.updateLights(bridgeIp, username, lightUpdates);

    console.log(`[ROOMS] Updated ${lightUpdates.length} lights`);

    // Fetch updated light states
    const updatedLightsData = await hueClient.getLights(bridgeIp, username);
    const updatedLights = room.lights.map(light => {
      const updated = updatedLightsData.data.find(l => l.id === light.id);
      return updated ? colorService.enrichLight(updated) : null;
    }).filter(Boolean);

    res.json({
      success: true,
      updatedLights
    });
  } catch (error) {
    next(error);
  }
});

export default router;
