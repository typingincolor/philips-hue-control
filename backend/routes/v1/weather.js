import express from 'express';
import weatherService from '../../services/weatherService.js';
import settingsService from '../../services/settingsService.js';
import { requireSession } from '../../middleware/auth.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('WEATHER_ROUTE');
const router = express.Router();

/**
 * GET /api/v1/weather
 * Get weather for current session's location
 *
 * Auth: Session token required
 * Returns 404 if no location is set
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
        error: 'No location set. Use PUT /api/v1/settings/location to set a location.',
      });
    }

    const weather = await weatherService.getWeather(settings.location, settings.units, demoMode);

    res.json(weather);
  } catch (error) {
    logger.error('Failed to get weather', { error: error.message });
    next(error);
  }
});

export default router;
