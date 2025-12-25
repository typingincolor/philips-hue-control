import { useState, useEffect, useCallback, useRef } from 'react';
import { hueApi } from '../services/hueApi';

/**
 * Weather polling interval (15 minutes)
 */
const WEATHER_POLLING_INTERVAL = 15 * 60 * 1000;

/**
 * Hook for fetching weather data from backend
 * Backend uses session's stored location and units
 * @param {string} sessionToken - Session token for API authentication
 * @returns {object} { weather, isLoading, error, refetch }
 */
export const useWeather = (sessionToken) => {
  const [weather, setWeather] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchWeather = useCallback(async () => {
    if (!sessionToken) {
      setWeather(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await hueApi.getWeather(sessionToken);
      setWeather(data);
    } catch (err) {
      // 404 means no location set - not an error, just no weather
      if (err.message?.includes('404') || err.message?.includes('No location')) {
        setWeather(null);
        setError(null);
      } else {
        setError('Failed to fetch weather data');
      }
    } finally {
      setIsLoading(false);
    }
  }, [sessionToken]);

  // Fetch on mount and when sessionToken changes
  useEffect(() => {
    if (!sessionToken) {
      setWeather(null);
      setError(null);
      return;
    }

    fetchWeather();

    // Set up polling interval
    intervalRef.current = setInterval(() => {
      fetchWeather();
    }, WEATHER_POLLING_INTERVAL);

    // Cleanup on unmount or dependency change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchWeather, sessionToken]);

  return {
    weather,
    isLoading,
    error,
    refetch: fetchWeather,
  };
};
