import { useState, useCallback } from 'react';
import { STORAGE_KEYS } from '../constants/storage';
import { weatherApi } from '../services/weatherApi';

/**
 * Load location from localStorage
 * @returns {object|null} Location object or null
 */
const loadLocation = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.WEATHER_LOCATION);
    if (!stored) {
      return null;
    }
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

/**
 * Get error message from geolocation error code
 * @param {number} code - Geolocation error code
 * @returns {string} Human-readable error message
 */
const getGeolocationErrorMessage = (code) => {
  switch (code) {
    case 1:
      return 'Location access denied';
    case 2:
      return 'Location unavailable';
    case 3:
      return 'Location detection timed out';
    default:
      return 'Location detection failed';
  }
};

/**
 * Hook for managing user location with geolocation detection and localStorage persistence
 * @returns {object} { location, isDetecting, error, detectLocation, setManualLocation, clearLocation }
 */
export const useLocation = () => {
  const [location, setLocation] = useState(() => loadLocation());
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Detect location using browser geolocation API
   * @returns {Promise<void>}
   */
  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    setIsDetecting(true);
    setError(null);

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        });
      });

      const { latitude, longitude } = position.coords;

      // Get city name via reverse geocoding
      const name = await weatherApi.reverseGeocode(latitude, longitude);

      const newLocation = {
        lat: latitude,
        lon: longitude,
        name,
      };

      localStorage.setItem(STORAGE_KEYS.WEATHER_LOCATION, JSON.stringify(newLocation));
      setLocation(newLocation);
    } catch (err) {
      setError(getGeolocationErrorMessage(err.code));
      setLocation(null);
    } finally {
      setIsDetecting(false);
    }
  }, []);

  /**
   * Set location manually
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {string} name - Location name
   */
  const setManualLocation = useCallback((lat, lon, name) => {
    const newLocation = { lat, lon, name };
    localStorage.setItem(STORAGE_KEYS.WEATHER_LOCATION, JSON.stringify(newLocation));
    setLocation(newLocation);
    setError(null);
  }, []);

  /**
   * Clear stored location
   */
  const clearLocation = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.WEATHER_LOCATION);
    setLocation(null);
  }, []);

  return {
    location,
    isDetecting,
    error,
    detectLocation,
    setManualLocation,
    clearLocation,
  };
};
