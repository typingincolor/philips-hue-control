/**
 * Weather Service
 * Fetches weather data from Open-Meteo API
 * Caches results for efficiency
 */

import { getMockWeather } from './mockData.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('WEATHER');

const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// In-memory cache: cacheKey -> { data, expiresAt }
const weatherCache = new Map();

/**
 * Build cache key from location and units
 */
const buildCacheKey = (location, units) =>
  `${location.lat.toFixed(4)},${location.lon.toFixed(4)}:${units}`;

/**
 * Check if cache entry is still valid
 */
const isCacheValid = (entry) => entry && Date.now() < entry.expiresAt;

class WeatherService {
  /**
   * Get weather data for a location
   * @param {object} location - { lat, lon }
   * @param {string} units - 'celsius' or 'fahrenheit'
   * @param {boolean} demoMode - Whether in demo mode
   * @returns {Promise<{current: object, forecast: array}>}
   */
  async getWeather(location, units = 'celsius', demoMode = false) {
    // Demo mode returns mock data immediately
    if (demoMode) {
      logger.debug('Returning mock weather for demo mode');
      return getMockWeather();
    }

    // Check cache
    const cacheKey = buildCacheKey(location, units);
    const cached = weatherCache.get(cacheKey);

    if (isCacheValid(cached)) {
      logger.debug('Returning cached weather', { cacheKey });
      return cached.data;
    }

    // Fetch from Open-Meteo API
    logger.debug('Fetching weather from API', { location, units });

    const params = new URLSearchParams({
      latitude: location.lat.toString(),
      longitude: location.lon.toString(),
      current: 'temperature_2m,weather_code,wind_speed_10m',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min',
      temperature_unit: units,
      timezone: 'auto',
      forecast_days: '5',
    });

    const url = `${WEATHER_API_URL}?${params}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Weather API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Transform to our format
      const result = this._transformResponse(data);

      // Cache the result
      weatherCache.set(cacheKey, {
        data: result,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });

      logger.debug('Cached weather data', { cacheKey });

      return result;
    } catch (error) {
      logger.error('Failed to fetch weather', { error: error.message, location });
      throw error;
    }
  }

  /**
   * Transform Open-Meteo API response to our format
   * @private
   */
  _transformResponse(apiData) {
    const { current, daily } = apiData;

    // Build forecast from daily data
    const forecast = (daily.time || []).map((date, index) => ({
      date,
      weatherCode: daily.weather_code[index],
      high: Math.round(daily.temperature_2m_max[index]),
      low: Math.round(daily.temperature_2m_min[index]),
    }));

    return {
      current: {
        temperature: Math.round(current.temperature_2m),
        weatherCode: current.weather_code,
        windSpeed: Math.round(current.wind_speed_10m),
        time: current.time,
      },
      forecast,
    };
  }

  /**
   * Clear weather cache
   */
  clearCache() {
    weatherCache.clear();
    logger.debug('Cleared weather cache');
  }
}

export default new WeatherService();
