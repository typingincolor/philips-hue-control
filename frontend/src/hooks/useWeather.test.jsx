import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useWeather } from './useWeather';
import { weatherApi } from '../services/weatherApi';
import { mockWeatherApi, mockWeatherData } from '../services/mockWeatherData';

// Mock weather APIs
vi.mock('../services/weatherApi', () => ({
  weatherApi: {
    getWeatherData: vi.fn(),
  },
}));

vi.mock('../services/mockWeatherData', () => ({
  mockWeatherApi: {
    getWeatherData: vi.fn(),
  },
  mockWeatherData: {
    current: {
      temperature: 18,
      weatherCode: 2,
      windSpeed: 12,
      time: '2024-01-01T12:00:00Z',
    },
    forecast: [{ date: '2024-01-01', weatherCode: 2, high: 20, low: 14 }],
  },
}));

// Mock DemoModeContext - default to non-demo mode
let mockDemoModeValue = {
  isDemoMode: false,
};

vi.mock('../context/DemoModeContext', () => ({
  useDemoMode: () => mockDemoModeValue,
}));

describe('useWeather', () => {
  const mockLocation = { lat: 51.5074, lon: -0.1278, name: 'London' };
  const mockWeatherResponse = {
    current: {
      temperature: 22,
      weatherCode: 1,
      windSpeed: 15,
      time: '2024-01-01T12:00:00Z',
    },
    forecast: [
      { date: '2024-01-01', weatherCode: 1, high: 24, low: 18 },
      { date: '2024-01-02', weatherCode: 2, high: 22, low: 16 },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset demo mode mock to default (non-demo mode)
    mockDemoModeValue = {
      isDemoMode: false,
    };
  });

  describe('initialization', () => {
    it('should return null weather when no location provided', () => {
      const { result } = renderHook(() => useWeather({ location: null, units: 'celsius' }));

      expect(result.current.weather).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should start loading when location is provided', () => {
      weatherApi.getWeatherData.mockReturnValue(new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useWeather({ location: mockLocation, units: 'celsius' }));

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('fetching weather', () => {
    it('should fetch weather data when location is provided', async () => {
      weatherApi.getWeatherData.mockResolvedValue(mockWeatherResponse);

      const { result } = renderHook(() => useWeather({ location: mockLocation, units: 'celsius' }));

      await waitFor(() => {
        expect(result.current.weather).toEqual(mockWeatherResponse);
      });

      expect(weatherApi.getWeatherData).toHaveBeenCalledWith(51.5074, -0.1278, 'celsius');
      expect(result.current.isLoading).toBe(false);
    });

    it('should pass units to API call', async () => {
      weatherApi.getWeatherData.mockResolvedValue(mockWeatherResponse);

      const { result } = renderHook(() =>
        useWeather({ location: mockLocation, units: 'fahrenheit' })
      );

      await waitFor(() => {
        expect(result.current.weather).not.toBeNull();
      });

      expect(weatherApi.getWeatherData).toHaveBeenCalledWith(51.5074, -0.1278, 'fahrenheit');
    });

    it('should set error on API failure', async () => {
      weatherApi.getWeatherData.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useWeather({ location: mockLocation, units: 'celsius' }));

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to fetch weather data');
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('demo mode (via context)', () => {
    it('should use mock API when context isDemoMode is true', async () => {
      mockDemoModeValue = { isDemoMode: true };
      mockWeatherApi.getWeatherData.mockResolvedValue(mockWeatherData);

      const { result } = renderHook(() => useWeather({ location: mockLocation, units: 'celsius' }));

      await waitFor(() => {
        expect(result.current.weather).not.toBeNull();
      });

      expect(mockWeatherApi.getWeatherData).toHaveBeenCalled();
      expect(weatherApi.getWeatherData).not.toHaveBeenCalled();
    });

    it('should use real API when context isDemoMode is false', async () => {
      mockDemoModeValue = { isDemoMode: false };
      weatherApi.getWeatherData.mockResolvedValue(mockWeatherResponse);

      const { result } = renderHook(() => useWeather({ location: mockLocation, units: 'celsius' }));

      await waitFor(() => {
        expect(result.current.weather).not.toBeNull();
      });

      expect(weatherApi.getWeatherData).toHaveBeenCalled();
      expect(mockWeatherApi.getWeatherData).not.toHaveBeenCalled();
    });
  });

  describe('refetch', () => {
    it('should provide refetch function', async () => {
      weatherApi.getWeatherData.mockResolvedValue(mockWeatherResponse);

      const { result } = renderHook(() => useWeather({ location: mockLocation, units: 'celsius' }));

      await waitFor(() => {
        expect(result.current.weather).not.toBeNull();
      });

      expect(weatherApi.getWeatherData).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.refetch();
      });

      expect(weatherApi.getWeatherData).toHaveBeenCalledTimes(2);
    });
  });

  describe('location changes', () => {
    it('should refetch when location changes', async () => {
      weatherApi.getWeatherData.mockResolvedValue(mockWeatherResponse);

      const { result, rerender } = renderHook(
        ({ location }) => useWeather({ location, units: 'celsius' }),
        { initialProps: { location: mockLocation } }
      );

      await waitFor(() => {
        expect(result.current.weather).not.toBeNull();
      });

      expect(weatherApi.getWeatherData).toHaveBeenCalledTimes(1);

      const newLocation = { lat: 40.7128, lon: -74.006, name: 'New York' };
      rerender({ location: newLocation });

      await waitFor(() => {
        expect(weatherApi.getWeatherData).toHaveBeenCalledWith(40.7128, -74.006, 'celsius');
      });
    });

    it('should clear weather when location becomes null', async () => {
      weatherApi.getWeatherData.mockResolvedValue(mockWeatherResponse);

      const { result, rerender } = renderHook(
        ({ location }) => useWeather({ location, units: 'celsius' }),
        { initialProps: { location: mockLocation } }
      );

      await waitFor(() => {
        expect(result.current.weather).not.toBeNull();
      });

      rerender({ location: null });

      await waitFor(() => {
        expect(result.current.weather).toBeNull();
      });
    });
  });

  describe('units changes', () => {
    it('should refetch when units change', async () => {
      weatherApi.getWeatherData.mockResolvedValue(mockWeatherResponse);

      const { result, rerender } = renderHook(
        ({ units }) => useWeather({ location: mockLocation, units }),
        { initialProps: { units: 'celsius' } }
      );

      await waitFor(() => {
        expect(result.current.weather).not.toBeNull();
      });

      expect(weatherApi.getWeatherData).toHaveBeenCalledWith(51.5074, -0.1278, 'celsius');

      rerender({ units: 'fahrenheit' });

      await waitFor(() => {
        expect(weatherApi.getWeatherData).toHaveBeenCalledWith(51.5074, -0.1278, 'fahrenheit');
      });
    });
  });

  describe('polling', () => {
    it('should set up polling interval', async () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval');
      weatherApi.getWeatherData.mockResolvedValue(mockWeatherResponse);

      const { result } = renderHook(() => useWeather({ location: mockLocation, units: 'celsius' }));

      await waitFor(() => {
        expect(result.current.weather).not.toBeNull();
      });

      expect(setIntervalSpy).toHaveBeenCalled();

      setIntervalSpy.mockRestore();
    });

    it('should clear polling interval on unmount', async () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      weatherApi.getWeatherData.mockResolvedValue(mockWeatherResponse);

      const { result, unmount } = renderHook(() =>
        useWeather({ location: mockLocation, units: 'celsius' })
      );

      await waitFor(() => {
        expect(result.current.weather).not.toBeNull();
      });

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
    });
  });
});
