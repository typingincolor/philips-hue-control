import { useState, useCallback } from 'react';
import {
  connectService,
  disconnectService,
  getServiceStatus,
  getService,
  verifyHive2fa,
  getHiveSchedules,
} from '../services/servicesApi';

/**
 * Hook for managing Hive heating system integration
 * Supports 2FA authentication flow
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

  // 2FA state
  const [requires2fa, setRequires2fa] = useState(false);
  const [twoFaSession, setTwoFaSession] = useState(null);
  const [pendingUsername, setPendingUsername] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [statusData, schedulesData] = await Promise.all([
        getServiceStatus('hive', demoMode),
        getHiveSchedules(demoMode),
      ]);
      setStatus(statusData);
      setSchedules(schedulesData);
    } catch (err) {
      setError(err.message || 'Failed to fetch Hive data');
    } finally {
      setIsLoading(false);
    }
  }, [demoMode]);

  const connect = useCallback(
    async (username, password) => {
      setIsConnecting(true);
      setError(null);
      setPendingUsername(username);

      try {
        const result = await connectService('hive', { username, password }, demoMode);

        // Handle 2FA requirement
        if (result.requires2fa) {
          setRequires2fa(true);
          setTwoFaSession(result.session);
          setIsConnecting(false);
          return;
        }

        if (!result.success) {
          setError(result.error || 'Failed to connect to Hive');
          setIsConnecting(false);
          return;
        }

        setIsConnected(true);
        setRequires2fa(false);
        setTwoFaSession(null);
        await fetchData();
      } catch (err) {
        setError(err.message || 'Failed to connect to Hive');
      } finally {
        setIsConnecting(false);
      }
    },
    [fetchData, demoMode]
  );

  const submit2faCode = useCallback(
    async (code) => {
      setIsVerifying(true);
      setError(null);

      try {
        const result = await verifyHive2fa(code, twoFaSession, pendingUsername, demoMode);

        if (!result.success) {
          setError(result.error || 'Invalid verification code');
          setIsVerifying(false);
          return;
        }

        setIsConnected(true);
        setRequires2fa(false);
        setTwoFaSession(null);
        await fetchData();
      } catch (err) {
        setError(err.message || 'Failed to verify code');
      } finally {
        setIsVerifying(false);
      }
    },
    [twoFaSession, pendingUsername, fetchData, demoMode]
  );

  const cancel2fa = useCallback(() => {
    setRequires2fa(false);
    setTwoFaSession(null);
    setError(null);
    // Keep pendingUsername so user can retry without retyping
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await disconnectService('hive', demoMode);
    } catch {
      // Ignore disconnect errors
    }
    setIsConnected(false);
    setStatus(null);
    setSchedules([]);
    setError(null);
    setRequires2fa(false);
    setTwoFaSession(null);
    setPendingUsername(null);
  }, [demoMode]);

  const refresh = useCallback(async () => {
    if (!isConnected && !demoMode) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const statusData = await getServiceStatus('hive', demoMode);
      setStatus(statusData);
    } catch (err) {
      setError(err.message || 'Failed to refresh Hive data');
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, demoMode]);

  const checkConnection = useCallback(async () => {
    try {
      const connectionStatus = await getService('hive', demoMode);
      setIsConnected(connectionStatus.connected);

      if (connectionStatus.connected) {
        try {
          await fetchData();
        } catch (err) {
          // If fetching data fails after connection check, session is invalid
          // This happens when refresh token is expired/invalid
          setIsConnected(false);
          setError('Hive session expired. Please reconnect in Settings.');
        }
      }
    } catch {
      setIsConnected(false);
    }
  }, [fetchData, demoMode]);

  return {
    // Connection state
    isConnected,
    isConnecting,
    isLoading,
    status,
    schedules,
    error,

    // 2FA state
    requires2fa,
    twoFaSession,
    pendingUsername,
    isVerifying,

    // Actions
    connect,
    disconnect,
    refresh,
    checkConnection,
    submit2faCode,
    cancel2fa,
    clearError,
  };
};
