import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// Unmock the hook we're testing (globally mocked in setup.js)
vi.unmock('./useWeather');

import { useWeather } from './useWeather';
import * as weatherApi from '../services/weatherApi';

// Mock weatherApi
vi.mock('../services/weatherApi', () => ({
  getWeather: vi.fn(),
}));

describe('useWeather', () => {
  const mockWeatherResponse = {
    current: {
      temperature: 22,
      condition: 'Mainly clear',
      windSpeed: 15,
      time: '2024-01-01T12:00:00Z',
    },
    forecast: [
      { date: '2024-01-01', condition: 'Mainly clear', high: 24, low: 18 },
      { date: '2024-01-02', condition: 'Partly cloudy', high: 22, low: 16 },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should return null weather when not enabled', () => {
      const { result } = renderHook(() => useWeather(false));

      expect(result.current.weather).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should start loading when enabled', async () => {
      weatherApi.getWeather.mockReturnValue(new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useWeather(true));

      // Wait for useEffect to run
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });
    });
  });

  describe('fetching weather', () => {
    it('should fetch weather data when enabled', async () => {
      weatherApi.getWeather.mockResolvedValue(mockWeatherResponse);

      const { result } = renderHook(() => useWeather(true));

      await waitFor(() => {
        expect(result.current.weather).toEqual(mockWeatherResponse);
      });

      expect(weatherApi.getWeather).toHaveBeenCalledWith(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should set error on API failure', async () => {
      weatherApi.getWeather.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useWeather(true));

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to fetch weather data');
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should not set error when no location is set (404)', async () => {
      weatherApi.getWeather.mockRejectedValue(new Error('404: No location set'));

      const { result } = renderHook(() => useWeather(true));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.weather).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('refetch', () => {
    it('should provide refetch function', async () => {
      weatherApi.getWeather.mockResolvedValue(mockWeatherResponse);

      const { result } = renderHook(() => useWeather(true));

      await waitFor(() => {
        expect(result.current.weather).not.toBeNull();
      });

      expect(weatherApi.getWeather).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.refetch();
      });

      expect(weatherApi.getWeather).toHaveBeenCalledTimes(2);
    });
  });

  describe('enabled changes', () => {
    it('should refetch when enabled changes', async () => {
      weatherApi.getWeather.mockResolvedValue(mockWeatherResponse);

      const { result, rerender } = renderHook(({ enabled }) => useWeather(enabled), {
        initialProps: { enabled: true },
      });

      await waitFor(() => {
        expect(result.current.weather).not.toBeNull();
      });

      expect(weatherApi.getWeather).toHaveBeenCalledWith(false);

      rerender({ enabled: false });

      await waitFor(() => {
        expect(result.current.weather).toBeNull();
      });

      rerender({ enabled: true });

      await waitFor(() => {
        expect(weatherApi.getWeather).toHaveBeenCalledTimes(2);
      });
    });

    it('should clear weather when enabled becomes false', async () => {
      weatherApi.getWeather.mockResolvedValue(mockWeatherResponse);

      const { result, rerender } = renderHook(({ enabled }) => useWeather(enabled), {
        initialProps: { enabled: true },
      });

      await waitFor(() => {
        expect(result.current.weather).not.toBeNull();
      });

      rerender({ enabled: false });

      await waitFor(() => {
        expect(result.current.weather).toBeNull();
      });
    });
  });

  describe('polling', () => {
    it('should set up polling interval', async () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval');
      weatherApi.getWeather.mockResolvedValue(mockWeatherResponse);

      const { result } = renderHook(() => useWeather(true));

      await waitFor(() => {
        expect(result.current.weather).not.toBeNull();
      });

      expect(setIntervalSpy).toHaveBeenCalled();

      setIntervalSpy.mockRestore();
    });

    it('should clear polling interval on unmount', async () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      weatherApi.getWeather.mockResolvedValue(mockWeatherResponse);

      const { result, unmount } = renderHook(() => useWeather(true));

      await waitFor(() => {
        expect(result.current.weather).not.toBeNull();
      });

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
    });
  });

  describe('demo mode', () => {
    it('should pass demoMode to API calls', async () => {
      weatherApi.getWeather.mockResolvedValue(mockWeatherResponse);

      const { result } = renderHook(() => useWeather(true, true));

      await waitFor(() => {
        expect(result.current.weather).not.toBeNull();
      });

      expect(weatherApi.getWeather).toHaveBeenCalledWith(true);
    });
  });
});
