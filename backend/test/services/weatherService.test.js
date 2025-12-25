import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import WeatherService from '../../services/weatherService.js';
import { getMockWeather, getMockSettings } from '../../services/mockData.js';

// Mock logger
vi.mock('../../utils/logger.js', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('WeatherService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    WeatherService.clearCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getWeather', () => {
    it('should return mock weather in demo mode', async () => {
      const location = { lat: 51.5074, lon: -0.1278 };
      const result = await WeatherService.getWeather(location, 'celsius', true);

      expect(result).toHaveProperty('current');
      expect(result).toHaveProperty('forecast');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return mock weather data structure in demo mode', async () => {
      const location = { lat: 51.5074, lon: -0.1278 };
      const result = await WeatherService.getWeather(location, 'celsius', true);

      expect(result.current).toHaveProperty('temperature');
      expect(result.current).toHaveProperty('condition');
      expect(result.current).toHaveProperty('windSpeed');
      expect(typeof result.current.condition).toBe('string');
      expect(Array.isArray(result.forecast)).toBe(true);
      expect(result.forecast.length).toBeGreaterThan(0);
    });

    it('should fetch from Open-Meteo API in production mode', async () => {
      const mockResponse = {
        current: {
          temperature_2m: 18,
          weather_code: 2,
          wind_speed_10m: 12,
          time: '2024-01-15T10:00',
        },
        daily: {
          time: ['2024-01-15', '2024-01-16'],
          weather_code: [2, 3],
          temperature_2m_max: [20, 18],
          temperature_2m_min: [14, 12],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const location = { lat: 51.5074, lon: -0.1278 };
      const result = await WeatherService.getWeather(location, 'celsius', false);

      expect(mockFetch).toHaveBeenCalled();
      expect(result.current.temperature).toBe(18);
      expect(result.forecast.length).toBe(2);
    });

    it('should build correct API URL with celsius units', async () => {
      const mockResponse = {
        current: {
          temperature_2m: 18,
          weather_code: 2,
          wind_speed_10m: 12,
          time: '2024-01-15T10:00',
        },
        daily: { time: [], weather_code: [], temperature_2m_max: [], temperature_2m_min: [] },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const location = { lat: 51.5074, lon: -0.1278 };
      await WeatherService.getWeather(location, 'celsius', false);

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('latitude=51.5074');
      expect(url).toContain('longitude=-0.1278');
      expect(url).toContain('temperature_unit=celsius');
    });

    it('should use fahrenheit when specified', async () => {
      const mockResponse = {
        current: {
          temperature_2m: 64,
          weather_code: 2,
          wind_speed_10m: 12,
          time: '2024-01-15T10:00',
        },
        daily: { time: [], weather_code: [], temperature_2m_max: [], temperature_2m_min: [] },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const location = { lat: 51.5074, lon: -0.1278 };
      await WeatherService.getWeather(location, 'fahrenheit', false);

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('temperature_unit=fahrenheit');
    });

    it('should throw error for API failures', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const location = { lat: 51.5074, lon: -0.1278 };

      await expect(WeatherService.getWeather(location, 'celsius', false)).rejects.toThrow();
    });

    it('should throw error for network failures', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const location = { lat: 51.5074, lon: -0.1278 };

      await expect(WeatherService.getWeather(location, 'celsius', false)).rejects.toThrow(
        'Network error'
      );
    });

    it('should cache weather data', async () => {
      const mockResponse = {
        current: {
          temperature_2m: 18,
          weather_code: 2,
          wind_speed_10m: 12,
          time: '2024-01-15T10:00',
        },
        daily: { time: [], weather_code: [], temperature_2m_max: [], temperature_2m_min: [] },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const location = { lat: 51.5074, lon: -0.1278 };

      // First call should fetch
      await WeatherService.getWeather(location, 'celsius', false);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await WeatherService.getWeather(location, 'celsius', false);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should use different cache keys for different locations', async () => {
      const mockResponse = {
        current: {
          temperature_2m: 18,
          weather_code: 2,
          wind_speed_10m: 12,
          time: '2024-01-15T10:00',
        },
        daily: { time: [], weather_code: [], temperature_2m_max: [], temperature_2m_min: [] },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const london = { lat: 51.5074, lon: -0.1278 };
      const paris = { lat: 48.8566, lon: 2.3522 };

      await WeatherService.getWeather(london, 'celsius', false);
      await WeatherService.getWeather(paris, 'celsius', false);

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should use different cache keys for different units', async () => {
      const mockResponse = {
        current: {
          temperature_2m: 18,
          weather_code: 2,
          wind_speed_10m: 12,
          time: '2024-01-15T10:00',
        },
        daily: { time: [], weather_code: [], temperature_2m_max: [], temperature_2m_min: [] },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const location = { lat: 51.5074, lon: -0.1278 };

      await WeatherService.getWeather(location, 'celsius', false);
      await WeatherService.getWeather(location, 'fahrenheit', false);

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('clearCache', () => {
    it('should clear weather cache', async () => {
      const mockResponse = {
        current: {
          temperature_2m: 18,
          weather_code: 2,
          wind_speed_10m: 12,
          time: '2024-01-15T10:00',
        },
        daily: { time: [], weather_code: [], temperature_2m_max: [], temperature_2m_min: [] },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const location = { lat: 51.5074, lon: -0.1278 };

      // First call
      await WeatherService.getWeather(location, 'celsius', false);

      // Clear cache
      WeatherService.clearCache();

      // Second call should fetch again
      await WeatherService.getWeather(location, 'celsius', false);

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
