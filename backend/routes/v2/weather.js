/**
 * V2 Weather Routes
 * Weather endpoints for the V2 API
 */

import express from 'express';
import weatherService from '../../services/weatherService.js';
import settingsService from '../../services/settingsService.js';
import { requireSession } from '../../middleware/auth.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('V2_WEATHER');
const router = express.Router();

/**
 * GET /api/v2/weather
 * Get weather for configured location
 */
router.get('/', requireSession, async (req, res, next) => {
  try {
    const { sessionToken } = req.hue;
    const demoMode = req.demoMode || false;

    logger.debug('Getting weather', { sessionToken, demoMode });

    // Get settings to find location
    const settings = settingsService.getSettings(sessionToken, demoMode);

    if (!settings.location) {
      return res.status(404).json({
        error: 'No location configured. Set a location in settings first.',
      });
    }

    const weather = await weatherService.getWeather(settings.location, settings.units, demoMode);

    res.json(weather);
  } catch (error) {
    logger.error('Failed to get weather', { error: error.message });
    // Return 503 for service unavailable
    if (error.message.includes('unavailable') || error.message.includes('API')) {
      return res.status(503).json({ error: 'Weather service unavailable' });
    }
    next(error);
  }
});

export default router;
