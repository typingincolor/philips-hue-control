import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';

// Mock logger to suppress output
vi.mock('../../utils/logger.js', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

// Mock hueClient for bridge validation
vi.mock('../../services/hueClient.js', () => ({
  default: {
    getLights: vi.fn(() => Promise.resolve({ data: [] })),
    getRooms: vi.fn(() => Promise.resolve({ data: [] })),
    getDevices: vi.fn(() => Promise.resolve({ data: [] })),
  },
}));

const TEST_CREDENTIALS_PATH = '/tmp/test-multi-client-credentials.json';

describe('Multi-Client Integration', () => {
  let sessionManager;
  let extractCredentials;

  const bridgeIp = '192.168.1.100';
  const username = 'test-user-abc123';

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    // Import fresh instances for each test
    const sessionModule = await import('../../services/sessionManager.js');
    sessionManager = sessionModule.default;

    const authModule = await import('../../middleware/auth.js');
    extractCredentials = authModule.extractCredentials;

    // Stop automatic cleanup
    sessionManager.stopCleanup();

    // Clear any existing data
    sessionManager.sessions.clear();
    sessionManager.bridgeCredentials.clear();

    // CRITICAL: Use test path to avoid touching production credentials
    sessionManager.credentialsFilePath = TEST_CREDENTIALS_PATH;
  });

  afterEach(() => {
    sessionManager.stopCleanup();
    vi.restoreAllMocks();

    // Clean up test credentials file
    try {
      fs.unlinkSync(TEST_CREDENTIALS_PATH);
    } catch {
      // File doesn't exist, that's fine
    }
  });

  describe('Client 1 pairs, Client 2 connects without pairing', () => {
    it('should allow Client 2 to connect using credentials stored by Client 1', () => {
      // === CLIENT 1: Pairs with bridge ===
      // Simulates POST /api/v1/auth/pair followed by POST /api/v1/auth/session

      // Client 1 pairs and gets username from bridge
      // Then creates a session
      const client1Session = sessionManager.createSession(bridgeIp, username);
      expect(client1Session.sessionToken).toMatch(/^hue_sess_/);

      // Client 1's session creation also stores bridge credentials
      sessionManager.storeBridgeCredentials(bridgeIp, username);

      // Verify credentials are stored
      expect(sessionManager.hasBridgeCredentials(bridgeIp)).toBe(true);
      expect(sessionManager.getBridgeCredentials(bridgeIp)).toBe(username);

      // === CLIENT 2: Connects using stored credentials ===
      // Simulates POST /api/v1/auth/connect

      // Client 2 checks if credentials exist
      const storedUsername = sessionManager.getBridgeCredentials(bridgeIp);
      expect(storedUsername).toBe(username);

      // Client 2 creates session using stored credentials (no pairing needed!)
      const client2Session = sessionManager.createSession(bridgeIp, storedUsername);
      expect(client2Session.sessionToken).toMatch(/^hue_sess_/);

      // Both sessions should be valid and independent
      expect(client1Session.sessionToken).not.toBe(client2Session.sessionToken);

      const session1 = sessionManager.getSession(client1Session.sessionToken);
      const session2 = sessionManager.getSession(client2Session.sessionToken);

      expect(session1.bridgeIp).toBe(bridgeIp);
      expect(session2.bridgeIp).toBe(bridgeIp);
      expect(session1.username).toBe(username);
      expect(session2.username).toBe(username);
    });

    it('should store credentials via auth middleware on first authenticated request', () => {
      // === CLIENT 1: Creates session and makes first API call ===

      // Client 1 creates session (after pairing)
      const client1Session = sessionManager.createSession(bridgeIp, username);

      // Verify credentials are NOT stored yet
      expect(sessionManager.hasBridgeCredentials(bridgeIp)).toBe(false);

      // Client 1 makes an authenticated request (e.g., GET /api/v1/dashboard)
      // The auth middleware should store credentials
      const req = {
        headers: { authorization: `Bearer ${client1Session.sessionToken}` },
        query: {},
      };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      extractCredentials(req, res, next);

      // Middleware should have stored credentials
      expect(sessionManager.hasBridgeCredentials(bridgeIp)).toBe(true);
      expect(sessionManager.getBridgeCredentials(bridgeIp)).toBe(username);
      expect(next).toHaveBeenCalledWith(); // No error

      // === CLIENT 2: Can now connect without pairing ===
      const storedUsername = sessionManager.getBridgeCredentials(bridgeIp);
      expect(storedUsername).toBe(username);

      const client2Session = sessionManager.createSession(bridgeIp, storedUsername);
      expect(client2Session.sessionToken).toBeDefined();
    });

    it('should not re-store credentials if already stored', () => {
      // Store credentials first
      sessionManager.storeBridgeCredentials(bridgeIp, username);
      const originalUsername = sessionManager.getBridgeCredentials(bridgeIp);

      // Create session
      const session = sessionManager.createSession(bridgeIp, username);

      // Spy on storeBridgeCredentials
      const storeSpy = vi.spyOn(sessionManager, 'storeBridgeCredentials');

      // Make authenticated request
      const req = {
        headers: { authorization: `Bearer ${session.sessionToken}` },
        query: {},
      };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      extractCredentials(req, res, next);

      // Should NOT have called storeBridgeCredentials again
      expect(storeSpy).not.toHaveBeenCalled();
      expect(sessionManager.getBridgeCredentials(bridgeIp)).toBe(originalUsername);
    });
  });

  describe('Multiple bridges', () => {
    it('should handle credentials for multiple bridges independently', () => {
      const bridge1 = '192.168.1.100';
      const bridge2 = '192.168.1.101';
      const user1 = 'user-for-bridge-1';
      const user2 = 'user-for-bridge-2';

      // Client on bridge 1 pairs
      sessionManager.storeBridgeCredentials(bridge1, user1);
      sessionManager.createSession(bridge1, user1);

      // Client on bridge 2 pairs
      sessionManager.storeBridgeCredentials(bridge2, user2);
      sessionManager.createSession(bridge2, user2);

      // New client tries to connect to bridge 1
      expect(sessionManager.getBridgeCredentials(bridge1)).toBe(user1);

      // New client tries to connect to bridge 2
      expect(sessionManager.getBridgeCredentials(bridge2)).toBe(user2);

      // Unknown bridge has no credentials
      expect(sessionManager.getBridgeCredentials('192.168.1.200')).toBeNull();
    });
  });

  describe('Session lifecycle with multiple clients', () => {
    it('should allow Client 2 to continue after Client 1 logs out', () => {
      // Client 1 pairs and connects
      sessionManager.storeBridgeCredentials(bridgeIp, username);
      const client1Session = sessionManager.createSession(bridgeIp, username);

      // Client 2 connects using stored credentials
      const client2Session = sessionManager.createSession(bridgeIp, username);

      // Client 1 logs out
      sessionManager.revokeSession(client1Session.sessionToken);

      // Client 1's session is gone
      expect(sessionManager.getSession(client1Session.sessionToken)).toBeNull();

      // Client 2's session still works
      expect(sessionManager.getSession(client2Session.sessionToken)).not.toBeNull();

      // Credentials are still stored (for future clients)
      expect(sessionManager.hasBridgeCredentials(bridgeIp)).toBe(true);
    });

    it('should support many concurrent clients', () => {
      // Store credentials from first pairing
      sessionManager.storeBridgeCredentials(bridgeIp, username);

      // Create 10 client sessions
      const sessions = [];
      for (let i = 0; i < 10; i++) {
        const session = sessionManager.createSession(bridgeIp, username);
        sessions.push(session);
      }

      // All sessions should be valid and unique
      const tokens = sessions.map((s) => s.sessionToken);
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(10);

      // All sessions should be retrievable
      for (const session of sessions) {
        const retrieved = sessionManager.getSession(session.sessionToken);
        expect(retrieved).not.toBeNull();
        expect(retrieved.bridgeIp).toBe(bridgeIp);
      }

      // Stats should reflect 10 active sessions
      const stats = sessionManager.getStats();
      expect(stats.activeSessions).toBe(10);
    });
  });

  describe('Credential persistence scenarios', () => {
    it('should require pairing when no credentials exist', () => {
      // No credentials stored
      expect(sessionManager.hasBridgeCredentials(bridgeIp)).toBe(false);
      expect(sessionManager.getBridgeCredentials(bridgeIp)).toBeNull();

      // Client cannot connect without pairing
      // (In real flow, /api/v1/auth/connect would return 404 with requiresPairing: true)
    });

    it('should allow immediate connection when credentials exist', () => {
      // Credentials stored from previous client
      sessionManager.storeBridgeCredentials(bridgeIp, username);

      // New client can create session immediately
      const storedUser = sessionManager.getBridgeCredentials(bridgeIp);
      expect(storedUser).toBe(username);

      const session = sessionManager.createSession(bridgeIp, storedUser);
      expect(session.sessionToken).toBeDefined();
      expect(session.bridgeIp).toBe(bridgeIp);
    });

    it('should handle credential updates from re-pairing', () => {
      // Original credentials
      sessionManager.storeBridgeCredentials(bridgeIp, 'old-username');
      const oldSession = sessionManager.createSession(bridgeIp, 'old-username');

      // User re-pairs (e.g., bridge was reset)
      const newUsername = 'new-username-after-reset';
      sessionManager.storeBridgeCredentials(bridgeIp, newUsername);

      // Old session still works (until it expires)
      expect(sessionManager.getSession(oldSession.sessionToken)).not.toBeNull();

      // New clients get new credentials
      expect(sessionManager.getBridgeCredentials(bridgeIp)).toBe(newUsername);

      // New session uses new credentials
      const newSession = sessionManager.createSession(bridgeIp, newUsername);
      const retrieved = sessionManager.getSession(newSession.sessionToken);
      expect(retrieved.username).toBe(newUsername);
    });
  });

  describe('Real-world flow simulation', () => {
    it('should handle complete multi-client authentication flow', async () => {
      // === STEP 1: Client 1 discovers bridge and pairs ===
      // (Bridge pairing returns username)
      const pairingUsername = 'KZLwQGOGUMwtFMpYMeRqA9gzSuYoRtRgVThntanx';

      // Store credentials after successful pairing
      sessionManager.storeBridgeCredentials(bridgeIp, pairingUsername);

      // Create session for Client 1
      const client1Session = sessionManager.createSession(bridgeIp, pairingUsername);

      // === STEP 2: Client 1 loads dashboard ===
      // Middleware validates session and stores credentials (if not already)
      const req1 = {
        headers: { authorization: `Bearer ${client1Session.sessionToken}` },
        query: {},
      };
      const res1 = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next1 = vi.fn();

      extractCredentials(req1, res1, next1);

      expect(next1).toHaveBeenCalledWith();
      expect(req1.hue.bridgeIp).toBe(bridgeIp);
      expect(req1.hue.username).toBe(pairingUsername);

      // === STEP 3: Client 2 enters bridge IP ===
      // Checks if credentials exist
      expect(sessionManager.hasBridgeCredentials(bridgeIp)).toBe(true);

      // Gets stored credentials
      const storedUsername = sessionManager.getBridgeCredentials(bridgeIp);
      expect(storedUsername).toBe(pairingUsername);

      // Creates session without pairing
      const client2Session = sessionManager.createSession(bridgeIp, storedUsername);

      // === STEP 4: Client 2 loads dashboard ===
      const req2 = {
        headers: { authorization: `Bearer ${client2Session.sessionToken}` },
        query: {},
      };
      const res2 = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next2 = vi.fn();

      extractCredentials(req2, res2, next2);

      expect(next2).toHaveBeenCalledWith();
      expect(req2.hue.bridgeIp).toBe(bridgeIp);
      expect(req2.hue.username).toBe(pairingUsername);

      // === STEP 5: Both clients can control lights ===
      // Both have valid sessions
      expect(sessionManager.getSession(client1Session.sessionToken)).not.toBeNull();
      expect(sessionManager.getSession(client2Session.sessionToken)).not.toBeNull();

      // Stats show 2 active sessions
      expect(sessionManager.getStats().activeSessions).toBe(2);
    });
  });
});
