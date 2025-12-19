import { useState, useEffect } from 'react';
import { hueApi } from '../services/hueApi';
import { STORAGE_KEYS } from '../constants/storage';

export const useHueBridge = () => {
  const [state, setState] = useState({
    step: 'discovery', // 'discovery' | 'authentication' | 'connected'
    bridgeIp: null,
    username: null,
    lights: null,
    loading: false,
    error: null
  });

  // Load saved credentials on mount
  useEffect(() => {
    const savedIp = localStorage.getItem(STORAGE_KEYS.BRIDGE_IP);
    const savedUsername = localStorage.getItem(STORAGE_KEYS.USERNAME);

    if (savedIp && savedUsername) {
      setState(prev => ({
        ...prev,
        bridgeIp: savedIp,
        username: savedUsername,
        step: 'connected'
      }));
    }
  }, []);

  const setBridgeIp = (ip) => {
    localStorage.setItem(STORAGE_KEYS.BRIDGE_IP, ip);
    setState(prev => ({
      ...prev,
      bridgeIp: ip,
      step: 'authentication',
      error: null
    }));
  };

  const authenticate = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const username = await hueApi.createUser(state.bridgeIp);
      localStorage.setItem(STORAGE_KEYS.USERNAME, username);

      setState(prev => ({
        ...prev,
        username,
        loading: false,
        step: 'connected'
      }));
    } catch (error) {
      let errorMessage = error.message;

      // Handle CORS error specifically
      if (error.message === 'CORS_ERROR') {
        errorMessage = 'Browser security is blocking the request. See troubleshooting tips below.';
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
    }
  };

  const testConnection = async () => {
    // Connection testing is now handled by ConnectionTest component
    // This function is kept for compatibility but does nothing
    setState(prev => ({ ...prev, loading: false, error: null }));
  };

  const reset = () => {
    localStorage.removeItem(STORAGE_KEYS.BRIDGE_IP);
    localStorage.removeItem(STORAGE_KEYS.USERNAME);

    setState({
      step: 'discovery',
      bridgeIp: null,
      username: null,
      lights: null,
      loading: false,
      error: null
    });
  };

  return {
    ...state,
    setBridgeIp,
    authenticate,
    testConnection,
    reset
  };
};
