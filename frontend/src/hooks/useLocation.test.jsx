import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocation } from './useLocation';
import { hueApi } from '../services/hueApi';

// Mock hueApi
vi.mock('../services/hueApi', () => ({
  hueApi: {
    updateLocation: vi.fn(),
    clearLocation: vi.fn(),
  },
}));

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

// Mock fetch for reverse geocoding
global.fetch = vi.fn();

describe('useLocation', () => {
  const mockLocation = { lat: 51.5074, lon: -0.1278, name: 'London' };

  beforeEach(() => {
    vi.clearAllMocks();
    fetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          address: { city: 'London' },
        }),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should return provided location', () => {
      const { result } = renderHook(() => useLocation('token', mockLocation, vi.fn()));

      expect(result.current.location).toEqual(mockLocation);
      expect(result.current.isDetecting).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should return null location when none provided', () => {
      const { result } = renderHook(() => useLocation('token', null, vi.fn()));

      expect(result.current.location).toBeNull();
    });
  });

  describe('detectLocation', () => {
    it('should detect location using geolocation API', async () => {
      const mockPosition = {
        coords: {
          latitude: 40.7128,
          longitude: -74.006,
        },
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ address: { city: 'New York' } }),
      });

      hueApi.updateLocation.mockResolvedValue({});

      const onLocationUpdate = vi.fn();
      const { result } = renderHook(() => useLocation('token', null, onLocationUpdate));

      await act(async () => {
        await result.current.detectLocation();
      });

      expect(hueApi.updateLocation).toHaveBeenCalledWith('token', {
        lat: 40.7128,
        lon: -74.006,
        name: 'New York',
      });

      expect(onLocationUpdate).toHaveBeenCalledWith({
        lat: 40.7128,
        lon: -74.006,
        name: 'New York',
      });
    });

    it('should set error when geolocation not supported', async () => {
      const originalGeolocation = navigator.geolocation;
      Object.defineProperty(navigator, 'geolocation', {
        value: undefined,
        writable: true,
      });

      const { result } = renderHook(() => useLocation('token', null, vi.fn()));

      await act(async () => {
        await result.current.detectLocation();
      });

      expect(result.current.error).toBe('Geolocation not supported');

      Object.defineProperty(navigator, 'geolocation', {
        value: originalGeolocation,
        writable: true,
      });
    });

    it('should set error when no sessionToken', async () => {
      const { result } = renderHook(() => useLocation(null, null, vi.fn()));

      await act(async () => {
        await result.current.detectLocation();
      });

      expect(result.current.error).toBe('Not authenticated');
    });

    it('should set error on geolocation permission denied', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((_, reject) => {
        reject({ code: 1 });
      });

      const { result } = renderHook(() => useLocation('token', null, vi.fn()));

      await act(async () => {
        await result.current.detectLocation();
      });

      expect(result.current.error).toBe('Location access denied');
    });

    it('should set error on geolocation unavailable', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((_, reject) => {
        reject({ code: 2 });
      });

      const { result } = renderHook(() => useLocation('token', null, vi.fn()));

      await act(async () => {
        await result.current.detectLocation();
      });

      expect(result.current.error).toBe('Location unavailable');
    });

    it('should set error on geolocation timeout', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((_, reject) => {
        reject({ code: 3 });
      });

      const { result } = renderHook(() => useLocation('token', null, vi.fn()));

      await act(async () => {
        await result.current.detectLocation();
      });

      expect(result.current.error).toBe('Location detection timed out');
    });

    it('should set isDetecting to true while detecting', async () => {
      // Use a promise to control when geolocation resolves
      let resolveGeolocation;
      const geolocationPromise = new Promise((resolve) => {
        resolveGeolocation = resolve;
      });

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        geolocationPromise.then(() => {
          success({ coords: { latitude: 0, longitude: 0 } });
        });
      });

      hueApi.updateLocation.mockResolvedValue({});

      const { result } = renderHook(() => useLocation('token', null, vi.fn()));

      // Start detection (don't await yet)
      let detectPromise;
      await act(async () => {
        detectPromise = result.current.detectLocation();
      });

      // Should be detecting since geolocation hasn't resolved
      expect(result.current.isDetecting).toBe(true);

      // Now resolve geolocation and complete the detection
      await act(async () => {
        resolveGeolocation();
        await detectPromise;
      });

      expect(result.current.isDetecting).toBe(false);
    });
  });

  describe('clearLocation', () => {
    it('should clear location via API', async () => {
      hueApi.clearLocation.mockResolvedValue({});
      const onLocationUpdate = vi.fn();

      const { result } = renderHook(() => useLocation('token', mockLocation, onLocationUpdate));

      await act(async () => {
        await result.current.clearLocation();
      });

      expect(hueApi.clearLocation).toHaveBeenCalledWith('token');
      expect(onLocationUpdate).toHaveBeenCalledWith(null);
    });

    it('should not call API when no sessionToken', async () => {
      const { result } = renderHook(() => useLocation(null, mockLocation, vi.fn()));

      await act(async () => {
        await result.current.clearLocation();
      });

      expect(hueApi.clearLocation).not.toHaveBeenCalled();
    });

    it('should set error on API failure', async () => {
      hueApi.clearLocation.mockRejectedValue(new Error('API error'));
      const onLocationUpdate = vi.fn();

      const { result } = renderHook(() => useLocation('token', mockLocation, onLocationUpdate));

      await act(async () => {
        await result.current.clearLocation();
      });

      expect(result.current.error).toBe('API error');
      expect(onLocationUpdate).not.toHaveBeenCalled();
    });
  });

  describe('reverse geocoding', () => {
    it('should return Unknown when geocoding fails', async () => {
      const mockPosition = {
        coords: { latitude: 40.7128, longitude: -74.006 },
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      fetch.mockResolvedValue({
        ok: false,
      });

      hueApi.updateLocation.mockResolvedValue({});
      const onLocationUpdate = vi.fn();

      const { result } = renderHook(() => useLocation('token', null, onLocationUpdate));

      await act(async () => {
        await result.current.detectLocation();
      });

      expect(onLocationUpdate).toHaveBeenCalledWith({
        lat: 40.7128,
        lon: -74.006,
        name: 'Unknown',
      });
    });

    it('should fallback to town when city not available', async () => {
      const mockPosition = {
        coords: { latitude: 40.7128, longitude: -74.006 },
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ address: { town: 'SmallTown' } }),
      });

      hueApi.updateLocation.mockResolvedValue({});
      const onLocationUpdate = vi.fn();

      const { result } = renderHook(() => useLocation('token', null, onLocationUpdate));

      await act(async () => {
        await result.current.detectLocation();
      });

      expect(onLocationUpdate).toHaveBeenCalledWith({
        lat: 40.7128,
        lon: -74.006,
        name: 'SmallTown',
      });
    });

    it('should fallback to village when city and town not available', async () => {
      const mockPosition = {
        coords: { latitude: 40.7128, longitude: -74.006 },
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ address: { village: 'TinyVillage' } }),
      });

      hueApi.updateLocation.mockResolvedValue({});
      const onLocationUpdate = vi.fn();

      const { result } = renderHook(() => useLocation('token', null, onLocationUpdate));

      await act(async () => {
        await result.current.detectLocation();
      });

      expect(onLocationUpdate).toHaveBeenCalledWith({
        lat: 40.7128,
        lon: -74.006,
        name: 'TinyVillage',
      });
    });

    it('should return Unknown when fetch throws', async () => {
      const mockPosition = {
        coords: { latitude: 40.7128, longitude: -74.006 },
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      fetch.mockRejectedValue(new Error('Network error'));

      hueApi.updateLocation.mockResolvedValue({});
      const onLocationUpdate = vi.fn();

      const { result } = renderHook(() => useLocation('token', null, onLocationUpdate));

      await act(async () => {
        await result.current.detectLocation();
      });

      expect(onLocationUpdate).toHaveBeenCalledWith({
        lat: 40.7128,
        lon: -74.006,
        name: 'Unknown',
      });
    });
  });
});
