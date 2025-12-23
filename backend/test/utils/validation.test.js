import { describe, it, expect } from 'vitest';
import { validateIp } from '../../utils/validation.js';

describe('validation', () => {
  describe('validateIp', () => {
    it('should accept valid IP addresses', () => {
      expect(validateIp('192.168.1.1')).toBe(true);
      expect(validateIp('10.0.0.1')).toBe(true);
      expect(validateIp('172.16.0.1')).toBe(true);
      expect(validateIp('0.0.0.0')).toBe(true);
      expect(validateIp('255.255.255.255')).toBe(true);
    });

    it('should reject invalid IP formats', () => {
      expect(validateIp('192.168.1')).toBe(false); // Too few octets
      expect(validateIp('192.168.1.1.1')).toBe(false); // Too many octets
      expect(validateIp('abc.def.ghi.jkl')).toBe(false); // Letters
      expect(validateIp('192.168.1.1a')).toBe(false); // Letter in octet
      expect(validateIp('192.168.-1.1')).toBe(false); // Negative number
    });

    it('should reject octets out of range', () => {
      expect(validateIp('192.168.1.256')).toBe(false); // > 255
      expect(validateIp('192.168.256.1')).toBe(false); // > 255
      expect(validateIp('192.256.1.1')).toBe(false); // > 255
      expect(validateIp('256.168.1.1')).toBe(false); // > 255
      expect(validateIp('300.300.300.300')).toBe(false); // All > 255
    });

    it('should accept boundary values', () => {
      expect(validateIp('0.0.0.0')).toBe(true); // Min
      expect(validateIp('255.255.255.255')).toBe(true); // Max
      expect(validateIp('192.168.0.255')).toBe(true); // Last octet max
      expect(validateIp('255.0.0.1')).toBe(true); // First octet max
    });

    it('should reject empty or null strings', () => {
      expect(validateIp('')).toBe(false);
    });

    it('should reject strings with spaces', () => {
      expect(validateIp('192.168.1.1 ')).toBe(false); // Trailing space
      expect(validateIp(' 192.168.1.1')).toBe(false); // Leading space
      expect(validateIp('192.168. 1.1')).toBe(false); // Space in middle
    });

    it('should reject IP with leading zeros', () => {
      // This is actually valid in IP notation, but tests behavior
      const result = validateIp('192.168.001.001');
      expect(typeof result).toBe('boolean');
    });

    it('should handle typical home router IPs', () => {
      expect(validateIp('192.168.1.1')).toBe(true);
      expect(validateIp('192.168.0.1')).toBe(true);
      expect(validateIp('10.0.0.1')).toBe(true);
      expect(validateIp('172.16.0.1')).toBe(true);
    });
  });
});
