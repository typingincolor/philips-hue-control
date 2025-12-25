/**
 * Mock weather data for demo mode
 */

// Helper to generate dates starting from today
const generateForecastDates = () => {
  const dates = [];
  const today = new Date();

  for (let i = 0; i < 5; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }

  return dates;
};

const forecastDates = generateForecastDates();

export const mockWeatherData = {
  current: {
    temperature: 18,
    weatherCode: 2,
    windSpeed: 12,
    time: new Date().toISOString(),
  },
  forecast: [
    { date: forecastDates[0], weatherCode: 2, high: 20, low: 14 },
    { date: forecastDates[1], weatherCode: 3, high: 18, low: 12 },
    { date: forecastDates[2], weatherCode: 61, high: 15, low: 10 },
    { date: forecastDates[3], weatherCode: 1, high: 19, low: 13 },
    { date: forecastDates[4], weatherCode: 0, high: 22, low: 15 },
  ],
  location: {
    name: 'Demo City',
    lat: 51.5074,
    lon: -0.1278,
  },
};

/**
 * Mock weather API for demo mode
 * Simulates network delay and returns mock data
 */
export const mockWeatherApi = {
  async getWeatherData() {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      current: mockWeatherData.current,
      forecast: mockWeatherData.forecast,
    };
  },

  async reverseGeocode() {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));
    return mockWeatherData.location.name;
  },
};
