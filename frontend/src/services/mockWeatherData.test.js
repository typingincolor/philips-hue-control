import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockWeatherData, mockWeatherApi } from './mockWeatherData';

describe('mockWeatherData', () => {
  describe('mockWeatherData object', () => {
    it('should have current weather data', () => {
      expect(mockWeatherData.current).toBeDefined();
      expect(mockWeatherData.current.temperature).toBeDefined();
      expect(mockWeatherData.current.weatherCode).toBeDefined();
      expect(mockWeatherData.current.windSpeed).toBeDefined();
    });

    it('should have 5-day forecast', () => {
      expect(mockWeatherData.forecast).toHaveLength(5);
      expect(mockWeatherData.forecast[0]).toHaveProperty('date');
      expect(mockWeatherData.forecast[0]).toHaveProperty('weatherCode');
      expect(mockWeatherData.forecast[0]).toHaveProperty('high');
      expect(mockWeatherData.forecast[0]).toHaveProperty('low');
    });

    it('should have location data', () => {
      expect(mockWeatherData.location).toBeDefined();
      expect(mockWeatherData.location.name).toBe('Demo City');
      expect(mockWeatherData.location.lat).toBeDefined();
      expect(mockWeatherData.location.lon).toBeDefined();
    });
  });

  describe('mockWeatherApi', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return mock weather data', async () => {
      const promise = mockWeatherApi.getWeatherData(51.5, -0.1);
      vi.advanceTimersByTime(300);
      const result = await promise;

      expect(result.current).toBeDefined();
      expect(result.forecast).toHaveLength(5);
    });

    it('should simulate network delay', async () => {
      const startTime = Date.now();
      const promise = mockWeatherApi.getWeatherData(51.5, -0.1);

      // Should not resolve immediately
      let resolved = false;
      promise.then(() => {
        resolved = true;
      });

      expect(resolved).toBe(false);

      vi.advanceTimersByTime(300);
      await promise;
    });

    it('should return location name from reverseGeocode', async () => {
      const promise = mockWeatherApi.reverseGeocode(51.5, -0.1);
      vi.advanceTimersByTime(100);
      const result = await promise;

      expect(result).toBe('Demo City');
    });
  });
});
