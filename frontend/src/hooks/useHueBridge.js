import { useState, useEffect, useCallback } from 'react';
import { hueApi } from '../services/hueApi';
import { STORAGE_KEYS } from '../constants/storage';
import { useSession } from './useSession';
import { createLogger } from '../utils/logger';

const logger = createLogger('Auth');

// Helper to check if we need to restore a session (before first render)
const getInitialStep = () => {
  const savedToken = localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);
  const savedBridgeIp = localStorage.getItem(STORAGE_KEYS.BRIDGE_IP);
  const savedExpiry = localStorage.getItem(STORAGE_KEYS.SESSION_EXPIRES_AT);

  // Check if we have session data that needs restoration
  if (savedToken && savedBridgeIp && savedExpiry) {
    const expiryTime = parseInt(savedExpiry, 10);
    const isExpired = Date.now() >= expiryTime;

    // If session appears valid, start at 'restoring' (will validate with server)
    if (!isExpired) {
      return 'restoring';
    }
  }

  // Otherwise, start at 'settings' (deferred service activation)
  return 'settings';
};

export const useHueBridge = () => {
  const [state, setState] = useState(() => {
    const initialStep = getInitialStep();
    const initialBridgeIp =
      initialStep === 'connected' ? localStorage.getItem(STORAGE_KEYS.BRIDGE_IP) : null;

    return {
      step: initialStep, // Initialize based on existing session
      bridgeIp: initialBridgeIp,
      lights: null,
      loading: false,
      error: null,
    };
  });

  const {
    sessionToken,
    bridgeIp: sessionBridgeIp,
    createSession,
    clearSession,
    isValid,
  } = useSession();

  // Handle session restoration on mount
  useEffect(() => {
    const restoreSession = async () => {
      // Only run when we're in the 'restoring' state
      if (state.step !== 'restoring') return;

      const savedIp = localStorage.getItem(STORAGE_KEYS.BRIDGE_IP);

      // Wait for useSession to load the token
      if (sessionToken && isValid) {
        // Validate session with server by making a test request
        try {
          logger.info('Validating session with server...');
          await hueApi.getDashboard();
          setState((prev) => ({
            ...prev,
            bridgeIp: sessionBridgeIp,
            step: 'connected',
          }));
          logger.info('Session restored successfully');
          return;
        } catch (error) {
          logger.warn('Session invalid on server, trying stored credentials...', error.message);
          // Session expired on server, try to reconnect
        }
      }

      // Session not valid, try to connect using server-side stored credentials
      if (savedIp) {
        try {
          logger.info('Trying to connect with stored server credentials', { bridgeIp: savedIp });
          const sessionInfo = await hueApi.connect(savedIp);
          createSession(sessionInfo.sessionToken, savedIp, sessionInfo.expiresIn);
          setState((prev) => ({
            ...prev,
            bridgeIp: savedIp,
            step: 'connected',
          }));
          logger.info('Connected using stored server credentials');
          return;
        } catch (error) {
          if (error.message === 'PAIRING_REQUIRED') {
            logger.info('No stored server credentials, pairing required');
          } else {
            logger.error('Connect failed', error.message);
          }
        }

        // No recovery options, go to authentication
        setState((prev) => ({
          ...prev,
          bridgeIp: savedIp,
          step: 'authentication',
        }));
      } else {
        // No saved bridge IP, go to settings
        setState((prev) => ({
          ...prev,
          step: 'settings',
        }));
      }
    };

    restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Run when step or sessionToken changes
  }, [state.step, sessionToken, isValid]);

  const setBridgeIp = async (ip) => {
    localStorage.setItem(STORAGE_KEYS.BRIDGE_IP, ip);
    setState((prev) => ({
      ...prev,
      bridgeIp: ip,
      loading: true,
      error: null,
    }));

    // Try to connect using stored server-side credentials first
    try {
      logger.info('Trying to connect with stored credentials', { bridgeIp: ip });
      const sessionInfo = await hueApi.connect(ip);

      // Success! Create session and go to connected
      createSession(sessionInfo.sessionToken, ip, sessionInfo.expiresIn);
      setState((prev) => ({
        ...prev,
        loading: false,
        step: 'connected',
      }));
      logger.info('Connected using stored credentials');
    } catch (error) {
      if (error.message === 'PAIRING_REQUIRED') {
        // No stored credentials, need to pair
        logger.info('Pairing required for this bridge');
        setState((prev) => ({
          ...prev,
          loading: false,
          step: 'authentication',
        }));
      } else {
        // Other error
        logger.error('Connection failed', { error: error.message });
        setState((prev) => ({
          ...prev,
          loading: false,
          step: 'authentication',
          error: error.message,
        }));
      }
    }
  };

  const authenticate = useCallback(async () => {
    logger.info('Starting authentication', { bridgeIp: state.bridgeIp });
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Step 1: Pair with bridge (get username)
      logger.info('Step 1: Calling createUser...');
      const username = await hueApi.createUser(state.bridgeIp);
      logger.info('Pairing successful, creating session...', { username });

      // Step 2: Create session token
      const sessionInfo = await hueApi.createSession(state.bridgeIp, username);
      createSession(sessionInfo.sessionToken, state.bridgeIp, sessionInfo.expiresIn);

      setState((prev) => ({
        ...prev,
        loading: false,
        step: 'connected',
      }));

      logger.info('Authentication complete with session token');
    } catch (error) {
      let errorMessage = error.message;

      // Handle CORS error specifically
      if (error.message === 'CORS_ERROR') {
        errorMessage = 'Browser security is blocking the request. See troubleshooting tips below.';
      }

      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, [state.bridgeIp, createSession]);

  const reset = () => {
    clearSession();
    localStorage.removeItem(STORAGE_KEYS.BRIDGE_IP);

    setState({
      step: 'settings',
      bridgeIp: null,
      lights: null,
      loading: false,
      error: null,
    });

    logger.info('Reset authentication');
  };

  // Transition from settings to discovery (when user enables Hue)
  const enableHue = useCallback(() => {
    setState((prev) => ({
      ...prev,
      step: 'discovery',
    }));
    logger.info('Enabling Hue - starting discovery');
  }, []);

  return {
    ...state,
    sessionToken,
    setBridgeIp,
    authenticate,
    reset,
    enableHue,
  };
};
