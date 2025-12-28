import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS } from '../constants/storage';
import {
  refreshSession as apiRefreshSession,
  setSessionToken as setApiSessionToken,
  clearSessionToken as clearApiSessionToken,
} from '../services/authApi';
import { createLogger } from '../utils/logger';

const logger = createLogger('Session');

/**
 * Session management hook
 * Handles session token storage, validation, expiration, and auto-refresh
 */
// Initialize session state synchronously from localStorage
// This prevents race conditions with useHueBridge which depends on sessionToken
const getInitialSessionState = () => {
  const storedToken = localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);
  const storedBridgeIp = localStorage.getItem(STORAGE_KEYS.BRIDGE_IP);
  const storedExpiresAt = localStorage.getItem(STORAGE_KEYS.SESSION_EXPIRES_AT);

  if (storedToken && storedBridgeIp && storedExpiresAt) {
    const expiryTime = parseInt(storedExpiresAt, 10);
    const now = Date.now();

    if (now < expiryTime) {
      // Sync token to API layer for automatic header injection
      setApiSessionToken(storedToken);
      return {
        sessionToken: storedToken,
        bridgeIp: storedBridgeIp,
        expiresAt: expiryTime,
        isExpired: false,
      };
    } else {
      // Session expired, clear it
      localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.SESSION_EXPIRES_AT);
      clearApiSessionToken();
      return {
        sessionToken: null,
        bridgeIp: null,
        expiresAt: null,
        isExpired: true,
      };
    }
  }

  return {
    sessionToken: null,
    bridgeIp: null,
    expiresAt: null,
    isExpired: false,
  };
};

export const useSession = () => {
  const initialState = getInitialSessionState();
  const [sessionToken, setSessionToken] = useState(initialState.sessionToken);
  const [bridgeIp, setBridgeIp] = useState(initialState.bridgeIp);
  const [expiresAt, setExpiresAt] = useState(initialState.expiresAt);
  const [isExpired, setIsExpired] = useState(initialState.isExpired);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check for expiration periodically
  useEffect(() => {
    if (!expiresAt) return;

    const checkExpiration = () => {
      const now = Date.now();
      if (now >= expiresAt) {
        setIsExpired(true);
        // Clear session storage inline to avoid dependency
        setSessionToken(null);
        setBridgeIp(null);
        setExpiresAt(null);
        clearApiSessionToken();
        localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.SESSION_EXPIRES_AT);
      }
    };

    // Check every minute
    const intervalId = setInterval(checkExpiration, 60000);

    return () => clearInterval(intervalId);
  }, [expiresAt]);

  // Auto-refresh token 5 minutes before expiration
  useEffect(() => {
    if (!expiresAt || !sessionToken || !bridgeIp) return;

    const REFRESH_BEFORE_EXPIRY = 5 * 60 * 1000; // 5 minutes in ms
    const refreshTime = expiresAt - REFRESH_BEFORE_EXPIRY;
    const now = Date.now();

    // If already past refresh time, schedule for next tick (handles page reload)
    const delay = Math.max(0, refreshTime - now);

    // Only schedule if we haven't expired yet
    if (now < expiresAt) {
      logger.info(`Auto-refresh scheduled in ${Math.floor(delay / 1000)} seconds`);

      const timeoutId = setTimeout(async () => {
        if (isRefreshing) return; // Prevent duplicate refreshes

        setIsRefreshing(true);
        logger.info('Auto-refreshing token...');

        try {
          const newSession = await apiRefreshSession();
          createSession(newSession.sessionToken, bridgeIp, newSession.expiresIn);
          logger.info('Auto-refresh successful');
        } catch (error) {
          logger.error('Auto-refresh failed:', error);
          // Don't clear session immediately - let it expire naturally
          // User will see "session expired" message on next API call
        } finally {
          setIsRefreshing(false);
        }
      }, delay);

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- createSession is stable
  }, [expiresAt, sessionToken, bridgeIp, isRefreshing]);

  /**
   * Create a new session
   * @param {string} token - Session token from backend
   * @param {string} ip - Bridge IP address
   * @param {number} expiresIn - Seconds until expiration
   */
  const createSession = useCallback((token, ip, expiresIn) => {
    const expiryTime = Date.now() + expiresIn * 1000;

    // Store in state
    setSessionToken(token);
    setBridgeIp(ip);
    setExpiresAt(expiryTime);
    setIsExpired(false);

    // Sync token to API layer for automatic header injection
    setApiSessionToken(token);

    // Persist to localStorage
    localStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.BRIDGE_IP, ip);
    localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRES_AT, expiryTime.toString());

    logger.info('Created session, expires in', expiresIn, 'seconds');
  }, []);

  /**
   * Clear the current session
   */
  const clearSession = useCallback(() => {
    setSessionToken(null);
    setBridgeIp(null);
    setExpiresAt(null);
    setIsExpired(false);

    // Clear from API layer
    clearApiSessionToken();

    localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.SESSION_EXPIRES_AT);
    // Keep bridgeIp for re-auth
    // localStorage.removeItem(STORAGE_KEYS.BRIDGE_IP);

    logger.info('Cleared session');
  }, []);

  /**
   * Check if session is valid
   */
  const isValid = useCallback(() => {
    if (!sessionToken || !expiresAt) return false;
    return Date.now() < expiresAt;
  }, [sessionToken, expiresAt]);

  /**
   * Get time remaining until expiration (in seconds)
   */
  const getTimeRemaining = useCallback(() => {
    if (!expiresAt) return 0;
    const remaining = Math.floor((expiresAt - Date.now()) / 1000);
    return Math.max(0, remaining);
  }, [expiresAt]);

  return {
    sessionToken,
    bridgeIp,
    isExpired,
    isValid: isValid(),
    timeRemaining: getTimeRemaining(),
    createSession,
    clearSession,
  };
};
