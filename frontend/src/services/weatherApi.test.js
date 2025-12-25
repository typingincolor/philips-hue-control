import { describe, it, expect, vi, beforeEach } from 'vitest';
import { weatherApi } from './weatherApi';
import { WEATHER_CONFIG } from '../constants/weather';

// Mock the openmeteo package
vi.mock('openmeteo', () => ({
  fetchWeatherApi: vi.fn(),
}));

// Mock global fetch for reverseGeocode tests
global.fetch = vi.fn();

describe('weatherApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getWeatherData', () => {
    // Helper to create mock Open-Meteo SDK response
    const createMockResponse = () => ({
      utcOffsetSeconds: () => 0,
      current: () => ({
        time: () => BigInt(Math.floor(Date.now() / 1000)),
        variables: (index) => {
          const values = [22.5, 2, 15];
          return { value: () => values[index] };
        },
      }),
      daily: () => ({
        time: () => BigInt(Math.floor(Date.now() / 1000)),
        timeEnd: () => BigInt(Math.floor(Date.now() / 1000) + 5 * 86400),
        interval: () => 86400,
        variables: (index) => {
          const arrays = [
            [2, 3, 1, 61, 0], // weatherCode
            [24, 22, 25, 20, 23], // max temp
            [18, 16, 17, 14, 15], // min temp
          ];
          return { valuesArray: () => arrays[index] };
        },
      }),
    });

    it('should fetch weather data using openmeteo SDK', async () => {
      const { fetchWeatherApi } = await import('openmeteo');
      fetchWeatherApi.mockResolvedValue([createMockResponse()]);

      const result = await weatherApi.getWeatherData(51.5074, -0.1278);

      expect(fetchWeatherApi).toHaveBeenCalledWith(
        WEATHER_CONFIG.API_BASE_URL,
        expect.objectContaining({
          latitude: [51.5074],
          longitude: [-0.1278],
          current: expect.arrayContaining(['temperature_2m', 'weather_code']),
          daily: expect.arrayContaining(['temperature_2m_max', 'temperature_2m_min']),
        })
      );
    });

    it('should return structured weather data', async () => {
      const { fetchWeatherApi } = await import('openmeteo');
      fetchWeatherApi.mockResolvedValue([createMockResponse()]);

      const result = await weatherApi.getWeatherData(51.5074, -0.1278);

      expect(result.current).toBeDefined();
      expect(result.current.temperature).toBe(23); // Rounded from 22.5
      expect(result.current.weatherCode).toBe(2);
      expect(result.current.windSpeed).toBe(15);
    });

    it('should return 5-day forecast', async () => {
      const { fetchWeatherApi } = await import('openmeteo');
      fetchWeatherApi.mockResolvedValue([createMockResponse()]);

      const result = await weatherApi.getWeatherData(51.5074, -0.1278);

      expect(result.forecast).toHaveLength(5);
      expect(result.forecast[0]).toHaveProperty('date');
      expect(result.forecast[0]).toHaveProperty('weatherCode');
      expect(result.forecast[0]).toHaveProperty('high');
      expect(result.forecast[0]).toHaveProperty('low');
    });

    it('should use celsius by default', async () => {
      const { fetchWeatherApi } = await import('openmeteo');
      fetchWeatherApi.mockResolvedValue([createMockResponse()]);

      await weatherApi.getWeatherData(51.5074, -0.1278);

      expect(fetchWeatherApi).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          temperature_unit: 'celsius',
        })
      );
    });

    it('should use fahrenheit when specified', async () => {
      const { fetchWeatherApi } = await import('openmeteo');
      fetchWeatherApi.mockResolvedValue([createMockResponse()]);

      await weatherApi.getWeatherData(51.5074, -0.1278, 'fahrenheit');

      expect(fetchWeatherApi).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          temperature_unit: 'fahrenheit',
        })
      );
    });

    it('should throw error on API failure', async () => {
      const { fetchWeatherApi } = await import('openmeteo');
      fetchWeatherApi.mockRejectedValue(new Error('Network error'));

      await expect(weatherApi.getWeatherData(51.5074, -0.1278)).rejects.toThrow(
        'Failed to fetch weather data'
      );
    });
  });

  describe('reverseGeocode', () => {
    const mockGeocodeResponse = {
      address: {
        city: 'London',
        town: undefined,
        village: undefined,
        country: 'United Kingdom',
      },
      display_name: 'London, Greater London, England, United Kingdom',
    };

    it('should fetch location name for coordinates', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockGeocodeResponse),
      });

      await weatherApi.reverseGeocode(51.5074, -0.1278);

      // Check that fetch was called with correct URL and options
      const [url] = fetch.mock.calls[0];
      expect(url).toContain(WEATHER_CONFIG.GEOCODING_API_URL);
      expect(url).toContain('lat=51.5074');
      expect(url).toContain('lon=-0.1278');
    });

    it('should return city name', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockGeocodeResponse),
      });

      const result = await weatherApi.reverseGeocode(51.5074, -0.1278);

      expect(result).toBe('London');
    });

    it('should fall back to town if city not available', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            address: { town: 'Brighton', country: 'UK' },
          }),
      });

      const result = await weatherApi.reverseGeocode(50.8225, -0.1372);

      expect(result).toBe('Brighton');
    });

    it('should fall back to village if town not available', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            address: { village: 'Cotswolds', country: 'UK' },
          }),
      });

      const result = await weatherApi.reverseGeocode(51.8, -1.8);

      expect(result).toBe('Cotswolds');
    });

    it('should return "Unknown" on error', async () => {
      fetch.mockRejectedValue(new Error('Network error'));

      const result = await weatherApi.reverseGeocode(51.5074, -0.1278);

      expect(result).toBe('Unknown');
    });

    it('should include User-Agent header for Nominatim', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockGeocodeResponse),
      });

      await weatherApi.reverseGeocode(51.5074, -0.1278);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.stringContaining('HueControl'),
          }),
        })
      );
    });
  });
});
