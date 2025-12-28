/**
 * Tests for V2 Settings API client
 * Replaces hueApi settings methods with V2 endpoints
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as settingsApi from './settingsApi';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock authApi for session token (apiUtils imports from authApi)
vi.mock('./authApi', () => ({
  getSessionToken: vi.fn(() => 'test-token'),
}));

describe('settingsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('getSettings', () => {
    it('should get settings with auth header', async () => {
      const mockSettings = {
        location: { lat: 51.5074, lon: -0.1278, name: 'London' },
        units: 'celsius',
        services: { hue: { enabled: true } },
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSettings),
      });

      const result = await settingsApi.getSettings();

      expect(mockFetch).toHaveBeenCalledWith('/api/v2/settings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
      });
      expect(result).toEqual(mockSettings);
    });

    it('should pass demo mode header when enabled', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await settingsApi.getSettings(true);

      expect(mockFetch).toHaveBeenCalledWith('/api/v2/settings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
          'X-Demo-Mode': 'true',
        },
      });
    });
  });

  describe('updateSettings', () => {
    it('should update settings', async () => {
      const updates = { units: 'fahrenheit' };
      const updatedSettings = {
        location: { lat: 51.5074, lon: -0.1278, name: 'London' },
        units: 'fahrenheit',
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(updatedSettings),
      });

      const result = await settingsApi.updateSettings(updates);

      expect(mockFetch).toHaveBeenCalledWith('/api/v2/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify(updates),
      });
      expect(result).toEqual(updatedSettings);
    });
  });

  describe('updateLocation', () => {
    it('should update location', async () => {
      const location = { lat: 40.7128, lon: -74.006, name: 'New York' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(location),
      });

      const result = await settingsApi.updateLocation(location);

      expect(mockFetch).toHaveBeenCalledWith('/api/v2/settings/location', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify(location),
      });
      expect(result).toEqual(location);
    });
  });

  describe('clearLocation', () => {
    it('should clear location', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await settingsApi.clearLocation();

      expect(mockFetch).toHaveBeenCalledWith('/api/v2/settings/location', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
      });
      expect(result.success).toBe(true);
    });
  });
});
