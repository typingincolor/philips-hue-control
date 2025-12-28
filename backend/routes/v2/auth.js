/**
 * V2 Auth Routes
 * Authentication endpoints for the V2 API
 */

import express from 'express';
import axios from 'axios';
import sessionManager from '../../services/sessionManager.js';
import { getHueClient } from '../../services/hueClientFactory.js';
import { requireSession } from '../../middleware/auth.js';
import { BridgeConnectionError } from '../../utils/errors.js';
import { createLogger } from '../../utils/logger.js';
import { REQUEST_TIMEOUT_MS } from '../../constants/timings.js';
import { DEMO_BRIDGE_IP } from '../../services/mockData.js';
import { hueHttpsAgent } from '../../utils/httpsAgent.js';

const logger = createLogger('V2_AUTH');
const router = express.Router();

const httpsAgent = hueHttpsAgent;

/**
 * POST /api/v2/auth/pair
 * Pair with a Hue Bridge (initial link button authentication)
 */
router.post('/pair', async (req, res, next) => {
  try {
    const { bridgeIp, appName = 'hue_control_app' } = req.body;
    logger.info('Pair request received', { bridgeIp, appName });

    if (!bridgeIp) {
      return res.status(400).json({ error: 'bridgeIp is required' });
    }

    logger.info('Pairing with bridge', { bridgeIp });

    // Make pairing request to Hue Bridge
    const response = await axios.post(
      `https://${bridgeIp}/api`,
      { devicetype: appName },
      { httpsAgent, timeout: REQUEST_TIMEOUT_MS, validateStatus: () => true }
    );

    // Check for errors
    if (response.data && response.data[0]) {
      if (response.data[0].error) {
        const error = response.data[0].error;
        // Type 101 = link button not pressed
        if (error.type === 101) {
          return res.status(424).json({
            error: error.description,
            requiresLinkButton: true,
          });
        }
        return res.status(400).json({
          error: error.description,
          type: error.type,
        });
      }

      if (response.data[0].success) {
        const username = response.data[0].success.username;
        logger.info('Successfully paired with bridge', { bridgeIp });

        // Store credentials for reuse
        sessionManager.storeBridgeCredentials(bridgeIp, username);

        return res.json({ username });
      }
    }

    throw new Error('Unexpected response from bridge');
  } catch (error) {
    if (error.message?.includes('link button')) {
      return res.status(424).json({
        error: error.message,
        requiresLinkButton: true,
      });
    }
    next(error);
  }
});

/**
 * POST /api/v2/auth/connect
 * Connect to a bridge using stored credentials
 */
router.post('/connect', async (req, res, next) => {
  try {
    // Demo mode
    if (req.demoMode) {
      return res.json({
        sessionToken: 'demo-session',
        expiresIn: 86400,
        bridgeIp: DEMO_BRIDGE_IP,
      });
    }

    const { bridgeIp } = req.body;

    if (!bridgeIp) {
      return res.status(400).json({ error: 'bridgeIp is required' });
    }

    logger.info('Connect request', { bridgeIp });

    // Check if we have stored credentials
    const username = sessionManager.getBridgeCredentials(bridgeIp);

    if (!username) {
      return res.status(401).json({
        error: 'No stored credentials for this bridge. Pairing required.',
        requiresPairing: true,
      });
    }

    // Validate credentials still work
    const hueClient = getHueClient(req);
    try {
      await hueClient.getLights(bridgeIp, username);
    } catch {
      return res.status(401).json({
        error: 'Stored credentials are no longer valid. Pairing required.',
        requiresPairing: true,
      });
    }

    // Create session
    const sessionInfo = sessionManager.createSession(bridgeIp, username);
    logger.info('Connected using stored credentials', { bridgeIp });

    res.json(sessionInfo);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v2/auth/bridge-status
 * Check if a bridge has stored credentials
 */
router.get('/bridge-status', (req, res) => {
  const { bridgeIp } = req.query;

  if (!bridgeIp) {
    return res.status(400).json({ error: 'bridgeIp query parameter required' });
  }

  const hasCredentials = sessionManager.hasBridgeCredentials(bridgeIp);

  res.json({ hasCredentials });
});

/**
 * POST /api/v2/auth/session
 * Create a new session
 */
router.post('/session', async (req, res, next) => {
  try {
    if (req.demoMode) {
      return res.json({
        sessionToken: 'demo-session',
        expiresIn: 86400,
        bridgeIp: DEMO_BRIDGE_IP,
      });
    }

    const { bridgeIp, username } = req.body;

    if (!bridgeIp) {
      return res.status(400).json({ error: 'bridgeIp is required' });
    }

    if (!username) {
      return res.status(400).json({ error: 'username is required' });
    }

    // Validate credentials
    const hueClient = getHueClient(req);
    try {
      await hueClient.getLights(bridgeIp, username);
    } catch (error) {
      throw new BridgeConnectionError(bridgeIp, error);
    }

    // Store credentials
    sessionManager.storeBridgeCredentials(bridgeIp, username);

    // Create session
    const sessionInfo = sessionManager.createSession(bridgeIp, username);

    res.json(sessionInfo);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v2/auth/refresh
 * Refresh session token
 */
router.post('/refresh', requireSession, (req, res) => {
  const { bridgeIp, username, sessionToken: oldToken } = req.hue;

  // Revoke old token
  sessionManager.revokeSession(oldToken);

  // Create new session
  const sessionInfo = sessionManager.createSession(bridgeIp, username);

  res.json(sessionInfo);
});

/**
 * DELETE /api/v2/auth/session
 * Revoke session
 */
router.delete('/session', requireSession, (req, res) => {
  const { sessionToken } = req.hue;

  sessionManager.revokeSession(sessionToken);

  res.json({ success: true });
});

/**
 * POST /api/v2/auth/disconnect
 * Disconnect and clear credentials
 */
router.post('/disconnect', requireSession, (req, res) => {
  const { sessionToken, bridgeIp } = req.hue;

  sessionManager.revokeSession(sessionToken);
  sessionManager.clearBridgeCredentials(bridgeIp);

  res.json({ success: true });
});

export default router;
