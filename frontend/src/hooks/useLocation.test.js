import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLocation } from './useLocation';
import { STORAGE_KEYS } from '../constants/storage';
import { weatherApi } from '../services/weatherApi';

// Mock weatherApi
vi.mock('../services/weatherApi', () => ({
  weatherApi: {
    reverseGeocode: vi.fn(),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

describe('useLocation', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('initialization', () => {
    it('should return null location when no stored data', () => {
      const { result } = renderHook(() => useLocation());

      expect(result.current.location).toBeNull();
      expect(result.current.isDetecting).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should load location from localStorage on mount', () => {
      const storedLocation = { lat: 51.5074, lon: -0.1278, name: 'London' };
      localStorage.setItem(STORAGE_KEYS.WEATHER_LOCATION, JSON.stringify(storedLocation));

      const { result } = renderHook(() => useLocation());

      expect(result.current.location).toEqual(storedLocation);
    });

    it('should handle corrupted localStorage data', () => {
      localStorage.setItem(STORAGE_KEYS.WEATHER_LOCATION, 'not-valid-json');

      const { result } = renderHook(() => useLocation());

      expect(result.current.location).toBeNull();
    });

    it('should handle partial localStorage data', () => {
      // Missing name - should still load what's there
      localStorage.setItem(STORAGE_KEYS.WEATHER_LOCATION, JSON.stringify({ lat: 51.5074, lon: -0.1278 }));

      const { result } = renderHook(() => useLocation());

      expect(result.current.location.lat).toBe(51.5074);
      expect(result.current.location.lon).toBe(-0.1278);
    });
  });

  describe('detectLocation', () => {
    it('should set isDetecting to true while detecting', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation(() => {
        // Never resolves - simulates pending
      });

      const { result } = renderHook(() => useLocation());

      act(() => {
        result.current.detectLocation();
      });

      expect(result.current.isDetecting).toBe(true);
    });

    it('should get location from geolocation API', async () => {
      const mockPosition = {
        coords: {
          latitude: 51.5074,
          longitude: -0.1278,
        },
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      weatherApi.reverseGeocode.mockResolvedValue('London');

      const { result } = renderHook(() => useLocation());

      await act(async () => {
        await result.current.detectLocation();
      });

      expect(result.current.location).toEqual({
        lat: 51.5074,
        lon: -0.1278,
        name: 'London',
      });
      expect(result.current.isDetecting).toBe(false);
    });

    it('should call reverseGeocode to get city name', async () => {
      const mockPosition = {
        coords: {
          latitude: 40.7128,
          longitude: -74.006,
        },
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      weatherApi.reverseGeocode.mockResolvedValue('New York');

      const { result } = renderHook(() => useLocation());

      await act(async () => {
        await result.current.detectLocation();
      });

      expect(weatherApi.reverseGeocode).toHaveBeenCalledWith(40.7128, -74.006);
      expect(result.current.location.name).toBe('New York');
    });

    it('should persist detected location to localStorage', async () => {
      const mockPosition = {
        coords: {
          latitude: 51.5074,
          longitude: -0.1278,
        },
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      weatherApi.reverseGeocode.mockResolvedValue('London');

      const { result } = renderHook(() => useLocation());

      await act(async () => {
        await result.current.detectLocation();
      });

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.WEATHER_LOCATION));
      expect(stored).toEqual({
        lat: 51.5074,
        lon: -0.1278,
        name: 'London',
      });
    });

    it('should set error on geolocation failure', async () => {
      const mockError = { code: 1, message: 'User denied geolocation' };

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError);
      });

      const { result } = renderHook(() => useLocation());

      await act(async () => {
        await result.current.detectLocation();
      });

      expect(result.current.error).toBe('Location access denied');
      expect(result.current.isDetecting).toBe(false);
      expect(result.current.location).toBeNull();
    });

    it('should handle geolocation timeout error', async () => {
      const mockError = { code: 3, message: 'Timeout' };

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError);
      });

      const { result } = renderHook(() => useLocation());

      await act(async () => {
        await result.current.detectLocation();
      });

      expect(result.current.error).toBe('Location detection timed out');
    });

    it('should handle geolocation unavailable error', async () => {
      const mockError = { code: 2, message: 'Position unavailable' };

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError);
      });

      const { result } = renderHook(() => useLocation());

      await act(async () => {
        await result.current.detectLocation();
      });

      expect(result.current.error).toBe('Location unavailable');
    });

    it('should handle missing geolocation API', async () => {
      const originalGeolocation = navigator.geolocation;
      Object.defineProperty(navigator, 'geolocation', {
        value: undefined,
        writable: true,
      });

      const { result } = renderHook(() => useLocation());

      await act(async () => {
        await result.current.detectLocation();
      });

      expect(result.current.error).toBe('Geolocation not supported');

      // Restore
      Object.defineProperty(navigator, 'geolocation', {
        value: originalGeolocation,
        writable: true,
      });
    });

    it('should use "Unknown" if reverseGeocode fails', async () => {
      const mockPosition = {
        coords: {
          latitude: 51.5074,
          longitude: -0.1278,
        },
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      weatherApi.reverseGeocode.mockResolvedValue('Unknown');

      const { result } = renderHook(() => useLocation());

      await act(async () => {
        await result.current.detectLocation();
      });

      expect(result.current.location.name).toBe('Unknown');
    });
  });

  describe('setManualLocation', () => {
    it('should set location manually', () => {
      const { result } = renderHook(() => useLocation());

      act(() => {
        result.current.setManualLocation(48.8566, 2.3522, 'Paris');
      });

      expect(result.current.location).toEqual({
        lat: 48.8566,
        lon: 2.3522,
        name: 'Paris',
      });
    });

    it('should persist manual location to localStorage', () => {
      const { result } = renderHook(() => useLocation());

      act(() => {
        result.current.setManualLocation(48.8566, 2.3522, 'Paris');
      });

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.WEATHER_LOCATION));
      expect(stored).toEqual({
        lat: 48.8566,
        lon: 2.3522,
        name: 'Paris',
      });
    });

    it('should clear any previous error', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error({ code: 1, message: 'User denied' });
      });

      const { result } = renderHook(() => useLocation());

      await act(async () => {
        await result.current.detectLocation();
      });

      expect(result.current.error).not.toBeNull();

      act(() => {
        result.current.setManualLocation(48.8566, 2.3522, 'Paris');
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('clearLocation', () => {
    it('should clear location from state', () => {
      localStorage.setItem(
        STORAGE_KEYS.WEATHER_LOCATION,
        JSON.stringify({ lat: 51.5074, lon: -0.1278, name: 'London' })
      );

      const { result } = renderHook(() => useLocation());

      expect(result.current.location).not.toBeNull();

      act(() => {
        result.current.clearLocation();
      });

      expect(result.current.location).toBeNull();
    });

    it('should remove location from localStorage', () => {
      localStorage.setItem(
        STORAGE_KEYS.WEATHER_LOCATION,
        JSON.stringify({ lat: 51.5074, lon: -0.1278, name: 'London' })
      );

      const { result } = renderHook(() => useLocation());

      act(() => {
        result.current.clearLocation();
      });

      expect(localStorage.getItem(STORAGE_KEYS.WEATHER_LOCATION)).toBeNull();
    });
  });

  describe('persistence across remounts', () => {
    it('should preserve location after remount', () => {
      const { result, unmount } = renderHook(() => useLocation());

      act(() => {
        result.current.setManualLocation(51.5074, -0.1278, 'London');
      });

      unmount();

      const { result: newResult } = renderHook(() => useLocation());

      expect(newResult.current.location).toEqual({
        lat: 51.5074,
        lon: -0.1278,
        name: 'London',
      });
    });
  });
});
