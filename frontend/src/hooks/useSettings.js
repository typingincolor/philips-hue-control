import { useState, useCallback } from 'react';
import { STORAGE_KEYS } from '../constants/storage';

/**
 * Default settings
 */
const DEFAULT_SETTINGS = {
  units: 'celsius',
  weatherEnabled: true,
};

/**
 * Load settings from localStorage
 * @returns {object} Settings object
 */
const loadSettings = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.WEATHER_SETTINGS);
    if (!stored) {
      return DEFAULT_SETTINGS;
    }

    const parsed = JSON.parse(stored);
    // Merge with defaults to handle partial data
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    // Handle corrupted data
    return DEFAULT_SETTINGS;
  }
};

/**
 * Hook for managing weather settings with localStorage persistence
 * @returns {object} { settings, updateSettings, resetSettings }
 */
export const useSettings = () => {
  const [settings, setSettings] = useState(() => loadSettings());

  /**
   * Update settings (partial update supported)
   * @param {object} newSettings - Settings to merge
   */
  const updateSettings = useCallback((newSettings) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem(STORAGE_KEYS.WEATHER_SETTINGS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  /**
   * Reset settings to defaults
   */
  const resetSettings = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.WEATHER_SETTINGS);
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return {
    settings,
    updateSettings,
    resetSettings,
  };
};
