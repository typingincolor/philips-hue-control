/**
 * V2 Automations Routes
 * Automation endpoints for the V2 API
 */

import express from 'express';
import automationService from '../../services/automationService.js';
import { extractCredentials } from '../../middleware/auth.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('V2_AUTOMATIONS');
const router = express.Router();

/**
 * GET /api/v2/automations
 * Get all automations
 */
router.get('/', extractCredentials, async (req, res, next) => {
  try {
    const { bridgeIp, username } = req.hue;

    logger.info('Getting automations', { authMethod: req.hue.authMethod });

    const result = await automationService.getAutomations(bridgeIp, username);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v2/automations/:id/trigger
 * Trigger an automation
 */
router.post('/:id/trigger', extractCredentials, async (req, res, next) => {
  try {
    const { id: automationId } = req.params;
    const { bridgeIp, username } = req.hue;

    logger.info('Triggering automation', { automationId, authMethod: req.hue.authMethod });

    const result = await automationService.triggerAutomation(bridgeIp, username, automationId);

    logger.info('Automation triggered successfully', { automationId });

    res.json(result);
  } catch (error) {
    // Check if automation not found
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
});

export default router;
