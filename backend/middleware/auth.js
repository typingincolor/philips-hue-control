import sessionManager from '../services/sessionManager.js';
import { MissingCredentialsError, InvalidSessionError } from '../utils/errors.js';
import { DEMO_BRIDGE_IP, DEMO_USERNAME } from '../services/mockData.js';

/**
 * Extract bridge credentials from request
 * Supports multiple auth methods in priority order:
 * 0. Demo mode (req.demoMode = true) - uses mock credentials
 * 1. Session token (Authorization: Bearer <token>)
 * 2. Headers (X-Bridge-IP + X-Hue-Username)
 * 3. Query params (bridgeIp + username) - legacy support
 */
export function extractCredentials(req, res, next) {
  try {
    let bridgeIp, username, authMethod;

    // Method 0: Demo mode - bypass all auth
    if (req.demoMode) {
      req.hue = {
        bridgeIp: DEMO_BRIDGE_IP,
        username: DEMO_USERNAME,
        authMethod: 'demo',
      };
      return next();
    }

    // Method 1: Session token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const sessionToken = authHeader.substring(7); // Remove 'Bearer '
      const session = sessionManager.getSession(sessionToken);

      if (!session) {
        throw new InvalidSessionError();
      }

      bridgeIp = session.bridgeIp;
      username = session.username;
      authMethod = 'session';
    }
    // Method 2: Headers
    else if (req.headers['x-bridge-ip'] && req.headers['x-hue-username']) {
      bridgeIp = req.headers['x-bridge-ip'];
      username = req.headers['x-hue-username'];
      authMethod = 'headers';
    }
    // Method 3: Query params (legacy)
    else if (req.query.bridgeIp && req.query.username) {
      bridgeIp = req.query.bridgeIp;
      username = req.query.username;
      authMethod = 'query';
    }

    // Validate we got credentials
    if (!bridgeIp) {
      throw new MissingCredentialsError(
        'bridgeIp (via session token, X-Bridge-IP header, or query param)'
      );
    }

    if (!username) {
      throw new MissingCredentialsError(
        'username (via session token, X-Hue-Username header, or query param)'
      );
    }

    // Store credentials for reuse by other clients
    // This ensures credentials are available even if first client
    // reconnects with an existing session token
    if (!sessionManager.hasBridgeCredentials(bridgeIp)) {
      sessionManager.storeBridgeCredentials(bridgeIp, username);
    }

    // Attach credentials to request for route handlers
    req.hue = {
      bridgeIp,
      username,
      authMethod,
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Require session-based authentication (stricter)
 * Use this for endpoints that should only work with sessions
 * Demo mode bypasses session validation
 */
export function requireSession(req, res, next) {
  try {
    // Demo mode - bypass session validation
    if (req.demoMode) {
      req.hue = {
        bridgeIp: DEMO_BRIDGE_IP,
        username: DEMO_USERNAME,
        authMethod: 'demo',
        sessionToken: 'demo-session',
      };
      return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new MissingCredentialsError('session token in Authorization header');
    }

    const sessionToken = authHeader.substring(7);
    const session = sessionManager.getSession(sessionToken);

    if (!session) {
      throw new InvalidSessionError();
    }

    // Store credentials for reuse by other clients
    if (!sessionManager.hasBridgeCredentials(session.bridgeIp)) {
      sessionManager.storeBridgeCredentials(session.bridgeIp, session.username);
    }

    req.hue = {
      bridgeIp: session.bridgeIp,
      username: session.username,
      authMethod: 'session',
      sessionToken,
    };

    next();
  } catch (error) {
    next(error);
  }
}
