import express from 'express';
import hueClient from '../../services/hueClient.js';
import zoneService from '../../services/zoneService.js';
import colorService from '../../services/colorService.js';
import { extractCredentials } from '../../middleware/auth.js';

const router = express.Router();

/**
 * PUT /api/v1/zones/:id/lights
 * Update all lights in a zone
 *
 * Auth: Session token, headers, or query params
 */
router.put('/:id/lights', extractCredentials, async (req, res, next) => {
  try {
    const { id: zoneId } = req.params;
    const { bridgeIp, username } = req.hue;
    const state = req.body;

    console.log(`[ZONES] Updating lights in zone ${zoneId} (auth: ${req.hue.authMethod})`);

    // Fetch zone hierarchy to get lights in this zone
    const [lightsData, zonesData, devicesData] = await Promise.all([
      hueClient.getLights(bridgeIp, username),
      hueClient.getZones(bridgeIp, username),
      hueClient.getDevices(bridgeIp, username)
    ]);

    const zoneMap = zoneService.buildZoneHierarchy(lightsData, zonesData, devicesData);

    // Find the zone
    const zone = Object.values(zoneMap).find(z => z.zoneUuid === zoneId);

    if (!zone) {
      return res.status(404).json({
        error: 'Zone not found'
      });
    }

    console.log(`[ZONES] Found ${zone.lights.length} lights in zone`);

    // Convert simplified state to Hue API v2 format
    const hueState = {};
    if (typeof state.on !== 'undefined') {
      hueState.on = { on: state.on };
    }
    if (typeof state.brightness !== 'undefined') {
      hueState.dimming = { brightness: state.brightness };
    }

    // Update all lights in parallel
    const lightUpdates = zone.lights.map(light => ({
      lightId: light.id,
      state: hueState
    }));

    await hueClient.updateLights(bridgeIp, username, lightUpdates);

    console.log(`[ZONES] Updated ${lightUpdates.length} lights`);

    // Fetch updated light states
    const updatedLightsData = await hueClient.getLights(bridgeIp, username);
    const updatedLights = zone.lights.map(light => {
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
