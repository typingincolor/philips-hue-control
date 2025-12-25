import express from 'express';
import { getHueClient } from '../../services/hueClientFactory.js';
import { enrichLight } from '../../utils/colorConversion.js';
import { extractCredentials } from '../../middleware/auth.js';
import { ResourceNotFoundError } from '../../utils/errors.js';
import { convertToHueState } from '../../utils/stateConversion.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('LIGHTS');
const router = express.Router();

/**
 * PUT /api/v1/lights/:id
 * Update a single light's state
 *
 * Auth: Session token, headers, or query params
 */
router.put('/:id', extractCredentials, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { bridgeIp, username } = req.hue;
    const state = req.body;
    const hueClient = getHueClient(req);

    logger.info('Updating light', { lightId: id, authMethod: req.hue.authMethod });

    // Convert simplified state to Hue API v2 format
    const hueState = convertToHueState(state);

    // Update light on bridge
    await hueClient.updateLight(bridgeIp, username, id, hueState);

    // Fetch updated light state
    const lightsData = await hueClient.getLights(bridgeIp, username);
    const updatedLight = lightsData.data.find((light) => light.id === id);

    if (!updatedLight) {
      throw new ResourceNotFoundError('light', id);
    }

    // Enrich with color and shadow
    const enrichedLight = enrichLight(updatedLight);

    logger.info('Light updated successfully', { lightId: id });

    res.json({
      success: true,
      light: enrichedLight,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
