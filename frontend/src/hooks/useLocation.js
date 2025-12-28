import { useState, useCallback } from 'react';
import * as settingsApi from '../services/settingsApi';

/**
 * Reverse geocode coordinates to get city name
 * Uses Nominatim (OpenStreetMap) API
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<string>} City/town name
 */
const reverseGeocode = async (latitude, longitude) => {
  const GEOCODING_API_URL = 'https://nominatim.openstreetmap.org/reverse';
  const params = new URLSearchParams({
    lat: latitude.toString(),
    lon: longitude.toString(),
    format: 'json',
  });

  try {
    const response = await fetch(`${GEOCODING_API_URL}?${params}`, {
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
 * Hook for managing user location with geolocation detection
 * Location is stored on the backend via settings API
 * @param {object|null} currentLocation - Current location from settings
 * @param {function} onLocationUpdate - Callback when location changes (to update settings)
 * @param {boolean} demoMode - Whether demo mode is enabled
 * @returns {object} { isDetecting, error, detectLocation, clearLocation }
 */
export const useLocation = (currentLocation, onLocationUpdate, demoMode = false) => {
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
      const name = await reverseGeocode(latitude, longitude);

      const newLocation = {
        lat: latitude,
        lon: longitude,
        name,
      };

      // Save to backend
      await settingsApi.updateLocation(newLocation, demoMode);

      // Notify parent to update settings
      if (onLocationUpdate) {
        onLocationUpdate(newLocation);
      }
    } catch (err) {
      if (err.code) {
        // Geolocation error
        setError(getGeolocationErrorMessage(err.code));
      } else {
        // API error
        setError(err.message || 'Failed to save location');
      }
    } finally {
      setIsDetecting(false);
    }
  }, [onLocationUpdate, demoMode]);

  /**
   * Clear stored location
   */
  const clearLocation = useCallback(async () => {
    try {
      await settingsApi.clearLocation(demoMode);

      // Notify parent to update settings
      if (onLocationUpdate) {
        onLocationUpdate(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to clear location');
    }
  }, [onLocationUpdate, demoMode]);

  return {
    location: currentLocation,
    isDetecting,
    error,
    detectLocation,
    clearLocation,
  };
};
