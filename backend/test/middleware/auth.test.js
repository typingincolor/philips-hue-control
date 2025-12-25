import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractCredentials, requireSession } from '../../middleware/auth.js';
import { DEMO_BRIDGE_IP, DEMO_USERNAME } from '../../services/mockData.js';

// Mock sessionManager
vi.mock('../../services/sessionManager.js', () => ({
  default: {
    getSession: vi.fn(),
    hasBridgeCredentials: vi.fn(),
    storeBridgeCredentials: vi.fn(),
  },
}));

import sessionManager from '../../services/sessionManager.js';

describe('Auth Middleware', () => {
  let req, res, next;
  const bridgeIp = '192.168.1.100';
  const username = 'test-user-abc123';
  const sessionToken = 'hue_sess_test123';

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      headers: {},
      query: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('extractCredentials', () => {
    describe('session token auth', () => {
      it('should extract credentials from session token', () => {
        req.headers.authorization = `Bearer ${sessionToken}`;
        sessionManager.getSession.mockReturnValue({ bridgeIp, username });
        sessionManager.hasBridgeCredentials.mockReturnValue(true);

        extractCredentials(req, res, next);

        expect(sessionManager.getSession).toHaveBeenCalledWith(sessionToken);
        expect(req.hue).toEqual({
          bridgeIp,
          username,
          authMethod: 'session',
        });
        expect(next).toHaveBeenCalledWith();
      });

      it('should store credentials if not already stored', () => {
        req.headers.authorization = `Bearer ${sessionToken}`;
        sessionManager.getSession.mockReturnValue({ bridgeIp, username });
        sessionManager.hasBridgeCredentials.mockReturnValue(false);

        extractCredentials(req, res, next);

        expect(sessionManager.hasBridgeCredentials).toHaveBeenCalledWith(bridgeIp);
        expect(sessionManager.storeBridgeCredentials).toHaveBeenCalledWith(bridgeIp, username);
      });

      it('should not store credentials if already stored', () => {
        req.headers.authorization = `Bearer ${sessionToken}`;
        sessionManager.getSession.mockReturnValue({ bridgeIp, username });
        sessionManager.hasBridgeCredentials.mockReturnValue(true);

        extractCredentials(req, res, next);

        expect(sessionManager.storeBridgeCredentials).not.toHaveBeenCalled();
      });

      it('should call next with error for invalid session', () => {
        req.headers.authorization = `Bearer invalid-token`;
        sessionManager.getSession.mockReturnValue(null);

        extractCredentials(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
      });
    });

    describe('missing credentials', () => {
      it('should call next with error when no credentials provided', () => {
        extractCredentials(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
      });
    });
  });

  describe('requireSession', () => {
    it('should extract credentials from valid session', () => {
      req.headers.authorization = `Bearer ${sessionToken}`;
      sessionManager.getSession.mockReturnValue({ bridgeIp, username });
      sessionManager.hasBridgeCredentials.mockReturnValue(true);

      requireSession(req, res, next);

      expect(req.hue).toEqual({
        bridgeIp,
        username,
        authMethod: 'session',
        sessionToken,
      });
      expect(next).toHaveBeenCalledWith();
    });

    it('should store credentials if not already stored', () => {
      req.headers.authorization = `Bearer ${sessionToken}`;
      sessionManager.getSession.mockReturnValue({ bridgeIp, username });
      sessionManager.hasBridgeCredentials.mockReturnValue(false);

      requireSession(req, res, next);

      expect(sessionManager.storeBridgeCredentials).toHaveBeenCalledWith(bridgeIp, username);
    });

    it('should not store credentials if already stored', () => {
      req.headers.authorization = `Bearer ${sessionToken}`;
      sessionManager.getSession.mockReturnValue({ bridgeIp, username });
      sessionManager.hasBridgeCredentials.mockReturnValue(true);

      requireSession(req, res, next);

      expect(sessionManager.storeBridgeCredentials).not.toHaveBeenCalled();
    });

    it('should call next with error for missing auth header', () => {
      requireSession(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should call next with error for invalid session', () => {
      req.headers.authorization = `Bearer invalid-token`;
      sessionManager.getSession.mockReturnValue(null);

      requireSession(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('demo mode handling', () => {
    describe('extractCredentials', () => {
      it('should set demo credentials when demoMode is true', () => {
        req.demoMode = true;

        extractCredentials(req, res, next);

        expect(req.hue).toEqual({
          bridgeIp: DEMO_BRIDGE_IP,
          username: DEMO_USERNAME,
          authMethod: 'demo',
        });
        expect(next).toHaveBeenCalledWith();
      });

      it('should skip session lookup when demoMode is true', () => {
        req.demoMode = true;
        req.headers.authorization = `Bearer ${sessionToken}`;

        extractCredentials(req, res, next);

        expect(sessionManager.getSession).not.toHaveBeenCalled();
        expect(req.hue.authMethod).toBe('demo');
      });

      it('should not store demo credentials in session manager', () => {
        req.demoMode = true;

        extractCredentials(req, res, next);

        expect(sessionManager.storeBridgeCredentials).not.toHaveBeenCalled();
      });

      it('should use real auth when demoMode is false', () => {
        req.demoMode = false;
        req.headers.authorization = `Bearer ${sessionToken}`;
        sessionManager.getSession.mockReturnValue({ bridgeIp, username });
        sessionManager.hasBridgeCredentials.mockReturnValue(true);

        extractCredentials(req, res, next);

        expect(req.hue.authMethod).toBe('session');
      });
    });

    describe('requireSession', () => {
      it('should set demo credentials when demoMode is true', () => {
        req.demoMode = true;

        requireSession(req, res, next);

        expect(req.hue).toEqual({
          bridgeIp: DEMO_BRIDGE_IP,
          username: DEMO_USERNAME,
          authMethod: 'demo',
          sessionToken: 'demo-session',
        });
        expect(next).toHaveBeenCalledWith();
      });

      it('should skip session validation when demoMode is true', () => {
        req.demoMode = true;

        requireSession(req, res, next);

        expect(sessionManager.getSession).not.toHaveBeenCalled();
      });

      it('should use real session when demoMode is false', () => {
        req.demoMode = false;
        req.headers.authorization = `Bearer ${sessionToken}`;
        sessionManager.getSession.mockReturnValue({ bridgeIp, username });
        sessionManager.hasBridgeCredentials.mockReturnValue(true);

        requireSession(req, res, next);

        expect(sessionManager.getSession).toHaveBeenCalledWith(sessionToken);
        expect(req.hue.authMethod).toBe('session');
      });
    });
  });
});
