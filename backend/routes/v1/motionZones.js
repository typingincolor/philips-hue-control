import express from 'express';
import motionService from '../../services/motionService.js';
import { extractCredentials } from '../../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/v1/motion-zones
 * Returns MotionAware zones with parsed motion data
 *
 * Auth: Session token, headers, or query params
 */
router.get('/', extractCredentials, async (req, res, next) => {
  try {
    const { bridgeIp, username } = req.hue;

    console.log(`[MOTION-ZONES] Fetching motion zones for bridge ${bridgeIp} (auth: ${req.hue.authMethod})`);

    // Fetch and parse motion zones
    const result = await motionService.getMotionZones(bridgeIp, username);

    console.log(`[MOTION-ZONES] Found ${result.zones.length} motion zones`);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
