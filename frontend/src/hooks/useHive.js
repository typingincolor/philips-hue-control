import { useState, useCallback } from 'react';
import {
  connectHive,
  disconnectHive,
  getHiveStatus,
  getHiveSchedules,
  getHiveConnectionStatus,
} from '../services/hueApi';

/**
 * Hook for managing Hive heating system integration
 * @param {boolean} demoMode - Whether in demo mode (uses mock data)
 * @returns {object} Hive state and control functions
 */
export const useHive = (demoMode = false) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [statusData, schedulesData] = await Promise.all([getHiveStatus(), getHiveSchedules()]);
      setStatus(statusData);
      setSchedules(schedulesData);
    } catch (err) {
      setError(err.message || 'Failed to fetch Hive data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const connect = useCallback(
    async (username, password) => {
      setIsConnecting(true);
      setError(null);

      try {
        const result = await connectHive(username, password);

        if (!result.success) {
          setError(result.error || 'Failed to connect to Hive');
          return;
        }

        setIsConnected(true);
        await fetchData();
      } catch (err) {
        setError(err.message || 'Failed to connect to Hive');
      } finally {
        setIsConnecting(false);
      }
    },
    [fetchData]
  );

  const disconnect = useCallback(async () => {
    try {
      await disconnectHive();
    } catch {
      // Ignore disconnect errors
    }
    setIsConnected(false);
    setStatus(null);
    setSchedules([]);
    setError(null);
  }, []);

  const refresh = useCallback(async () => {
    if (!isConnected && !demoMode) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const statusData = await getHiveStatus();
      setStatus(statusData);
    } catch (err) {
      setError(err.message || 'Failed to refresh Hive data');
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, demoMode]);

  const checkConnection = useCallback(async () => {
    try {
      const connectionStatus = await getHiveConnectionStatus();
      setIsConnected(connectionStatus.connected);

      if (connectionStatus.connected) {
        await fetchData();
      }
    } catch {
      setIsConnected(false);
    }
  }, [fetchData]);

  return {
    isConnected,
    isConnecting,
    isLoading,
    status,
    schedules,
    error,
    connect,
    disconnect,
    refresh,
    checkConnection,
  };
};
