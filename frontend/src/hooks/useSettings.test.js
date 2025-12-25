import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSettings } from './useSettings';
import { STORAGE_KEYS } from '../constants/storage';

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

describe('useSettings', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('initialization', () => {
    it('should return default settings when no localStorage data', () => {
      const { result } = renderHook(() => useSettings());

      expect(result.current.settings).toEqual({
        units: 'celsius',
        weatherEnabled: true,
      });
    });

    it('should load settings from localStorage on mount', () => {
      localStorage.setItem(
        STORAGE_KEYS.WEATHER_SETTINGS,
        JSON.stringify({ units: 'fahrenheit', weatherEnabled: false })
      );

      const { result } = renderHook(() => useSettings());

      expect(result.current.settings.units).toBe('fahrenheit');
      expect(result.current.settings.weatherEnabled).toBe(false);
    });

    it('should handle corrupted localStorage data', () => {
      localStorage.setItem(STORAGE_KEYS.WEATHER_SETTINGS, 'not-valid-json');

      const { result } = renderHook(() => useSettings());

      // Should fall back to defaults
      expect(result.current.settings).toEqual({
        units: 'celsius',
        weatherEnabled: true,
      });
    });

    it('should merge partial localStorage data with defaults', () => {
      localStorage.setItem(STORAGE_KEYS.WEATHER_SETTINGS, JSON.stringify({ units: 'fahrenheit' }));

      const { result } = renderHook(() => useSettings());

      expect(result.current.settings.units).toBe('fahrenheit');
      expect(result.current.settings.weatherEnabled).toBe(true); // Default
    });
  });

  describe('updateSettings', () => {
    it('should update settings in state', () => {
      const { result } = renderHook(() => useSettings());

      act(() => {
        result.current.updateSettings({ units: 'fahrenheit' });
      });

      expect(result.current.settings.units).toBe('fahrenheit');
    });

    it('should persist settings to localStorage', () => {
      const { result } = renderHook(() => useSettings());

      act(() => {
        result.current.updateSettings({ units: 'fahrenheit' });
      });

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.WEATHER_SETTINGS));
      expect(stored.units).toBe('fahrenheit');
    });

    it('should merge partial updates with existing settings', () => {
      const { result } = renderHook(() => useSettings());

      act(() => {
        result.current.updateSettings({ weatherEnabled: false });
      });

      expect(result.current.settings.units).toBe('celsius'); // Unchanged
      expect(result.current.settings.weatherEnabled).toBe(false); // Updated
    });

    it('should update multiple settings at once', () => {
      const { result } = renderHook(() => useSettings());

      act(() => {
        result.current.updateSettings({
          units: 'fahrenheit',
          weatherEnabled: false,
        });
      });

      expect(result.current.settings.units).toBe('fahrenheit');
      expect(result.current.settings.weatherEnabled).toBe(false);
    });
  });

  describe('resetSettings', () => {
    it('should reset to default settings', () => {
      const { result } = renderHook(() => useSettings());

      act(() => {
        result.current.updateSettings({ units: 'fahrenheit', weatherEnabled: false });
      });

      act(() => {
        result.current.resetSettings();
      });

      expect(result.current.settings).toEqual({
        units: 'celsius',
        weatherEnabled: true,
      });
    });

    it('should clear settings from localStorage', () => {
      const { result } = renderHook(() => useSettings());

      act(() => {
        result.current.updateSettings({ units: 'fahrenheit' });
      });

      act(() => {
        result.current.resetSettings();
      });

      const stored = localStorage.getItem(STORAGE_KEYS.WEATHER_SETTINGS);
      expect(stored).toBeNull();
    });
  });

  describe('persistence across remounts', () => {
    it('should preserve settings after remount', () => {
      const { result, unmount } = renderHook(() => useSettings());

      act(() => {
        result.current.updateSettings({ units: 'fahrenheit' });
      });

      unmount();

      const { result: newResult } = renderHook(() => useSettings());

      expect(newResult.current.settings.units).toBe('fahrenheit');
    });
  });
});
