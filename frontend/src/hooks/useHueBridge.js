import { useState, useEffect } from 'react';
import { hueApi } from '../services/hueApi';

const STORAGE_KEYS = {
  BRIDGE_IP: 'hue_bridge_ip',
  USERNAME: 'hue_username'
};

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
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const lights = await hueApi.getLights(state.bridgeIp, state.username);

      setState(prev => ({
        ...prev,
        lights,
        loading: false,
        error: null
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
