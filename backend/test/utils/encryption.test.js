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

describe('encryption', () => {
  let encryption;
  const testKeyPath = '/tmp/test-encryption-key';

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    // Clean up test key file
    try {
      fs.unlinkSync(testKeyPath);
    } catch {
      // File doesn't exist, that's fine
    }

    // Clear environment variable
    delete process.env.HIVE_ENCRYPTION_KEY;

    // Import fresh instance for each test
    const module = await import('../../utils/encryption.js');
    encryption = module.default;
  });

  afterEach(() => {
    // Clean up test key file
    try {
      fs.unlinkSync(testKeyPath);
    } catch {
      // File doesn't exist, that's fine
    }
    delete process.env.HIVE_ENCRYPTION_KEY;
  });

  describe('generateKey', () => {
    it('should generate a 32-byte key', () => {
      const key = encryption.generateKey();

      // 32 bytes = 64 hex characters
      expect(key).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate unique keys each time', () => {
      // Generate multiple keys and verify they're all different
      const keys = new Set();
      for (let i = 0; i < 10; i++) {
        keys.add(encryption.generateKey());
      }
      expect(keys.size).toBe(10);
    });
  });

  describe('encrypt', () => {
    it('should encrypt plaintext and return encrypted data with iv and authTag', () => {
      const key = encryption.generateKey();
      const plaintext = 'my secret password';

      const result = encryption.encrypt(plaintext, key);

      expect(result).toHaveProperty('encrypted');
      expect(result).toHaveProperty('iv');
      expect(result).toHaveProperty('authTag');
      expect(result.encrypted).not.toBe(plaintext);
    });

    it('should produce different ciphertext for same plaintext (random IV)', () => {
      const key = encryption.generateKey();
      const plaintext = 'same password';

      const result1 = encryption.encrypt(plaintext, key);
      const result2 = encryption.encrypt(plaintext, key);

      expect(result1.encrypted).not.toBe(result2.encrypted);
      expect(result1.iv).not.toBe(result2.iv);
    });

    it('should return base64 encoded values', () => {
      const key = encryption.generateKey();
      const plaintext = 'test password';

      const result = encryption.encrypt(plaintext, key);

      // Base64 regex
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      expect(result.encrypted).toMatch(base64Regex);
      expect(result.iv).toMatch(base64Regex);
      expect(result.authTag).toMatch(base64Regex);
    });
  });

  describe('decrypt', () => {
    it('should decrypt to original plaintext', () => {
      const key = encryption.generateKey();
      const plaintext = 'my secret password';

      const encrypted = encryption.encrypt(plaintext, key);
      const decrypted = encryption.decrypt(
        encrypted.encrypted,
        encrypted.iv,
        encrypted.authTag,
        key
      );

      expect(decrypted).toBe(plaintext);
    });

    it('should decrypt empty string correctly', () => {
      const key = encryption.generateKey();
      const plaintext = '';

      const encrypted = encryption.encrypt(plaintext, key);
      const decrypted = encryption.decrypt(
        encrypted.encrypted,
        encrypted.iv,
        encrypted.authTag,
        key
      );

      expect(decrypted).toBe(plaintext);
    });

    it('should decrypt special characters correctly', () => {
      const key = encryption.generateKey();
      const plaintext = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/\\`~';

      const encrypted = encryption.encrypt(plaintext, key);
      const decrypted = encryption.decrypt(
        encrypted.encrypted,
        encrypted.iv,
        encrypted.authTag,
        key
      );

      expect(decrypted).toBe(plaintext);
    });

    it('should decrypt Unicode correctly', () => {
      const key = encryption.generateKey();
      const plaintext = '密码 пароль كلمة السر 🔐';

      const encrypted = encryption.encrypt(plaintext, key);
      const decrypted = encryption.decrypt(
        encrypted.encrypted,
        encrypted.iv,
        encrypted.authTag,
        key
      );

      expect(decrypted).toBe(plaintext);
    });

    it('should throw error with wrong key', () => {
      const key1 = encryption.generateKey();
      const key2 = encryption.generateKey();
      const plaintext = 'secret';

      const encrypted = encryption.encrypt(plaintext, key1);

      expect(() => {
        encryption.decrypt(encrypted.encrypted, encrypted.iv, encrypted.authTag, key2);
      }).toThrow();
    });

    it('should throw error with tampered ciphertext', () => {
      const key = encryption.generateKey();
      const plaintext = 'secret';

      const encrypted = encryption.encrypt(plaintext, key);

      // Tamper with the ciphertext
      const tamperedBuffer = Buffer.from(encrypted.encrypted, 'base64');
      tamperedBuffer[0] = tamperedBuffer[0] ^ 0xff;
      const tampered = tamperedBuffer.toString('base64');

      expect(() => {
        encryption.decrypt(tampered, encrypted.iv, encrypted.authTag, key);
      }).toThrow();
    });

    it('should throw error with wrong IV', () => {
      const key = encryption.generateKey();
      const plaintext = 'secret';

      const encrypted = encryption.encrypt(plaintext, key);

      // Generate wrong IV
      const wrongIv = Buffer.alloc(12).fill(0).toString('base64');

      expect(() => {
        encryption.decrypt(encrypted.encrypted, wrongIv, encrypted.authTag, key);
      }).toThrow();
    });

    it('should throw error with wrong auth tag', () => {
      const key = encryption.generateKey();
      const plaintext = 'secret';

      const encrypted = encryption.encrypt(plaintext, key);

      // Generate wrong auth tag
      const wrongAuthTag = Buffer.alloc(16).fill(0).toString('base64');

      expect(() => {
        encryption.decrypt(encrypted.encrypted, encrypted.iv, wrongAuthTag, key);
      }).toThrow();
    });
  });

  describe('getEncryptionKey', () => {
    it('should load key from environment variable', () => {
      const testKey = 'a'.repeat(64); // 64 hex chars = 32 bytes
      process.env.HIVE_ENCRYPTION_KEY = testKey;

      const key = encryption.getEncryptionKey();

      expect(key).toBe(testKey);
    });

    it('should load key from file if env var not set', () => {
      const testKey = 'b'.repeat(64);
      encryption.keyFilePath = testKeyPath;
      fs.writeFileSync(testKeyPath, testKey);

      const key = encryption.getEncryptionKey();

      expect(key).toBe(testKey);
    });

    it('should generate and save key if none exists', () => {
      encryption.keyFilePath = testKeyPath;

      const key = encryption.getEncryptionKey();

      expect(key).toMatch(/^[a-f0-9]{64}$/);
      expect(fs.existsSync(testKeyPath)).toBe(true);

      const savedKey = fs.readFileSync(testKeyPath, 'utf8').trim();
      expect(savedKey).toBe(key);
    });

    it('should return same key on subsequent calls', () => {
      encryption.keyFilePath = testKeyPath;

      const key1 = encryption.getEncryptionKey();
      const key2 = encryption.getEncryptionKey();

      expect(key1).toBe(key2);
    });

    it('should prefer environment variable over file', () => {
      const envKey = 'c'.repeat(64);
      const fileKey = 'd'.repeat(64);

      process.env.HIVE_ENCRYPTION_KEY = envKey;
      encryption.keyFilePath = testKeyPath;
      fs.writeFileSync(testKeyPath, fileKey);

      const key = encryption.getEncryptionKey();

      expect(key).toBe(envKey);
    });

    it('should create parent directory if it does not exist', () => {
      const nestedPath = '/tmp/nested/encryption/key';
      encryption.keyFilePath = nestedPath;

      const key = encryption.getEncryptionKey();

      expect(key).toMatch(/^[a-f0-9]{64}$/);
      expect(fs.existsSync(nestedPath)).toBe(true);

      // Cleanup
      fs.rmSync('/tmp/nested', { recursive: true, force: true });
    });

    it('should validate key length from environment', () => {
      process.env.HIVE_ENCRYPTION_KEY = 'tooshort';

      expect(() => {
        encryption.getEncryptionKey();
      }).toThrow(/invalid.*key.*length/i);
    });

    it('should validate key format from environment', () => {
      process.env.HIVE_ENCRYPTION_KEY = 'g'.repeat(64); // 'g' is not a valid hex char

      expect(() => {
        encryption.getEncryptionKey();
      }).toThrow(/invalid.*key.*format/i);
    });
  });
});
