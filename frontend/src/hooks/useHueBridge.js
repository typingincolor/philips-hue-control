import { useState, useEffect, useCallback } from 'react';
import { hueApi } from '../services/hueApi';
import { STORAGE_KEYS } from '../constants/storage';
import { useSession } from './useSession';
import { createLogger } from '../utils/logger';

const logger = createLogger('Auth');

// Helper to check for valid session synchronously (before first render)
const getInitialStep = () => {
  const savedToken = localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);
  const savedBridgeIp = localStorage.getItem(STORAGE_KEYS.BRIDGE_IP);
  const savedExpiry = localStorage.getItem(STORAGE_KEYS.SESSION_EXPIRES_AT);

  // Check if we have all required session fields
  if (savedToken && savedBridgeIp && savedExpiry) {
    const expiryTime = parseInt(savedExpiry, 10);
    const isExpired = Date.now() >= expiryTime;

    // If session is valid and not expired, start at 'connected'
    if (!isExpired) {
      return 'connected';
    }
  }

  // Otherwise, start at 'discovery'
  return 'discovery';
};

export const useHueBridge = () => {
  const [state, setState] = useState(() => {
    const initialStep = getInitialStep();
    const initialBridgeIp =
      initialStep === 'connected' ? localStorage.getItem(STORAGE_KEYS.BRIDGE_IP) : null;

    return {
      step: initialStep, // Initialize based on existing session
      bridgeIp: initialBridgeIp,
      username: null, // Legacy, kept for compatibility
      lights: null,
      loading: false,
      error: null
    };
  });

  const {
    sessionToken,
    bridgeIp: sessionBridgeIp,
    createSession,
    clearSession,
    isValid
  } = useSession();

  // Helper to migrate from legacy auth to session auth
  const migrateToSession = async (bridgeIp, username) => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const sessionInfo = await hueApi.createSession(bridgeIp, username);
      createSession(sessionInfo.sessionToken, bridgeIp, sessionInfo.expiresIn, username);
      setState(prev => ({
        ...prev,
        bridgeIp,
        loading: false,
        step: 'connected'
      }));
      logger.info('Successfully auto-recovered session');
    } catch (error) {
      logger.error('Failed to auto-recover session:', error);
      // Clear invalid credentials and require re-authentication
      localStorage.removeItem(STORAGE_KEYS.USERNAME);
      setState(prev => ({
        ...prev,
        bridgeIp,
        loading: false,
        step: 'authentication',
        error: 'Session recovery failed. Please authenticate again.'
      }));
    }
  };

  // Load saved credentials on mount (supports both session and legacy)
  useEffect(() => {
    // Check for existing session first (preferred)
    if (sessionToken && isValid) {
      setState(prev => ({
        ...prev,
        bridgeIp: sessionBridgeIp,
        step: 'connected'
      }));
      logger.info('Restored session from storage');
    }
    // Check if we have username but no valid session (e.g., after server restart)
    else {
      const savedIp = localStorage.getItem(STORAGE_KEYS.BRIDGE_IP);
      const savedUsername = localStorage.getItem(STORAGE_KEYS.USERNAME);

      if (savedIp && savedUsername) {
        logger.info('Found saved credentials, auto-recovering session...');
        // Automatically recreate session (no button press needed!)
        migrateToSession(savedIp, savedUsername);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Run only on mount
  }, []);

  const setBridgeIp = async ip => {
    localStorage.setItem(STORAGE_KEYS.BRIDGE_IP, ip);
    setState(prev => ({
      ...prev,
      bridgeIp: ip,
      loading: true,
      error: null
    }));

    // Try to connect using stored server-side credentials first
    try {
      logger.info('Trying to connect with stored credentials', { bridgeIp: ip });
      const sessionInfo = await hueApi.connect(ip);

      // Success! Create session and go to connected
      createSession(sessionInfo.sessionToken, ip, sessionInfo.expiresIn);
      setState(prev => ({
        ...prev,
        loading: false,
        step: 'connected'
      }));
      logger.info('Connected using stored credentials');
    } catch (error) {
      if (error.message === 'PAIRING_REQUIRED') {
        // No stored credentials, need to pair
        logger.info('Pairing required for this bridge');
        setState(prev => ({
          ...prev,
          loading: false,
          step: 'authentication'
        }));
      } else {
        // Other error
        logger.error('Connection failed', { error: error.message });
        setState(prev => ({
          ...prev,
          loading: false,
          step: 'authentication',
          error: error.message
        }));
      }
    }
  };

  const authenticate = useCallback(async () => {
    logger.info('Starting authentication', { bridgeIp: state.bridgeIp });
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Step 1: Pair with bridge (get username)
      logger.info('Step 1: Calling createUser...');
      const username = await hueApi.createUser(state.bridgeIp);
      logger.info('Pairing successful, creating session...', { username });

      // Step 2: Create session token
      const sessionInfo = await hueApi.createSession(state.bridgeIp, username);
      createSession(sessionInfo.sessionToken, state.bridgeIp, sessionInfo.expiresIn, username);

      setState(prev => ({
        ...prev,
        loading: false,
        step: 'connected'
      }));

      logger.info('Authentication complete with session token');
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
  }, [state.bridgeIp, createSession]);

  const testConnection = async () => {
    // Connection testing is now handled by ConnectionTest component
    // This function is kept for compatibility but does nothing
    setState(prev => ({ ...prev, loading: false, error: null }));
  };

  const reset = () => {
    // Clear session
    clearSession();

    // Clear legacy storage (for migration)
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

    logger.info('Reset authentication');
  };

  return {
    ...state,
    sessionToken, // Expose session token for API calls
    setBridgeIp,
    authenticate,
    testConnection,
    reset
  };
};
