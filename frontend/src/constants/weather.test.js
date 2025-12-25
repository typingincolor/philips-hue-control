import { describe, it, expect } from 'vitest';
import { WEATHER_CONFIG, WEATHER_CODES, getWeatherDescription } from './weather';

describe('weather constants', () => {
  describe('WEATHER_CONFIG', () => {
    it('should have API base URL', () => {
      expect(WEATHER_CONFIG.API_BASE_URL).toBe('https://api.open-meteo.com/v1/forecast');
    });

    it('should have geocoding API URL', () => {
      expect(WEATHER_CONFIG.GEOCODING_API_URL).toBe(
        'https://nominatim.openstreetmap.org/reverse'
      );
    });

    it('should have polling interval of 15 minutes', () => {
      expect(WEATHER_CONFIG.POLLING_INTERVAL).toBe(15 * 60 * 1000);
    });

    it('should have default units as celsius', () => {
      expect(WEATHER_CONFIG.DEFAULT_UNITS).toBe('celsius');
    });

    it('should have forecast days of 5', () => {
      expect(WEATHER_CONFIG.FORECAST_DAYS).toBe(5);
    });
  });

  describe('WEATHER_CODES', () => {
    it('should have clear sky code 0', () => {
      expect(WEATHER_CODES[0]).toEqual({
        description: 'Clear sky',
        icon: 'Sun',
      });
    });

    it('should have cloudy codes 1-3', () => {
      expect(WEATHER_CODES[1].description).toBe('Mainly clear');
      expect(WEATHER_CODES[2].description).toBe('Partly cloudy');
      expect(WEATHER_CODES[3].description).toBe('Overcast');
    });

    it('should have rain codes', () => {
      expect(WEATHER_CODES[61].description).toBe('Slight rain');
      expect(WEATHER_CODES[61].icon).toBe('CloudRain');
    });

    it('should have snow codes', () => {
      expect(WEATHER_CODES[71].description).toBe('Slight snow');
      expect(WEATHER_CODES[71].icon).toBe('CloudSnow');
    });

    it('should have thunderstorm code', () => {
      expect(WEATHER_CODES[95].description).toBe('Thunderstorm');
      expect(WEATHER_CODES[95].icon).toBe('CloudLightning');
    });
  });

  describe('getWeatherDescription', () => {
    it('should return description for known code', () => {
      expect(getWeatherDescription(0)).toBe('Clear sky');
      expect(getWeatherDescription(61)).toBe('Slight rain');
    });

    it('should return "Unknown" for unknown code', () => {
      expect(getWeatherDescription(999)).toBe('Unknown');
    });

    it('should return "Unknown" for undefined code', () => {
      expect(getWeatherDescription(undefined)).toBe('Unknown');
    });
  });
});
