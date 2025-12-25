import { useState, useCallback, useEffect } from 'react';
import { hueApi } from '../services/hueApi';

/**
 * Default settings (used while loading or on error)
 */
const DEFAULT_SETTINGS = {
  units: 'celsius',
  location: null,
};

/**
 * Hook for managing settings via backend API
 * Settings are stored per-session on the backend
 * @param {string} sessionToken - Session token for API authentication
 * @returns {object} { settings, isLoading, error, updateSettings }
 */
export const useSettings = (sessionToken) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch settings on mount
  useEffect(() => {
    if (!sessionToken) {
      setIsLoading(false);
      return;
    }

    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const data = await hueApi.getSettings(sessionToken);
        setSettings({
          units: data.units || 'celsius',
          location: data.location || null,
        });
        setError(null);
      } catch (err) {
        setError(err.message);
        // Keep default settings on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [sessionToken]);

  /**
   * Update settings (partial update supported)
   * @param {object} newSettings - Settings to merge
   */
  const updateSettings = useCallback(
    async (newSettings) => {
      if (!sessionToken) return;

      // Optimistic update
      const previousSettings = settings;
      const updated = { ...settings, ...newSettings };
      setSettings(updated);

      try {
        await hueApi.updateSettings(sessionToken, updated);
      } catch (err) {
        // Rollback on error
        setSettings(previousSettings);
        setError(err.message);
      }
    },
    [sessionToken, settings]
  );

  return {
    settings,
    isLoading,
    error,
    updateSettings,
  };
};
