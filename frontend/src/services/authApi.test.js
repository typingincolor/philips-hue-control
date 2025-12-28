/**
 * Tests for V2 Auth API client
 * Replaces hueApi authentication methods with V2 endpoints
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as authApi from './authApi';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('authApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  afterEach(() => {
    authApi.clearSessionToken();
  });

  describe('pair', () => {
    it('should pair with bridge and return username', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, username: 'test-user-123' }),
      });

      const result = await authApi.pair('192.168.1.100', 'my-app');

      expect(mockFetch).toHaveBeenCalledWith('/api/v2/services/hue/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bridgeIp: '192.168.1.100', appName: 'my-app' }),
      });
      expect(result).toBe('test-user-123');
    });

    it('should throw if link button not pressed', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 424,
        json: () => Promise.resolve({ requiresLinkButton: true }),
      });

      await expect(authApi.pair('192.168.1.100')).rejects.toThrow('link button');
    });
  });

  describe('connect', () => {
    it('should connect with stored credentials', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ sessionToken: 'test-token', expiresIn: 86400 }),
      });

      const result = await authApi.connect('192.168.1.100');

      expect(mockFetch).toHaveBeenCalledWith('/api/v2/services/hue/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bridgeIp: '192.168.1.100' }),
      });
      expect(result).toEqual({ sessionToken: 'test-token', expiresIn: 86400 });
    });

    it('should throw PAIRING_REQUIRED if no credentials', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ requiresPairing: true }),
      });

      await expect(authApi.connect('192.168.1.100')).rejects.toThrow('PAIRING_REQUIRED');
    });
  });

  describe('createSession', () => {
    it('should create session', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ sessionToken: 'new-token', expiresIn: 86400 }),
      });

      const result = await authApi.createSession('192.168.1.100', 'hue-user');

      expect(result).toEqual({ sessionToken: 'new-token', expiresIn: 86400 });
    });
  });

  describe('refreshSession', () => {
    it('should refresh session with auth header', async () => {
      authApi.setSessionToken('old-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ sessionToken: 'new-token', expiresIn: 86400 }),
      });

      const result = await authApi.refreshSession();

      expect(mockFetch).toHaveBeenCalledWith('/api/v2/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer old-token',
        },
      });
      expect(result).toEqual({ sessionToken: 'new-token', expiresIn: 86400 });
    });
  });

  describe('revokeSession', () => {
    it('should revoke session', async () => {
      authApi.setSessionToken('valid-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await authApi.revokeSession();

      expect(mockFetch).toHaveBeenCalledWith('/api/v2/auth/session', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('disconnect', () => {
    it('should disconnect and clear credentials', async () => {
      authApi.setSessionToken('valid-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await authApi.disconnect();

      expect(mockFetch).toHaveBeenCalledWith('/api/v2/auth/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('checkBridgeStatus', () => {
    it('should return hasCredentials status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ hasCredentials: true }),
      });

      const result = await authApi.checkBridgeStatus('192.168.1.100');

      expect(mockFetch).toHaveBeenCalledWith('/api/v2/auth/bridge-status?bridgeIp=192.168.1.100', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await authApi.checkBridgeStatus('192.168.1.100');

      expect(result).toBe(false);
    });
  });

  describe('session token management', () => {
    it('should set and get session token', () => {
      authApi.setSessionToken('my-token');
      expect(authApi.getSessionToken()).toBe('my-token');
    });

    it('should clear session token', () => {
      authApi.setSessionToken('my-token');
      authApi.clearSessionToken();
      expect(authApi.getSessionToken()).toBeNull();
    });
  });
});
