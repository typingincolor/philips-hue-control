import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock logger to suppress output
vi.mock('../../utils/logger.js', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  })
}));

describe('SessionManager', () => {
  let sessionManager;
  const bridgeIp = '192.168.1.100';
  const username = 'test-user-abc123';

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    // Import fresh instance for each test
    const module = await import('../../services/sessionManager.js');
    sessionManager = module.default;

    // Stop automatic cleanup to prevent test interference
    sessionManager.stopCleanup();

    // Clear any existing sessions
    sessionManager.sessions.clear();
  });

  afterEach(() => {
    sessionManager.stopCleanup();
    vi.restoreAllMocks();
  });

  describe('createSession', () => {
    it('should create a session with valid token', () => {
      const result = sessionManager.createSession(bridgeIp, username);

      expect(result.sessionToken).toBeDefined();
      expect(result.sessionToken).toMatch(/^hue_sess_[a-f0-9]{64}$/);
      expect(result.bridgeIp).toBe(bridgeIp);
      expect(result.expiresIn).toBeGreaterThan(0);
    });

    it('should store session in sessions map', () => {
      const result = sessionManager.createSession(bridgeIp, username);

      expect(sessionManager.sessions.has(result.sessionToken)).toBe(true);

      const stored = sessionManager.sessions.get(result.sessionToken);
      expect(stored.bridgeIp).toBe(bridgeIp);
      expect(stored.username).toBe(username);
      expect(stored.createdAt).toBeGreaterThan(0);
      expect(stored.lastUsed).toBeGreaterThan(0);
    });

    it('should create unique tokens for each session', () => {
      const result1 = sessionManager.createSession(bridgeIp, username);
      const result2 = sessionManager.createSession(bridgeIp, username);

      expect(result1.sessionToken).not.toBe(result2.sessionToken);
    });

    it('should return expiresIn in seconds', () => {
      const result = sessionManager.createSession(bridgeIp, username);

      // SESSION_EXPIRY_MS is 86400000 (24 hours in ms)
      // expiresIn should be in seconds
      expect(result.expiresIn).toBe(sessionManager.SESSION_EXPIRY / 1000);
    });
  });

  describe('getSession', () => {
    it('should return session data for valid token', () => {
      const created = sessionManager.createSession(bridgeIp, username);
      const result = sessionManager.getSession(created.sessionToken);

      expect(result).not.toBeNull();
      expect(result.bridgeIp).toBe(bridgeIp);
      expect(result.username).toBe(username);
    });

    it('should return null for non-existent token', () => {
      const result = sessionManager.getSession('hue_sess_nonexistent');

      expect(result).toBeNull();
    });

    it('should return null for expired token', () => {
      const created = sessionManager.createSession(bridgeIp, username);

      // Manually expire the session
      const session = sessionManager.sessions.get(created.sessionToken);
      session.createdAt = Date.now() - sessionManager.SESSION_EXPIRY - 1000;

      const result = sessionManager.getSession(created.sessionToken);

      expect(result).toBeNull();
    });

    it('should delete expired session from storage', () => {
      const created = sessionManager.createSession(bridgeIp, username);

      // Manually expire the session
      const session = sessionManager.sessions.get(created.sessionToken);
      session.createdAt = Date.now() - sessionManager.SESSION_EXPIRY - 1000;

      sessionManager.getSession(created.sessionToken);

      expect(sessionManager.sessions.has(created.sessionToken)).toBe(false);
    });

    it('should update lastUsed timestamp on access', () => {
      const created = sessionManager.createSession(bridgeIp, username);
      const session = sessionManager.sessions.get(created.sessionToken);
      const originalLastUsed = session.lastUsed;

      // Wait a tiny bit to ensure time difference
      const now = Date.now() + 100;
      vi.spyOn(Date, 'now').mockReturnValue(now);

      sessionManager.getSession(created.sessionToken);

      expect(session.lastUsed).toBe(now);
      expect(session.lastUsed).toBeGreaterThanOrEqual(originalLastUsed);
    });
  });

  describe('revokeSession', () => {
    it('should return true when revoking existing session', () => {
      const created = sessionManager.createSession(bridgeIp, username);
      const result = sessionManager.revokeSession(created.sessionToken);

      expect(result).toBe(true);
    });

    it('should return false when revoking non-existent session', () => {
      const result = sessionManager.revokeSession('hue_sess_nonexistent');

      expect(result).toBe(false);
    });

    it('should remove session from storage', () => {
      const created = sessionManager.createSession(bridgeIp, username);
      sessionManager.revokeSession(created.sessionToken);

      expect(sessionManager.sessions.has(created.sessionToken)).toBe(false);
    });

    it('should prevent subsequent getSession calls', () => {
      const created = sessionManager.createSession(bridgeIp, username);
      sessionManager.revokeSession(created.sessionToken);

      const result = sessionManager.getSession(created.sessionToken);
      expect(result).toBeNull();
    });
  });

  describe('getStats', () => {
    it('should return zero stats when no sessions', () => {
      const stats = sessionManager.getStats();

      expect(stats.activeSessions).toBe(0);
      expect(stats.oldestSession).toBe(0);
      expect(stats.newestSession).toBe(0);
    });

    it('should return correct active session count', () => {
      sessionManager.createSession(bridgeIp, username);
      sessionManager.createSession(bridgeIp, 'user2');
      sessionManager.createSession(bridgeIp, 'user3');

      const stats = sessionManager.getStats();

      expect(stats.activeSessions).toBe(3);
    });

    it('should return oldest session age', () => {
      // Create sessions at different times
      let mockTime = 1000000;
      vi.spyOn(Date, 'now').mockImplementation(() => mockTime);

      sessionManager.createSession(bridgeIp, 'user1'); // Created at 1000000
      mockTime = 1005000;
      sessionManager.createSession(bridgeIp, 'user2'); // Created at 1005000

      mockTime = 1010000; // Current time for stats calculation

      const stats = sessionManager.getStats();

      // Oldest session was created 10000ms ago
      expect(stats.oldestSession).toBe(10000);
    });

    it('should return newest session age', () => {
      let mockTime = 1000000;
      vi.spyOn(Date, 'now').mockImplementation(() => mockTime);

      sessionManager.createSession(bridgeIp, 'user1'); // Created at 1000000
      mockTime = 1005000;
      sessionManager.createSession(bridgeIp, 'user2'); // Created at 1005000

      mockTime = 1010000; // Current time

      const stats = sessionManager.getStats();

      // Newest session was created 5000ms ago
      expect(stats.newestSession).toBe(5000);
    });
  });

  describe('cleanup', () => {
    it('should remove expired sessions', () => {
      const created1 = sessionManager.createSession(bridgeIp, 'user1');
      const created2 = sessionManager.createSession(bridgeIp, 'user2');

      // Expire only the first session
      const session1 = sessionManager.sessions.get(created1.sessionToken);
      session1.createdAt = Date.now() - sessionManager.SESSION_EXPIRY - 1000;

      const cleaned = sessionManager.cleanup();

      expect(cleaned).toBe(1);
      expect(sessionManager.sessions.has(created1.sessionToken)).toBe(false);
      expect(sessionManager.sessions.has(created2.sessionToken)).toBe(true);
    });

    it('should return 0 when no sessions expired', () => {
      sessionManager.createSession(bridgeIp, 'user1');
      sessionManager.createSession(bridgeIp, 'user2');

      const cleaned = sessionManager.cleanup();

      expect(cleaned).toBe(0);
    });

    it('should remove all expired sessions', () => {
      const created1 = sessionManager.createSession(bridgeIp, 'user1');
      const created2 = sessionManager.createSession(bridgeIp, 'user2');
      const created3 = sessionManager.createSession(bridgeIp, 'user3');

      // Expire all sessions
      for (const token of [created1.sessionToken, created2.sessionToken, created3.sessionToken]) {
        const session = sessionManager.sessions.get(token);
        session.createdAt = Date.now() - sessionManager.SESSION_EXPIRY - 1000;
      }

      const cleaned = sessionManager.cleanup();

      expect(cleaned).toBe(3);
      expect(sessionManager.sessions.size).toBe(0);
    });
  });

  describe('startCleanup / stopCleanup', () => {
    it('should set cleanupInterval on start', () => {
      sessionManager.cleanupInterval = null;
      sessionManager.startCleanup();

      expect(sessionManager.cleanupInterval).not.toBeNull();
    });

    it('should clear cleanupInterval on stop', () => {
      sessionManager.startCleanup();
      sessionManager.stopCleanup();

      expect(sessionManager.cleanupInterval).toBeNull();
    });

    it('should not throw if stopCleanup called when not running', () => {
      sessionManager.cleanupInterval = null;

      expect(() => sessionManager.stopCleanup()).not.toThrow();
    });

    it('should run cleanup periodically', async () => {
      vi.useFakeTimers();

      const cleanupSpy = vi.spyOn(sessionManager, 'cleanup');
      sessionManager.startCleanup();

      // Advance time by cleanup interval
      vi.advanceTimersByTime(sessionManager.CLEANUP_INTERVAL);

      expect(cleanupSpy).toHaveBeenCalledTimes(1);

      // Advance again
      vi.advanceTimersByTime(sessionManager.CLEANUP_INTERVAL);

      expect(cleanupSpy).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });
  });

  describe('_generateToken', () => {
    it('should generate token with correct prefix', () => {
      const token = sessionManager._generateToken();

      expect(token.startsWith('hue_sess_')).toBe(true);
    });

    it('should generate token with 64 hex characters after prefix', () => {
      const token = sessionManager._generateToken();
      const hexPart = token.replace('hue_sess_', '');

      expect(hexPart).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate unique tokens', () => {
      const tokens = new Set();

      for (let i = 0; i < 100; i++) {
        tokens.add(sessionManager._generateToken());
      }

      expect(tokens.size).toBe(100);
    });
  });

  describe('_getOldestSessionAge', () => {
    it('should return 0 when no sessions', () => {
      const age = sessionManager._getOldestSessionAge();

      expect(age).toBe(0);
    });

    it('should return age of single session', () => {
      let mockTime = 1000000;
      vi.spyOn(Date, 'now').mockImplementation(() => mockTime);

      sessionManager.createSession(bridgeIp, username);

      mockTime = 1005000;

      const age = sessionManager._getOldestSessionAge();

      expect(age).toBe(5000);
    });
  });

  describe('_getNewestSessionAge', () => {
    it('should return 0 when no sessions', () => {
      const age = sessionManager._getNewestSessionAge();

      expect(age).toBe(0);
    });

    it('should return age of single session', () => {
      let mockTime = 1000000;
      vi.spyOn(Date, 'now').mockImplementation(() => mockTime);

      sessionManager.createSession(bridgeIp, username);

      mockTime = 1003000;

      const age = sessionManager._getNewestSessionAge();

      expect(age).toBe(3000);
    });
  });

  describe('edge cases', () => {
    it('should handle session with empty username', () => {
      const result = sessionManager.createSession(bridgeIp, '');

      expect(result.sessionToken).toBeDefined();

      const session = sessionManager.getSession(result.sessionToken);
      expect(session.username).toBe('');
    });

    it('should handle multiple sessions for same bridge', () => {
      const session1 = sessionManager.createSession(bridgeIp, 'user1');
      const session2 = sessionManager.createSession(bridgeIp, 'user2');

      const result1 = sessionManager.getSession(session1.sessionToken);
      const result2 = sessionManager.getSession(session2.sessionToken);

      expect(result1.username).toBe('user1');
      expect(result2.username).toBe('user2');
    });

    it('should handle sessions for multiple bridges', () => {
      const session1 = sessionManager.createSession('192.168.1.100', username);
      const session2 = sessionManager.createSession('192.168.1.101', username);

      const result1 = sessionManager.getSession(session1.sessionToken);
      const result2 = sessionManager.getSession(session2.sessionToken);

      expect(result1.bridgeIp).toBe('192.168.1.100');
      expect(result2.bridgeIp).toBe('192.168.1.101');
    });
  });

  describe('Bridge Credentials Storage', () => {
    beforeEach(() => {
      // Clear bridge credentials before each test
      sessionManager.bridgeCredentials.clear();
    });

    describe('storeBridgeCredentials', () => {
      it('should store credentials for a bridge', () => {
        sessionManager.storeBridgeCredentials(bridgeIp, username);

        expect(sessionManager.bridgeCredentials.has(bridgeIp)).toBe(true);
        expect(sessionManager.bridgeCredentials.get(bridgeIp)).toBe(username);
      });

      it('should overwrite existing credentials for same bridge', () => {
        sessionManager.storeBridgeCredentials(bridgeIp, 'old-user');
        sessionManager.storeBridgeCredentials(bridgeIp, 'new-user');

        expect(sessionManager.bridgeCredentials.get(bridgeIp)).toBe('new-user');
      });

      it('should store credentials for multiple bridges', () => {
        sessionManager.storeBridgeCredentials('192.168.1.100', 'user1');
        sessionManager.storeBridgeCredentials('192.168.1.101', 'user2');

        expect(sessionManager.bridgeCredentials.get('192.168.1.100')).toBe('user1');
        expect(sessionManager.bridgeCredentials.get('192.168.1.101')).toBe('user2');
      });
    });

    describe('getBridgeCredentials', () => {
      it('should return stored username for bridge', () => {
        sessionManager.storeBridgeCredentials(bridgeIp, username);

        const result = sessionManager.getBridgeCredentials(bridgeIp);

        expect(result).toBe(username);
      });

      it('should return null for unknown bridge', () => {
        const result = sessionManager.getBridgeCredentials('192.168.1.200');

        expect(result).toBeNull();
      });
    });

    describe('hasBridgeCredentials', () => {
      it('should return true for bridge with stored credentials', () => {
        sessionManager.storeBridgeCredentials(bridgeIp, username);

        expect(sessionManager.hasBridgeCredentials(bridgeIp)).toBe(true);
      });

      it('should return false for unknown bridge', () => {
        expect(sessionManager.hasBridgeCredentials('192.168.1.200')).toBe(false);
      });

      it('should return false after credentials are cleared', () => {
        sessionManager.storeBridgeCredentials(bridgeIp, username);
        sessionManager.bridgeCredentials.clear();

        expect(sessionManager.hasBridgeCredentials(bridgeIp)).toBe(false);
      });
    });
  });
});
