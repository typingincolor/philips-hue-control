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

// Mock encryption module
vi.mock('../../utils/encryption.js', () => ({
  generateKey: vi.fn(() => 'a'.repeat(64)),
  encrypt: vi.fn((plaintext) => ({
    encrypted: Buffer.from(plaintext).toString('base64'),
    iv: 'mock_iv_base64',
    authTag: 'mock_auth_tag_base64',
  })),
  decrypt: vi.fn((encrypted) => Buffer.from(encrypted, 'base64').toString('utf8')),
  getEncryptionKey: vi.fn(() => 'a'.repeat(64)),
}));

describe('HiveCredentialsManager', () => {
  let hiveCredentialsManager;
  const testCredentialsPath = '/tmp/test-hive-credentials.json';
  const testUsername = 'test@hive.com';
  const testPassword = 'testPassword123';

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    // Clean up test credentials file
    try {
      fs.unlinkSync(testCredentialsPath);
    } catch {
      // File doesn't exist, that's fine
    }

    // Import fresh instance for each test
    const module = await import('../../services/hiveCredentialsManager.js');
    hiveCredentialsManager = module.default;

    // Override credentials file path for testing
    hiveCredentialsManager.credentialsFilePath = testCredentialsPath;

    // Clear any credentials loaded from the default path during import
    hiveCredentialsManager.username = null;
    hiveCredentialsManager.password = null;
    hiveCredentialsManager.sessionToken = null;
    hiveCredentialsManager.sessionExpiresAt = null;
    hiveCredentialsManager.deviceKey = null;
    hiveCredentialsManager.deviceGroupKey = null;
    hiveCredentialsManager.devicePassword = null;
  });

  afterEach(() => {
    // Clean up test credentials file
    try {
      fs.unlinkSync(testCredentialsPath);
    } catch {
      // File doesn't exist, that's fine
    }
  });

  describe('storeCredentials', () => {
    it('should store credentials to file', () => {
      hiveCredentialsManager.storeCredentials(testUsername, testPassword);

      expect(fs.existsSync(testCredentialsPath)).toBe(true);
    });

    it('should encrypt password before saving', () => {
      hiveCredentialsManager.storeCredentials(testUsername, testPassword);

      const fileContents = fs.readFileSync(testCredentialsPath, 'utf8');
      const saved = JSON.parse(fileContents);

      // Password should not be stored in plaintext
      expect(saved.password).toBeUndefined();
      expect(saved.encryptedPassword).toBeDefined();
      expect(saved.iv).toBeDefined();
      expect(saved.authTag).toBeDefined();
    });

    it('should store username in plaintext', () => {
      hiveCredentialsManager.storeCredentials(testUsername, testPassword);

      const fileContents = fs.readFileSync(testCredentialsPath, 'utf8');
      const saved = JSON.parse(fileContents);

      expect(saved.username).toBe(testUsername);
    });

    it('should clear cached session token when storing new credentials', () => {
      // Set a session token first
      hiveCredentialsManager.setSessionToken('old_token', Date.now() + 60000);

      // Store new credentials
      hiveCredentialsManager.storeCredentials(testUsername, testPassword);

      expect(hiveCredentialsManager.getSessionToken()).toBeNull();
    });

    it('should create parent directory if it does not exist', () => {
      const nestedPath = '/tmp/nested/hive/credentials.json';
      hiveCredentialsManager.credentialsFilePath = nestedPath;

      hiveCredentialsManager.storeCredentials(testUsername, testPassword);

      expect(fs.existsSync(nestedPath)).toBe(true);

      // Cleanup
      fs.rmSync('/tmp/nested', { recursive: true, force: true });
    });

    it('should overwrite existing credentials', () => {
      hiveCredentialsManager.storeCredentials('old@hive.com', 'oldPassword');
      hiveCredentialsManager.storeCredentials(testUsername, testPassword);

      const credentials = hiveCredentialsManager.getCredentials();

      expect(credentials.username).toBe(testUsername);
      expect(credentials.password).toBe(testPassword);
    });
  });

  describe('getCredentials', () => {
    it('should return stored credentials', () => {
      hiveCredentialsManager.storeCredentials(testUsername, testPassword);

      const credentials = hiveCredentialsManager.getCredentials();

      expect(credentials).not.toBeNull();
      expect(credentials.username).toBe(testUsername);
      expect(credentials.password).toBe(testPassword);
    });

    it('should return null when no credentials stored', () => {
      const credentials = hiveCredentialsManager.getCredentials();

      expect(credentials).toBeNull();
    });
  });

  describe('hasCredentials', () => {
    it('should return true when credentials are stored', () => {
      hiveCredentialsManager.storeCredentials(testUsername, testPassword);

      expect(hiveCredentialsManager.hasCredentials()).toBe(true);
    });

    it('should return false when no credentials', () => {
      expect(hiveCredentialsManager.hasCredentials()).toBe(false);
    });

    it('should return false after credentials are cleared', () => {
      hiveCredentialsManager.storeCredentials(testUsername, testPassword);
      hiveCredentialsManager.clearCredentials();

      expect(hiveCredentialsManager.hasCredentials()).toBe(false);
    });
  });

  describe('clearCredentials', () => {
    it('should clear credentials from memory', () => {
      hiveCredentialsManager.storeCredentials(testUsername, testPassword);
      hiveCredentialsManager.clearCredentials();

      expect(hiveCredentialsManager.getCredentials()).toBeNull();
    });

    it('should clear credentials from file', () => {
      hiveCredentialsManager.storeCredentials(testUsername, testPassword);
      hiveCredentialsManager.clearCredentials();

      if (fs.existsSync(testCredentialsPath)) {
        const fileContents = fs.readFileSync(testCredentialsPath, 'utf8');
        const saved = JSON.parse(fileContents);
        expect(saved.username).toBeUndefined();
        expect(saved.encryptedPassword).toBeUndefined();
      }
    });

    it('should clear cached session token', () => {
      hiveCredentialsManager.storeCredentials(testUsername, testPassword);
      hiveCredentialsManager.setSessionToken('some_token', Date.now() + 60000);
      hiveCredentialsManager.clearCredentials();

      expect(hiveCredentialsManager.getSessionToken()).toBeNull();
    });

    it('should not throw when no credentials exist', () => {
      expect(() => {
        hiveCredentialsManager.clearCredentials();
      }).not.toThrow();
    });
  });

  describe('Session Token Caching', () => {
    describe('setSessionToken', () => {
      it('should persist session token to file', () => {
        hiveCredentialsManager.storeCredentials(testUsername, testPassword);
        const token = 'hive_session_token_123';
        const expiresAt = Date.now() + 60000;

        hiveCredentialsManager.setSessionToken(token, expiresAt);

        const fileContents = fs.readFileSync(testCredentialsPath, 'utf8');
        const saved = JSON.parse(fileContents);

        expect(saved.sessionToken).toBe(token);
        expect(saved.sessionExpiresAt).toBe(expiresAt);
      });
    });

    describe('getSessionToken', () => {
      it('should return cached token if not expired', () => {
        const token = 'valid_token';
        const expiresAt = Date.now() + 60000; // 1 minute in future

        hiveCredentialsManager.setSessionToken(token, expiresAt);

        expect(hiveCredentialsManager.getSessionToken()).toBe(token);
      });

      it('should return null if token expired', () => {
        const token = 'expired_token';
        const expiresAt = Date.now() - 1000; // 1 second in past

        hiveCredentialsManager.setSessionToken(token, expiresAt);

        expect(hiveCredentialsManager.getSessionToken()).toBeNull();
      });

      it('should return null if no token set', () => {
        expect(hiveCredentialsManager.getSessionToken()).toBeNull();
      });

      it('should clear expired token from storage', () => {
        hiveCredentialsManager.storeCredentials(testUsername, testPassword);
        const token = 'expired_token';
        const expiresAt = Date.now() - 1000;

        hiveCredentialsManager.setSessionToken(token, expiresAt);
        hiveCredentialsManager.getSessionToken(); // This should clear the expired token

        const fileContents = fs.readFileSync(testCredentialsPath, 'utf8');
        const saved = JSON.parse(fileContents);

        expect(saved.sessionToken).toBeUndefined();
      });
    });

    describe('clearSessionToken', () => {
      it('should clear session token from memory', () => {
        hiveCredentialsManager.setSessionToken('token', Date.now() + 60000);
        hiveCredentialsManager.clearSessionToken();

        expect(hiveCredentialsManager.getSessionToken()).toBeNull();
      });

      it('should clear session token from file', () => {
        hiveCredentialsManager.storeCredentials(testUsername, testPassword);
        hiveCredentialsManager.setSessionToken('token', Date.now() + 60000);
        hiveCredentialsManager.clearSessionToken();

        const fileContents = fs.readFileSync(testCredentialsPath, 'utf8');
        const saved = JSON.parse(fileContents);

        expect(saved.sessionToken).toBeUndefined();
      });
    });
  });

  describe('Persistence', () => {
    it('should load credentials from file on startup', async () => {
      // Store credentials
      hiveCredentialsManager.storeCredentials(testUsername, testPassword);

      // Reset modules to simulate restart
      vi.resetModules();
      const newModule = await import('../../services/hiveCredentialsManager.js');
      const newManager = newModule.default;
      newManager.credentialsFilePath = testCredentialsPath;
      newManager._loadCredentials();

      expect(newManager.hasCredentials()).toBe(true);
      const credentials = newManager.getCredentials();
      expect(credentials.username).toBe(testUsername);
    });

    it('should handle missing credentials file gracefully', async () => {
      vi.resetModules();
      const newModule = await import('../../services/hiveCredentialsManager.js');
      const newManager = newModule.default;
      newManager.credentialsFilePath = '/tmp/nonexistent-hive-creds.json';

      expect(() => newManager._loadCredentials()).not.toThrow();
      expect(newManager.hasCredentials()).toBe(false);
    });

    it('should handle corrupted JSON file gracefully', async () => {
      fs.writeFileSync(testCredentialsPath, 'not valid json {{{');

      vi.resetModules();
      const newModule = await import('../../services/hiveCredentialsManager.js');
      const newManager = newModule.default;
      newManager.credentialsFilePath = testCredentialsPath;

      expect(() => newManager._loadCredentials()).not.toThrow();
      expect(newManager.hasCredentials()).toBe(false);
    });

    it('should handle empty file gracefully', async () => {
      fs.writeFileSync(testCredentialsPath, '');

      vi.resetModules();
      const newModule = await import('../../services/hiveCredentialsManager.js');
      const newManager = newModule.default;
      newManager.credentialsFilePath = testCredentialsPath;

      expect(() => newManager._loadCredentials()).not.toThrow();
      expect(newManager.hasCredentials()).toBe(false);
    });

    it('should handle decryption errors gracefully', async () => {
      // Store malformed encrypted data
      const malformedData = {
        username: testUsername,
        encryptedPassword: 'invalid_encrypted_data',
        iv: 'invalid_iv',
        authTag: 'invalid_tag',
      };
      fs.writeFileSync(testCredentialsPath, JSON.stringify(malformedData));

      vi.resetModules();

      // Mock decrypt to throw
      vi.doMock('../../utils/encryption.js', () => ({
        decrypt: vi.fn(() => {
          throw new Error('Decryption failed');
        }),
        getEncryptionKey: vi.fn(() => 'a'.repeat(64)),
      }));

      const newModule = await import('../../services/hiveCredentialsManager.js');
      const newManager = newModule.default;
      newManager.credentialsFilePath = testCredentialsPath;

      expect(() => newManager._loadCredentials()).not.toThrow();

      // Clean up the doMock to restore original mock for subsequent tests
      vi.doUnmock('../../utils/encryption.js');
      vi.resetModules();
    });

    it('should persist credentials across manager instances', async () => {
      hiveCredentialsManager.storeCredentials(testUsername, testPassword);

      // Create new instance
      vi.resetModules();
      const newModule = await import('../../services/hiveCredentialsManager.js');
      const newManager = newModule.default;
      newManager.credentialsFilePath = testCredentialsPath;
      newManager._loadCredentials();

      const credentials = newManager.getCredentials();
      expect(credentials.username).toBe(testUsername);
      expect(credentials.password).toBe(testPassword);
    });
  });

  describe('Validation', () => {
    it('should reject empty username', () => {
      expect(() => {
        hiveCredentialsManager.storeCredentials('', testPassword);
      }).toThrow(/username/i);
    });

    it('should reject null username', () => {
      expect(() => {
        hiveCredentialsManager.storeCredentials(null, testPassword);
      }).toThrow(/username/i);
    });

    it('should reject empty password', () => {
      expect(() => {
        hiveCredentialsManager.storeCredentials(testUsername, '');
      }).toThrow(/password/i);
    });

    it('should reject null password', () => {
      expect(() => {
        hiveCredentialsManager.storeCredentials(testUsername, null);
      }).toThrow(/password/i);
    });

    it('should validate email format for username', () => {
      expect(() => {
        hiveCredentialsManager.storeCredentials('notanemail', testPassword);
      }).toThrow(/email|username/i);
    });

    it('should accept valid email format', () => {
      expect(() => {
        hiveCredentialsManager.storeCredentials('user@example.com', testPassword);
      }).not.toThrow();
    });
  });

  describe('Default Path', () => {
    it('should have default credentials file path', async () => {
      vi.resetModules();
      const module = await import('../../services/hiveCredentialsManager.js');
      const manager = module.default;

      expect(manager.credentialsFilePath).toBeDefined();
      expect(manager.credentialsFilePath).toContain('hive-credentials.json');
    });
  });
});
