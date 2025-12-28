/**
 * useHome Hook - Manages unified Home state
 */

import { useState, useEffect, useCallback } from 'react';
import * as homeApi from '../services/homeApi';

/**
 * Hook for managing the unified Home model
 * @param {boolean} demoMode - Whether demo mode is enabled
 * @returns {Object} Home state and actions
 */
export function useHome(demoMode = false) {
  const [home, setHome] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingDevices, setUpdatingDevices] = useState([]);
  const [activatingScene, setActivatingScene] = useState(null);

  /**
   * Fetch home data
   */
  const fetchHome = useCallback(async () => {
    try {
      const data = await homeApi.getHome(demoMode);
      setHome(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [demoMode]);

  /**
   * Initial fetch on mount
   */
  useEffect(() => {
    fetchHome();
  }, [fetchHome]);

  /**
   * Update a device state
   * @param {string} deviceId - Device ID
   * @param {Object} state - New state
   */
  const updateDevice = useCallback(
    async (deviceId, state) => {
      setUpdatingDevices((prev) => [...prev, deviceId]);
      setError(null);

      try {
        await homeApi.updateDevice(deviceId, state, demoMode);
        await fetchHome();
      } catch (err) {
        setError(err.message);
      } finally {
        setUpdatingDevices((prev) => prev.filter((id) => id !== deviceId));
      }
    },
    [demoMode, fetchHome]
  );

  /**
   * Activate a scene
   * @param {string} sceneId - Scene ID
   */
  const activateScene = useCallback(
    async (sceneId) => {
      setActivatingScene(sceneId);
      setError(null);

      try {
        await homeApi.activateScene(sceneId, demoMode);
        await fetchHome();
      } catch (err) {
        setError(err.message);
      } finally {
        setActivatingScene(null);
      }
    },
    [demoMode, fetchHome]
  );

  /**
   * Refresh home data
   */
  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchHome();
  }, [fetchHome]);

  return {
    home,
    isLoading,
    error,
    updatingDevices,
    activatingScene,
    updateDevice,
    activateScene,
    refresh,
  };
}
