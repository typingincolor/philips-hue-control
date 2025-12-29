/**
 * V2 Settings Routes
 * Settings endpoints for the V2 API
 */

import express from 'express';
import settingsService from '../../services/settingsService.js';
import { requireSession, optionalSession } from '../../middleware/auth.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('V2_SETTINGS');
const router = express.Router();

/**
 * GET /api/v2/settings
 * Get current settings (works with or without session for initial setup)
 */
router.get('/', optionalSession, async (req, res, next) => {
  try {
    const sessionToken = req.hue?.sessionToken || null;
    const demoMode = req.demoMode || false;

    logger.debug('Getting settings', { sessionToken, demoMode });

    const settings = settingsService.getSettings(sessionToken, demoMode);

    res.json(settings);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v2/settings
 * Update settings (works with or without session for initial setup)
 */
router.put('/', optionalSession, async (req, res, next) => {
  try {
    const sessionToken = req.hue?.sessionToken || null;
    const { location, units, services } = req.body;

    logger.debug('Updating settings', { sessionToken, hasLocation: !!location, units });

    const updates = {};
    if (location !== undefined) updates.location = location;
    if (units !== undefined) updates.units = units;
    if (services !== undefined) updates.services = services;

    const settings = settingsService.updateSettings(sessionToken, updates);

    res.json(settings);
  } catch (error) {
    if (error.message.includes('Invalid')) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

/**
 * PUT /api/v2/settings/location
 * Update location (works with or without session for initial setup)
 */
router.put('/location', optionalSession, async (req, res, next) => {
  try {
    const sessionToken = req.hue?.sessionToken || null;
    const { lat, lon, name } = req.body;

    // Validate required fields
    if (lat === undefined || lon === undefined) {
      return res.status(400).json({ error: 'lat and lon are required' });
    }

    logger.debug('Updating location', { sessionToken, lat, lon, name });

    const location = { lat, lon };
    if (name) location.name = name;

    const result = settingsService.updateLocation(sessionToken, location);

    res.json(result);
  } catch (error) {
    if (error.message.includes('must have') || error.message.includes('must be')) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

/**
 * DELETE /api/v2/settings/location
 * Clear location
 */
router.delete('/location', requireSession, async (req, res, next) => {
  try {
    const { sessionToken } = req.hue;

    logger.debug('Clearing location', { sessionToken });

    settingsService.clearLocation(sessionToken);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
