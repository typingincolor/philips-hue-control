import { fetchWeatherApi } from 'openmeteo';
import { WEATHER_CONFIG } from '../constants/weather';

/**
 * Weather API service using Open-Meteo SDK
 * Uses FlatBuffers for efficient data transfer
 */

// Helper function to create time ranges from Open-Meteo response
const range = (start, stop, step) =>
  Array.from({ length: (stop - start) / step }, (_, i) => start + i * step);

export const weatherApi = {
  /**
   * Fetch current weather and 5-day forecast
   * @param {number} latitude
   * @param {number} longitude
   * @param {string} units - 'celsius' or 'fahrenheit'
   * @returns {Promise<{current: object, forecast: array}>}
   */
  async getWeatherData(latitude, longitude, units = WEATHER_CONFIG.DEFAULT_UNITS) {
    const params = {
      latitude: [latitude],
      longitude: [longitude],
      current: ['temperature_2m', 'weather_code', 'wind_speed_10m'],
      daily: ['weather_code', 'temperature_2m_max', 'temperature_2m_min'],
      temperature_unit: units,
      timezone: 'auto',
      forecast_days: WEATHER_CONFIG.FORECAST_DAYS,
    };

    try {
      const responses = await fetchWeatherApi(WEATHER_CONFIG.API_BASE_URL, params);
      const response = responses[0];

      const utcOffsetSeconds = response.utcOffsetSeconds();
      const current = response.current();
      const daily = response.daily();

      // Build forecast array
      const dailyTimes = range(
        Number(daily.time()),
        Number(daily.timeEnd()),
        daily.interval()
      ).map((t) => new Date((t + utcOffsetSeconds) * 1000));

      const forecast = dailyTimes.map((date, index) => ({
        date: date.toISOString().split('T')[0],
        weatherCode: daily.variables(0).valuesArray()[index],
        high: Math.round(daily.variables(1).valuesArray()[index]),
        low: Math.round(daily.variables(2).valuesArray()[index]),
      }));

      return {
        current: {
          temperature: Math.round(current.variables(0).value()),
          weatherCode: current.variables(1).value(),
          windSpeed: Math.round(current.variables(2).value()),
          time: new Date((Number(current.time()) + utcOffsetSeconds) * 1000).toISOString(),
        },
        forecast,
      };
    } catch (error) {
      if (error.message?.includes('API')) {
        throw error;
      }
      throw new Error('Failed to fetch weather data');
    }
  },

  /**
   * Reverse geocode coordinates to get city name
   * Uses Nominatim (OpenStreetMap)
   * @param {number} latitude
   * @param {number} longitude
   * @returns {Promise<string>} City/town name
   */
  async reverseGeocode(latitude, longitude) {
    const params = new URLSearchParams({
      lat: latitude.toString(),
      lon: longitude.toString(),
      format: 'json',
    });

    const url = `${WEATHER_CONFIG.GEOCODING_API_URL}?${params}`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'HueControl/1.0',
        },
      });

      if (!response.ok) {
        return 'Unknown';
      }

      const data = await response.json();
      const address = data.address || {};

      // Try city, then town, then village
      return address.city || address.town || address.village || 'Unknown';
    } catch {
      return 'Unknown';
    }
  },
};
