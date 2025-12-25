import { useState, useEffect, useCallback, useRef } from 'react';
import { weatherApi } from '../services/weatherApi';
import { mockWeatherApi } from '../services/mockWeatherData';
import { WEATHER_CONFIG } from '../constants/weather';
import { useDemoMode } from '../context/DemoModeContext';

/**
 * Hook for fetching and managing weather data
 * Gets demo mode state from DemoModeContext
 * @param {object} options - Hook options
 * @param {object|null} options.location - Location object with lat, lon, name
 * @param {string} options.units - Temperature units ('celsius' or 'fahrenheit')
 * @returns {object} { weather, isLoading, error, refetch }
 */
export const useWeather = ({ location, units }) => {
  const { isDemoMode } = useDemoMode();
  const [weather, setWeather] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchWeather = useCallback(async () => {
    if (!location) {
      setWeather(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const api = isDemoMode ? mockWeatherApi : weatherApi;
      const data = await api.getWeatherData(location.lat, location.lon, units);
      setWeather(data);
    } catch {
      setError('Failed to fetch weather data');
    } finally {
      setIsLoading(false);
    }
  }, [location?.lat, location?.lon, isDemoMode, units]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    if (!location) {
      setWeather(null);
      setError(null);
      return;
    }

    fetchWeather();

    // Set up polling interval
    intervalRef.current = setInterval(() => {
      fetchWeather();
    }, WEATHER_CONFIG.POLLING_INTERVAL);

    // Cleanup on unmount or dependency change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchWeather, location]);

  return {
    weather,
    isLoading,
    error,
    refetch: fetchWeather,
  };
};
