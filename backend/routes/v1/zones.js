import express from 'express';
import { getHueClient } from '../../services/hueClientFactory.js';
import zoneService from '../../services/zoneService.js';
import { enrichLight } from '../../utils/colorConversion.js';
import { extractCredentials } from '../../middleware/auth.js';
import { convertToHueState } from '../../utils/stateConversion.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('ZONES');
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
    const hueClient = getHueClient(req);

    logger.info('Updating lights in zone', { zoneId, authMethod: req.hue.authMethod });

    // Fetch zone hierarchy to get lights in this zone
    const { lightsData, zonesData, devicesData } = await hueClient.getZoneHierarchyData(
      bridgeIp,
      username
    );

    const zoneMap = zoneService.buildZoneHierarchy(lightsData, zonesData, devicesData);

    // Find the zone
    const zone = Object.values(zoneMap).find((z) => z.zoneUuid === zoneId);

    if (!zone) {
      return res.status(404).json({
        error: 'Zone not found',
      });
    }

    logger.debug('Found lights in zone', { count: zone.lights.length });

    // Convert simplified state to Hue API v2 format
    const hueState = convertToHueState(state);

    // Update all lights in parallel
    const lightUpdates = zone.lights.map((light) => ({
      lightId: light.id,
      state: hueState,
    }));

    await hueClient.updateLights(bridgeIp, username, lightUpdates);

    logger.info('Updated lights', { count: lightUpdates.length });

    // Fetch updated light states
    const updatedLightsData = await hueClient.getLights(bridgeIp, username);
    const updatedLights = zone.lights
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
