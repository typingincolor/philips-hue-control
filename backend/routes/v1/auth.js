import express from 'express';
import axios from 'axios';
import https from 'https';
import sessionManager from '../../services/sessionManager.js';
import hueClient from '../../services/hueClient.js';
import { requireSession } from '../../middleware/auth.js';
import { MissingCredentialsError, BridgeConnectionError } from '../../utils/errors.js';
import { createLogger } from '../../utils/logger.js';
import { REQUEST_TIMEOUT_MS } from '../../constants/timings.js';

const logger = createLogger('AUTH');
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
    logger.info('Pair request received', { bridgeIp, appName });

    if (!bridgeIp) {
      throw new MissingCredentialsError('bridgeIp');
    }

    logger.info('Pairing with bridge', { bridgeIp });

    // Make pairing request to Hue Bridge
    logger.debug('Sending request to bridge...');
    const response = await axios.post(
      `https://${bridgeIp}/api`,
      { devicetype: appName },
      { httpsAgent, timeout: REQUEST_TIMEOUT_MS, validateStatus: () => true }
    );
    logger.debug('Bridge response received', { data: response.data });

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
        logger.info('Successfully paired with bridge', { bridgeIp });

        // Store credentials for reuse by other clients
        sessionManager.storeBridgeCredentials(bridgeIp, username);

        return res.json({ username });
      }
    }

    throw new Error('Unexpected response from bridge');
  } catch (error) {
    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return res.status(504).json({
        error: 'Bridge connection timed out. Check network and try again.',
        type: 'timeout'
      });
    }
    // Handle connection refused
    if (error.code === 'ECONNREFUSED') {
      return res.status(502).json({
        error: 'Cannot connect to bridge. Check IP address.',
        type: 'connection_refused'
      });
    }
    next(error);
  }
});

/**
 * POST /api/v1/auth/connect
 * Connect to a bridge using stored credentials (no pairing needed)
 * Use this when another client has already paired with the bridge
 *
 * Body:
 *   {
 *     "bridgeIp": "192.168.1.100"
 *   }
 *
 * Returns:
 *   {
 *     "sessionToken": "hue_sess_abc123...",
 *     "expiresIn": 86400,
 *     "bridgeIp": "192.168.1.100"
 *   }
 *
 * Error (404):
 *   {
 *     "error": "No stored credentials for this bridge",
 *     "requiresPairing": true
 *   }
 */
router.post('/connect', async (req, res, next) => {
  try {
    const { bridgeIp } = req.body;

    if (!bridgeIp) {
      throw new MissingCredentialsError('bridgeIp');
    }

    logger.info('Connect request', { bridgeIp });

    // Check if we have stored credentials for this bridge
    const username = sessionManager.getBridgeCredentials(bridgeIp);

    if (!username) {
      logger.info('No stored credentials, pairing required', { bridgeIp });
      return res.status(404).json({
        error: 'No stored credentials for this bridge. Pairing required.',
        requiresPairing: true
      });
    }

    // Validate credentials still work
    try {
      await hueClient.getLights(bridgeIp, username);
    } catch (error) {
      logger.warn('Stored credentials invalid, pairing required', { bridgeIp });
      return res.status(401).json({
        error: 'Stored credentials are no longer valid. Pairing required.',
        requiresPairing: true
      });
    }

    // Create session with stored credentials
    const sessionInfo = sessionManager.createSession(bridgeIp, username);
    logger.info('Connected using stored credentials', { bridgeIp });

    res.json(sessionInfo);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/auth/bridge-status
 * Check if a bridge has stored credentials
 *
 * Query:
 *   bridgeIp - The bridge IP to check
 *
 * Returns:
 *   {
 *     "bridgeIp": "192.168.1.100",
 *     "hasCredentials": true
 *   }
 */
router.get('/bridge-status', (req, res) => {
  const { bridgeIp } = req.query;

  if (!bridgeIp) {
    return res.status(400).json({ error: 'bridgeIp query parameter required' });
  }

  const hasCredentials = sessionManager.hasBridgeCredentials(bridgeIp);

  res.json({
    bridgeIp,
    hasCredentials
  });
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

    logger.info('Creating session', { bridgeIp });

    // Validate credentials by making a test request to the bridge
    try {
      await hueClient.getLights(bridgeIp, username);
    } catch (error) {
      throw new BridgeConnectionError(bridgeIp, error);
    }

    // Store credentials for reuse by other clients
    sessionManager.storeBridgeCredentials(bridgeIp, username);

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

  logger.info('Refreshing session', { bridgeIp });

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
