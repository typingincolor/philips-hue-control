import express from 'express';
import hiveService from '../../services/hiveService.js';
import { requireSession } from '../../middleware/auth.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('HIVE_ROUTE');
const router = express.Router();

/**
 * POST /api/v1/hive/connect
 * Connect to Hive API with credentials
 *
 * Auth: Session token required
 * Body: { username: string, password: string }
 */
router.post('/connect', requireSession, async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const demoMode = req.demoMode || false;

    logger.debug('Connecting to Hive', { username, demoMode });

    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required',
      });
    }

    const result = await hiveService.connect(username, password, demoMode);

    if (!result.success) {
      return res.status(401).json({
        error: result.error || 'Failed to connect to Hive',
      });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to connect to Hive', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/v1/hive/disconnect
 * Disconnect from Hive API
 *
 * Auth: Session token required
 */
router.post('/disconnect', requireSession, async (req, res, next) => {
  try {
    logger.debug('Disconnecting from Hive');

    await hiveService.disconnect();

    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to disconnect from Hive', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/hive/connection
 * Get Hive connection status
 *
 * Auth: Session token required
 */
router.get('/connection', requireSession, async (req, res) => {
  const demoMode = req.demoMode || false;
  const status = hiveService.getConnectionStatus(demoMode);
  res.json(status);
});

/**
 * GET /api/v1/hive/status
 * Get current thermostat and hot water status
 *
 * Auth: Session token required
 */
router.get('/status', requireSession, async (req, res, next) => {
  try {
    const demoMode = req.demoMode || false;

    logger.debug('Getting Hive status', { demoMode });

    const status = await hiveService.getStatus(demoMode);

    res.json(status);
  } catch (error) {
    logger.error('Failed to get Hive status', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/hive/schedules
 * Get heating and hot water schedules
 *
 * Auth: Session token required
 */
router.get('/schedules', requireSession, async (req, res, next) => {
  try {
    const demoMode = req.demoMode || false;

    logger.debug('Getting Hive schedules', { demoMode });

    const schedules = await hiveService.getSchedules(demoMode);

    res.json(schedules);
  } catch (error) {
    logger.error('Failed to get Hive schedules', { error: error.message });
    next(error);
  }
});

export default router;
