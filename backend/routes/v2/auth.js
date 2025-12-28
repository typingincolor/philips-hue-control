/**
 * V2 Auth Routes
 * Generic authentication endpoints for the V2 API
 *
 * NOTE: Service-specific auth routes (like Hue pairing) are in their plugin routers.
 * Use /api/v2/services/hue/pair and /api/v2/services/hue/connect for Hue.
 */

import express from 'express';
import sessionManager from '../../services/sessionManager.js';
import { getHueClient } from '../../services/hueClientFactory.js';
import { requireSession } from '../../middleware/auth.js';
import { BridgeConnectionError } from '../../utils/errors.js';
import { DEMO_BRIDGE_IP } from '../../services/mockData.js';

const router = express.Router();

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
