import express from 'express';
import axios from 'axios';
import https from 'https';
import sessionManager from '../../services/sessionManager.js';
import hueClient from '../../services/hueClient.js';
import { requireSession } from '../../middleware/auth.js';
import { MissingCredentialsError, BridgeConnectionError } from '../../utils/errors.js';

const router = express.Router();

// HTTPS agent for self-signed certificates
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

/**
 * POST /api/v1/auth/pair
 * Pair with a Hue Bridge (initial link button authentication)
 *
 * Body:
 *   {
 *     "bridgeIp": "192.168.1.100",
 *     "appName": "hue_control_app" (optional)
 *   }
 *
 * Returns:
 *   {
 *     "username": "generated-hue-api-key"
 *   }
 *
 * Note: User must press the link button on the bridge before calling this
 */
router.post('/pair', async (req, res, next) => {
  try {
    const { bridgeIp, appName = 'hue_control_app' } = req.body;

    if (!bridgeIp) {
      throw new MissingCredentialsError('bridgeIp');
    }

    console.log(`[AUTH] Pairing with bridge ${bridgeIp}`);

    // Make pairing request to Hue Bridge
    const response = await axios.post(
      `https://${bridgeIp}/api`,
      { devicetype: appName },
      { httpsAgent, validateStatus: () => true }
    );

    // Check for errors
    if (response.data && response.data[0]) {
      if (response.data[0].error) {
        const error = response.data[0].error;
        return res.status(400).json({
          error: error.description,
          type: error.type
        });
      }

      if (response.data[0].success) {
        const username = response.data[0].success.username;
        console.log(`[AUTH] Successfully paired with bridge ${bridgeIp}`);
        return res.json({ username });
      }
    }

    throw new Error('Unexpected response from bridge');
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/auth/session
 * Create a new session by connecting to a bridge
 *
 * Body:
 *   {
 *     "bridgeIp": "192.168.1.100",
 *     "username": "your-hue-api-key"
 *   }
 *
 * Returns:
 *   {
 *     "sessionToken": "hue_sess_abc123...",
 *     "expiresIn": 86400,
 *     "bridgeIp": "192.168.1.100"
 *   }
 */
router.post('/session', async (req, res, next) => {
  try {
    const { bridgeIp, username } = req.body;

    // Validate request
    if (!bridgeIp) {
      throw new MissingCredentialsError('bridgeIp');
    }

    if (!username) {
      throw new MissingCredentialsError('username');
    }

    console.log(`[AUTH] Creating session for bridge ${bridgeIp}`);

    // Validate credentials by making a test request to the bridge
    try {
      await hueClient.getLights(bridgeIp, username);
    } catch (error) {
      throw new BridgeConnectionError(bridgeIp, error);
    }

    // Create session
    const sessionInfo = sessionManager.createSession(bridgeIp, username);

    res.json(sessionInfo);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/auth/session
 * Revoke the current session (logout)
 *
 * Headers:
 *   Authorization: Bearer <sessionToken>
 *
 * Returns:
 *   {
 *     "success": true,
 *     "message": "Session revoked"
 *   }
 */
router.delete('/session', requireSession, (req, res) => {
  const { sessionToken } = req.hue;

  const revoked = sessionManager.revokeSession(sessionToken);

  res.json({
    success: true,
    message: revoked ? 'Session revoked' : 'Session was already revoked'
  });
});

/**
 * GET /api/v1/auth/session
 * Get current session info
 *
 * Headers:
 *   Authorization: Bearer <sessionToken>
 *
 * Returns:
 *   {
 *     "bridgeIp": "192.168.1.100",
 *     "active": true
 *   }
 */
router.get('/session', requireSession, (req, res) => {
  const { bridgeIp } = req.hue;

  res.json({
    bridgeIp,
    active: true
  });
});

/**
 * POST /api/v1/auth/refresh
 * Refresh an existing session token (extends expiration)
 *
 * Headers:
 *   Authorization: Bearer <sessionToken>
 *
 * Returns:
 *   {
 *     "sessionToken": "hue_sess_new123...",
 *     "expiresIn": 86400,
 *     "bridgeIp": "192.168.1.100"
 *   }
 */
router.post('/refresh', requireSession, (req, res) => {
  const { bridgeIp, username, sessionToken: oldToken } = req.hue;

  console.log(`[AUTH] Refreshing session for bridge ${bridgeIp}`);

  // Revoke old token
  sessionManager.revokeSession(oldToken);

  // Create new session with same credentials
  const sessionInfo = sessionManager.createSession(bridgeIp, username);

  res.json(sessionInfo);
});

/**
 * GET /api/v1/auth/stats
 * Get session statistics (for monitoring/debugging)
 *
 * Returns:
 *   {
 *     "activeSessions": 5,
 *     "oldestSession": 3600000,
 *     "newestSession": 300000
 *   }
 */
router.get('/stats', (req, res) => {
  const stats = sessionManager.getStats();
  res.json(stats);
});

export default router;
