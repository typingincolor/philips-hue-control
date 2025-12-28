import { useState, useCallback, useEffect } from 'react';
import { hueApi } from '../services/hueApi';

/**
 * Default services configuration
 */
const DEFAULT_SERVICES = {
  hue: { enabled: true },
  hive: { enabled: false },
};

/**
 * Default settings (used while loading or on error)
 */
const DEFAULT_SETTINGS = {
  units: 'celsius',
  location: null,
  services: DEFAULT_SERVICES,
};

/**
 * Hook for managing settings via backend API
 * Settings are stored per-session on the backend
 * @param {boolean} enabled - Whether to fetch settings (controlled by parent)
 * @returns {object} { settings, isLoading, error, updateSettings }
 */
export const useSettings = (enabled = true) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch settings on mount
  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const data = await hueApi.getSettings();
        setSettings({
          units: data.units || 'celsius',
          location: data.location || null,
          services: data.services || DEFAULT_SERVICES,
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
  }, [enabled]);

  /**
   * Update settings (partial update supported)
   * @param {object} newSettings - Settings to merge
   */
  const updateSettings = useCallback(
    async (newSettings) => {
      // Optimistic update
      const previousSettings = settings;

      // Deep merge services if provided
      let mergedServices = settings.services || DEFAULT_SERVICES;
      if (newSettings.services) {
        mergedServices = {
          ...mergedServices,
          ...Object.fromEntries(
            Object.entries(newSettings.services).map(([key, value]) => [
              key,
              { ...mergedServices[key], ...value },
            ])
          ),
        };
      }

      const updated = {
        ...settings,
        ...newSettings,
        services: mergedServices,
      };
      setSettings(updated);

      try {
        await hueApi.updateSettings(updated);
      } catch (err) {
        // Rollback on error
        setSettings(previousSettings);
        setError(err.message);
      }
    },
    [settings]
  );

  return {
    settings,
    isLoading,
    error,
    updateSettings,
  };
};
