import express from 'express';
import hueClient from '../../services/hueClient.js';
import colorService from '../../services/colorService.js';
import { extractCredentials } from '../../middleware/auth.js';
import { ResourceNotFoundError } from '../../utils/errors.js';

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

    console.log(`[LIGHTS] Updating light ${id} (auth: ${req.hue.authMethod})`);

    // Convert simplified state to Hue API v2 format
    const hueState = {};
    if (typeof state.on !== 'undefined') {
      hueState.on = { on: state.on };
    }
    if (typeof state.brightness !== 'undefined') {
      hueState.dimming = { brightness: state.brightness };
    }

    // Update light on bridge
    await hueClient.updateLight(bridgeIp, username, id, hueState);

    // Fetch updated light state
    const lightsData = await hueClient.getLights(bridgeIp, username);
    const updatedLight = lightsData.data.find(light => light.id === id);

    if (!updatedLight) {
      throw new ResourceNotFoundError('light', id);
    }

    // Enrich with color and shadow
    const enrichedLight = colorService.enrichLight(updatedLight);

    console.log(`[LIGHTS] Light ${id} updated successfully`);

    res.json({
      success: true,
      light: enrichedLight
    });
  } catch (error) {
    next(error);
  }
});

export default router;
