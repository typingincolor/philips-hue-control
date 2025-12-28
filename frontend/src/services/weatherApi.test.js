/**
 * Tests for V2 Weather API client
 * Replaces hueApi weather methods with V2 endpoints
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as weatherApi from './weatherApi';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock authApi for session token (apiUtils imports from authApi)
vi.mock('./authApi', () => ({
  getSessionToken: vi.fn(() => 'test-token'),
}));

describe('weatherApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('getWeather', () => {
    it('should get weather with auth header', async () => {
      const mockWeather = {
        temperature: 15,
        condition: 'cloudy',
        icon: 'cloud',
        humidity: 75,
        windSpeed: 12,
        location: 'London',
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockWeather),
      });

      const result = await weatherApi.getWeather();

      expect(mockFetch).toHaveBeenCalledWith('/api/v2/weather', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
      });
      expect(result).toEqual(mockWeather);
    });

    it('should pass demo mode header when enabled', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await weatherApi.getWeather(true);

      expect(mockFetch).toHaveBeenCalledWith('/api/v2/weather', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
          'X-Demo-Mode': 'true',
        },
      });
    });

    it('should throw on 404 (no location configured)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'No location configured' }),
      });

      await expect(weatherApi.getWeather()).rejects.toThrow('location');
    });

    it('should handle service unavailable', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: () => Promise.resolve({ error: 'Weather service unavailable' }),
      });

      await expect(weatherApi.getWeather()).rejects.toThrow('unavailable');
    });
  });
});
