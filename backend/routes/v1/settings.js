import express from 'express';
import settingsService from '../../services/settingsService.js';
import { requireSession } from '../../middleware/auth.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('SETTINGS_ROUTE');
const router = express.Router();

/**
 * GET /api/v1/settings
 * Get current user settings (location, units)
 *
 * Auth: Session token required
 */
router.get('/', requireSession, async (req, res, next) => {
  try {
    const { sessionToken } = req.hue;
    const demoMode = req.demoMode || false;

    logger.debug('Getting settings', { sessionToken, demoMode });

    const settings = settingsService.getSettings(sessionToken, demoMode);

    res.json(settings);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/settings
 * Update all settings
 *
 * Auth: Session token required
 * Body: { location?: { lat, lon, name? }, units?: 'celsius' | 'fahrenheit' }
 */
router.put('/', requireSession, async (req, res, next) => {
  try {
    const { sessionToken } = req.hue;
    const demoMode = req.demoMode || false;
    const { location, units } = req.body;

    logger.debug('Updating settings', { sessionToken, demoMode, hasLocation: !!location, units });

    const updates = {};
    if (location !== undefined) updates.location = location;
    if (units !== undefined) updates.units = units;

    const settings = settingsService.updateSettings(sessionToken, updates, demoMode);

    res.json(settings);
  } catch (error) {
    if (error.message.includes('Invalid')) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

/**
 * PUT /api/v1/settings/location
 * Update location only
 *
 * Auth: Session token required
 * Body: { lat: number, lon: number, name?: string }
 */
router.put('/location', requireSession, async (req, res, next) => {
  try {
    const { sessionToken } = req.hue;
    const demoMode = req.demoMode || false;
    const { lat, lon, name } = req.body;

    logger.debug('Updating location', { sessionToken, demoMode, lat, lon, name });

    const location = { lat, lon };
    if (name) location.name = name;

    const settings = settingsService.updateLocation(sessionToken, location, demoMode);

    res.json(settings);
  } catch (error) {
    if (error.message.includes('must have') || error.message.includes('must be')) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

/**
 * DELETE /api/v1/settings/location
 * Clear location
 *
 * Auth: Session token required
 */
router.delete('/location', requireSession, async (req, res, next) => {
  try {
    const { sessionToken } = req.hue;
    const demoMode = req.demoMode || false;

    logger.debug('Clearing location', { sessionToken, demoMode });

    const settings = settingsService.clearLocation(sessionToken, demoMode);

    res.json(settings);
  } catch (error) {
    next(error);
  }
});

export default router;
