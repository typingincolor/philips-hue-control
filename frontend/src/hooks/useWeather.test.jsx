import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// Unmock the hook we're testing (globally mocked in setup.js)
vi.unmock('./useWeather');

import { useWeather } from './useWeather';
import { hueApi } from '../services/hueApi';

// Mock hueApi
vi.mock('../services/hueApi', () => ({
  hueApi: {
    getWeather: vi.fn(),
  },
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
    it('should return null weather when no sessionToken provided', () => {
      const { result } = renderHook(() => useWeather(null));

      expect(result.current.weather).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should start loading when sessionToken is provided', async () => {
      hueApi.getWeather.mockReturnValue(new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useWeather('test-token'));

      // Wait for useEffect to run
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });
    });
  });

  describe('fetching weather', () => {
    it('should fetch weather data when sessionToken is provided', async () => {
      hueApi.getWeather.mockResolvedValue(mockWeatherResponse);

      const { result } = renderHook(() => useWeather('test-token'));

      await waitFor(() => {
        expect(result.current.weather).toEqual(mockWeatherResponse);
      });

      expect(hueApi.getWeather).toHaveBeenCalledWith('test-token');
      expect(result.current.isLoading).toBe(false);
    });

    it('should set error on API failure', async () => {
      hueApi.getWeather.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useWeather('test-token'));

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to fetch weather data');
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should not set error when no location is set (404)', async () => {
      hueApi.getWeather.mockRejectedValue(new Error('404: No location set'));

      const { result } = renderHook(() => useWeather('test-token'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.weather).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('refetch', () => {
    it('should provide refetch function', async () => {
      hueApi.getWeather.mockResolvedValue(mockWeatherResponse);

      const { result } = renderHook(() => useWeather('test-token'));

      await waitFor(() => {
        expect(result.current.weather).not.toBeNull();
      });

      expect(hueApi.getWeather).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.refetch();
      });

      expect(hueApi.getWeather).toHaveBeenCalledTimes(2);
    });
  });

  describe('sessionToken changes', () => {
    it('should refetch when sessionToken changes', async () => {
      hueApi.getWeather.mockResolvedValue(mockWeatherResponse);

      const { result, rerender } = renderHook(({ token }) => useWeather(token), {
        initialProps: { token: 'token-1' },
      });

      await waitFor(() => {
        expect(result.current.weather).not.toBeNull();
      });

      expect(hueApi.getWeather).toHaveBeenCalledWith('token-1');

      rerender({ token: 'token-2' });

      await waitFor(() => {
        expect(hueApi.getWeather).toHaveBeenCalledWith('token-2');
      });
    });

    it('should clear weather when sessionToken becomes null', async () => {
      hueApi.getWeather.mockResolvedValue(mockWeatherResponse);

      const { result, rerender } = renderHook(({ token }) => useWeather(token), {
        initialProps: { token: 'test-token' },
      });

      await waitFor(() => {
        expect(result.current.weather).not.toBeNull();
      });

      rerender({ token: null });

      await waitFor(() => {
        expect(result.current.weather).toBeNull();
      });
    });
  });

  describe('polling', () => {
    it('should set up polling interval', async () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval');
      hueApi.getWeather.mockResolvedValue(mockWeatherResponse);

      const { result } = renderHook(() => useWeather('test-token'));

      await waitFor(() => {
        expect(result.current.weather).not.toBeNull();
      });

      expect(setIntervalSpy).toHaveBeenCalled();

      setIntervalSpy.mockRestore();
    });

    it('should clear polling interval on unmount', async () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      hueApi.getWeather.mockResolvedValue(mockWeatherResponse);

      const { result, unmount } = renderHook(() => useWeather('test-token'));

      await waitFor(() => {
        expect(result.current.weather).not.toBeNull();
      });

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
    });
  });
});
