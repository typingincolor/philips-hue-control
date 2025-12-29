import sessionManager from '../services/sessionManager.js';
import { MissingCredentialsError, InvalidSessionError } from '../utils/errors.js';
import { DEMO_BRIDGE_IP, DEMO_USERNAME } from '../services/mockData.js';

/**
 * Extract bridge credentials from request
 * Supports:
 * - Demo mode (req.demoMode = true) - uses mock credentials
 * - Session token (Authorization: Bearer <token>)
 */
export function extractCredentials(req, res, next) {
  try {
    // Demo mode - bypass all auth
    if (req.demoMode) {
      req.hue = {
        bridgeIp: DEMO_BRIDGE_IP,
        username: DEMO_USERNAME,
        authMethod: 'demo',
      };
      return next();
    }

    // Session token authentication
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
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional session - extracts session if present but doesn't require it
 * Use this for endpoints that work with or without authentication
 */
export function optionalSession(req, res, next) {
  try {
    // Demo mode - use demo credentials
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

    // No auth header - continue without session
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.hue = null;
      return next();
    }

    const sessionToken = authHeader.substring(7);
    const session = sessionManager.getSession(sessionToken);

    // Invalid session - continue without it
    if (!session) {
      req.hue = null;
      return next();
    }

    req.hue = {
      bridgeIp: session.bridgeIp,
      username: session.username,
      authMethod: 'session',
      sessionToken,
    };

    next();
  } catch {
    // On any error, continue without session
    req.hue = null;
    next();
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
