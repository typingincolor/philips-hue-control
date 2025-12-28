/**
 * V2 Home Routes - Unified API for Home data
 */

import express from 'express';
import homeService from '../../services/homeService.js';
import { detectDemoMode } from '../../middleware/demoMode.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('V2_HOME');
const router = express.Router();

// Apply demo mode detection to all routes
router.use(detectDemoMode);

/**
 * GET /api/v2/home
 * Get the full home structure
 */
router.get('/', async (req, res, next) => {
  try {
    const demoMode = req.demoMode || false;
    const home = await homeService.getHome(demoMode);
    res.json(home);
  } catch (error) {
    logger.error('Failed to get home', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v2/home/rooms/:id
 * Get a single room by ID
 */
router.get('/rooms/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const demoMode = req.demoMode || false;
    const room = await homeService.getRoom(id, demoMode);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    logger.error('Failed to get room', { id: req.params.id, error: error.message });
    next(error);
  }
});

/**
 * GET /api/v2/home/devices
 * Get all home-level devices
 */
router.get('/devices', async (req, res, next) => {
  try {
    const demoMode = req.demoMode || false;
    const home = await homeService.getHome(demoMode);
    res.json(home.devices);
  } catch (error) {
    logger.error('Failed to get devices', { error: error.message });
    next(error);
  }
});

/**
 * PUT /api/v2/home/devices/:id
 * Update a device state
 */
router.put('/devices/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const demoMode = req.demoMode || false;
    const result = await homeService.updateDevice(id, req.body, demoMode);
    res.json(result);
  } catch (error) {
    logger.error('Failed to update device', { id: req.params.id, error: error.message });
    next(error);
  }
});

/**
 * POST /api/v2/home/scenes/:id/activate
 * Activate a scene
 */
router.post('/scenes/:id/activate', async (req, res, next) => {
  try {
    const { id } = req.params;
    const demoMode = req.demoMode || false;
    const result = await homeService.activateScene(id, demoMode);
    res.json(result);
  } catch (error) {
    logger.error('Failed to activate scene', { id: req.params.id, error: error.message });
    next(error);
  }
});

/**
 * PUT /api/v2/home/rooms/:id/devices
 * Update all devices in a room
 */
router.put('/rooms/:id/devices', async (req, res, next) => {
  try {
    const { id } = req.params;
    const demoMode = req.demoMode || false;
    const result = await homeService.updateRoomDevices(id, req.body, demoMode);
    res.json(result);
  } catch (error) {
    logger.error('Failed to update room devices', { id: req.params.id, error: error.message });
    next(error);
  }
});

/**
 * PUT /api/v2/home/zones/:id/devices
 * Update all devices in a zone
 */
router.put('/zones/:id/devices', async (req, res, next) => {
  try {
    const { id } = req.params;
    const demoMode = req.demoMode || false;
    const result = await homeService.updateZoneDevices(id, req.body, demoMode);
    res.json(result);
  } catch (error) {
    logger.error('Failed to update zone devices', { id: req.params.id, error: error.message });
    next(error);
  }
});

export default router;
