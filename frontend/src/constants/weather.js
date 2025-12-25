/**
 * Weather configuration constants
 */
export const WEATHER_CONFIG = {
  API_BASE_URL: 'https://api.open-meteo.com/v1/forecast',
  GEOCODING_API_URL: 'https://nominatim.openstreetmap.org/reverse',
  POLLING_INTERVAL: 15 * 60 * 1000, // 15 minutes
  DEFAULT_UNITS: 'celsius',
  FORECAST_DAYS: 5,
};

/**
 * Weather code mappings from Open-Meteo API
 * See: https://open-meteo.com/en/docs
 */
export const WEATHER_CODES = {
  // Clear
  0: { description: 'Clear sky', icon: 'Sun' },

  // Mainly clear, partly cloudy, overcast
  1: { description: 'Mainly clear', icon: 'Sun' },
  2: { description: 'Partly cloudy', icon: 'CloudSun' },
  3: { description: 'Overcast', icon: 'Cloud' },

  // Fog
  45: { description: 'Fog', icon: 'Cloud' },
  48: { description: 'Depositing rime fog', icon: 'Cloud' },

  // Drizzle
  51: { description: 'Light drizzle', icon: 'CloudDrizzle' },
  53: { description: 'Moderate drizzle', icon: 'CloudDrizzle' },
  55: { description: 'Dense drizzle', icon: 'CloudDrizzle' },

  // Freezing drizzle
  56: { description: 'Light freezing drizzle', icon: 'CloudDrizzle' },
  57: { description: 'Dense freezing drizzle', icon: 'CloudDrizzle' },

  // Rain
  61: { description: 'Slight rain', icon: 'CloudRain' },
  63: { description: 'Moderate rain', icon: 'CloudRain' },
  65: { description: 'Heavy rain', icon: 'CloudRain' },

  // Freezing rain
  66: { description: 'Light freezing rain', icon: 'CloudRain' },
  67: { description: 'Heavy freezing rain', icon: 'CloudRain' },

  // Snow
  71: { description: 'Slight snow', icon: 'CloudSnow' },
  73: { description: 'Moderate snow', icon: 'CloudSnow' },
  75: { description: 'Heavy snow', icon: 'CloudSnow' },

  // Snow grains
  77: { description: 'Snow grains', icon: 'CloudSnow' },

  // Rain showers
  80: { description: 'Slight rain showers', icon: 'CloudRain' },
  81: { description: 'Moderate rain showers', icon: 'CloudRain' },
  82: { description: 'Violent rain showers', icon: 'CloudRain' },

  // Snow showers
  85: { description: 'Slight snow showers', icon: 'CloudSnow' },
  86: { description: 'Heavy snow showers', icon: 'CloudSnow' },

  // Thunderstorm
  95: { description: 'Thunderstorm', icon: 'CloudLightning' },
  96: { description: 'Thunderstorm with slight hail', icon: 'CloudLightning' },
  99: { description: 'Thunderstorm with heavy hail', icon: 'CloudLightning' },
};

/**
 * Get weather description for a weather code
 * @param {number} code - Weather code from Open-Meteo API
 * @returns {string} Human-readable description
 */
export const getWeatherDescription = (code) => {
  return WEATHER_CODES[code]?.description || 'Unknown';
};
