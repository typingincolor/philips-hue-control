import express from 'express';
import sessionManager from '../../services/sessionManager.js';
import hueClient from '../../services/hueClient.js';
import { requireSession } from '../../middleware/auth.js';
import { MissingCredentialsError, BridgeConnectionError } from '../../utils/errors.js';

const router = express.Router();

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
