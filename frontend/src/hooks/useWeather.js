import { useState, useEffect, useCallback, useRef } from 'react';
import * as weatherApi from '../services/weatherApi';

/**
 * Weather polling interval (15 minutes)
 */
const WEATHER_POLLING_INTERVAL = 15 * 60 * 1000;

/**
 * Hook for fetching weather data from backend
 * Backend uses session's stored location and units
 * @param {boolean} enabled - Whether to fetch weather (controlled by parent)
 * @param {boolean} demoMode - Whether demo mode is enabled
 * @returns {object} { weather, isLoading, error, refetch }
 */
export const useWeather = (enabled = true, demoMode = false) => {
  const [weather, setWeather] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchWeather = useCallback(async () => {
    if (!enabled) {
      setWeather(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await weatherApi.getWeather(demoMode);
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
  }, [enabled, demoMode]);

  // Fetch on mount and when enabled changes
  useEffect(() => {
    if (!enabled) {
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
  }, [fetchWeather, enabled]);

  return {
    weather,
    isLoading,
    error,
    refetch: fetchWeather,
  };
};
