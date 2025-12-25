import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSession } from './useSession';
import { STORAGE_KEYS } from '../constants/storage';
import { hueApi } from '../services/hueApi';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value ? value.toString() : '';
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock hueApi
vi.mock('../services/hueApi', () => ({
  hueApi: {
    refreshSession: vi.fn(),
  },
}));

describe('useSession', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  describe('Initialization', () => {
    it('should initialize with no session', () => {
      const { result } = renderHook(() => useSession());

      expect(result.current.sessionToken).toBeNull();
      expect(result.current.bridgeIp).toBeNull();
      expect(result.current.isExpired).toBe(false);
      expect(result.current.isValid).toBe(false);
      expect(result.current.timeRemaining).toBe(0);
    });

    it('should load valid session from localStorage', () => {
      const now = Date.now();
      const expiresAt = now + 86400000; // 24 hours from now

      localStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, 'test-token');
      localStorage.setItem(STORAGE_KEYS.BRIDGE_IP, '192.168.1.100');
      localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRES_AT, expiresAt.toString());

      const { result } = renderHook(() => useSession());

      expect(result.current.sessionToken).toBe('test-token');
      expect(result.current.bridgeIp).toBe('192.168.1.100');
      expect(result.current.isExpired).toBe(false);
      expect(result.current.isValid).toBe(true);
      expect(result.current.timeRemaining).toBeGreaterThan(0);
    });

    it('should clear expired session from localStorage', () => {
      const now = Date.now();
      const expiresAt = now - 1000; // Expired 1 second ago

      localStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, 'expired-token');
      localStorage.setItem(STORAGE_KEYS.BRIDGE_IP, '192.168.1.100');
      localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRES_AT, expiresAt.toString());

      const { result } = renderHook(() => useSession());

      expect(result.current.sessionToken).toBeNull();
      expect(result.current.isExpired).toBe(true);
      expect(localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN)).toBeNull();
    });

    it('should not load session if any field is missing', () => {
      localStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, 'test-token');
      localStorage.setItem(STORAGE_KEYS.BRIDGE_IP, '192.168.1.100');
      // Missing SESSION_EXPIRES_AT

      const { result } = renderHook(() => useSession());

      expect(result.current.sessionToken).toBeNull();
      expect(result.current.bridgeIp).toBeNull();
    });
  });

  describe('createSession', () => {
    it('should create a new session', () => {
      const { result } = renderHook(() => useSession());

      act(() => {
        result.current.createSession('new-token', '192.168.1.100', 86400);
      });

      expect(result.current.sessionToken).toBe('new-token');
      expect(result.current.bridgeIp).toBe('192.168.1.100');
      expect(result.current.isValid).toBe(true);
      expect(result.current.isExpired).toBe(false);

      // Check localStorage
      expect(localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN)).toBe('new-token');
      expect(localStorage.getItem(STORAGE_KEYS.BRIDGE_IP)).toBe('192.168.1.100');
      expect(localStorage.getItem(STORAGE_KEYS.SESSION_EXPIRES_AT)).toBeTruthy();
    });

    it('should calculate expiry time correctly', () => {
      const { result } = renderHook(() => useSession());
      const beforeCreate = Date.now();

      act(() => {
        result.current.createSession('new-token', '192.168.1.100', 3600); // 1 hour
      });

      const afterCreate = Date.now();
      const storedExpiry = parseInt(localStorage.getItem(STORAGE_KEYS.SESSION_EXPIRES_AT), 10);

      expect(storedExpiry).toBeGreaterThanOrEqual(beforeCreate + 3600000);
      expect(storedExpiry).toBeLessThanOrEqual(afterCreate + 3600000);
    });
  });

  describe('clearSession', () => {
    it('should clear session state and localStorage', () => {
      const { result } = renderHook(() => useSession());

      // Create a session first
      act(() => {
        result.current.createSession('test-token', '192.168.1.100', 86400);
      });

      expect(result.current.sessionToken).toBe('test-token');

      // Clear it
      act(() => {
        result.current.clearSession();
      });

      expect(result.current.sessionToken).toBeNull();
      expect(result.current.bridgeIp).toBeNull();
      expect(result.current.isExpired).toBe(false);
      expect(localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN)).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.SESSION_EXPIRES_AT)).toBeNull();
    });

    it('should not remove bridge IP from localStorage', () => {
      const { result } = renderHook(() => useSession());

      act(() => {
        result.current.createSession('test-token', '192.168.1.100', 86400);
      });

      act(() => {
        result.current.clearSession();
      });

      // Bridge IP should remain for re-auth
      expect(localStorage.getItem(STORAGE_KEYS.BRIDGE_IP)).toBe('192.168.1.100');
    });
  });

  describe('Session validation', () => {
    it('should return false for invalid session when no token', () => {
      const { result } = renderHook(() => useSession());

      expect(result.current.isValid).toBe(false);
    });

    it('should return true for valid session', () => {
      const { result } = renderHook(() => useSession());

      act(() => {
        result.current.createSession('test-token', '192.168.1.100', 86400);
      });

      expect(result.current.isValid).toBe(true);
    });

    it('should return false when session expires', () => {
      const { result } = renderHook(() => useSession());

      act(() => {
        result.current.createSession('test-token', '192.168.1.100', 1); // 1 second
      });

      expect(result.current.isValid).toBe(true);

      // Fast-forward past expiration
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.isValid).toBe(false);
    });
  });

  describe('Time remaining', () => {
    it('should return 0 when no session', () => {
      const { result } = renderHook(() => useSession());

      expect(result.current.timeRemaining).toBe(0);
    });

    it('should return correct time remaining', () => {
      const { result } = renderHook(() => useSession());

      act(() => {
        result.current.createSession('test-token', '192.168.1.100', 3600); // 1 hour
      });

      const remaining = result.current.timeRemaining;
      expect(remaining).toBeGreaterThan(3590); // Allow for some timing variance
      expect(remaining).toBeLessThanOrEqual(3600);
    });

    it('should decrease over time', () => {
      const { result } = renderHook(() => useSession());

      act(() => {
        result.current.createSession('test-token', '192.168.1.100', 100);
      });

      const initialRemaining = result.current.timeRemaining;

      act(() => {
        vi.advanceTimersByTime(10000); // 10 seconds
      });

      const laterRemaining = result.current.timeRemaining;
      expect(laterRemaining).toBeLessThan(initialRemaining);
    });

    it('should not return negative values', () => {
      const { result } = renderHook(() => useSession());

      act(() => {
        result.current.createSession('test-token', '192.168.1.100', 1);
      });

      act(() => {
        vi.advanceTimersByTime(5000); // 5 seconds (past expiration)
      });

      expect(result.current.timeRemaining).toBe(0);
    });
  });

  describe('Expiration checking', () => {
    it('should set up expiration check interval', () => {
      const { result, unmount } = renderHook(() => useSession());

      act(() => {
        result.current.createSession('test-token', '192.168.1.100', 600);
      });

      // Verify interval is set up by checking it gets cleared on unmount
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('Auto-refresh', () => {
    it('should schedule auto-refresh 5 minutes before expiration', async () => {
      hueApi.refreshSession.mockResolvedValue({
        sessionToken: 'refreshed-token',
        expiresIn: 86400,
      });

      const { result } = renderHook(() => useSession());

      act(() => {
        result.current.createSession('test-token', '192.168.1.100', 600); // 10 minutes
      });

      // Fast-forward to 5 minutes (refresh time)
      await act(async () => {
        vi.advanceTimersByTime(300000);
        await Promise.resolve(); // Flush microtasks
      });

      expect(hueApi.refreshSession).toHaveBeenCalledWith('test-token');
      expect(result.current.sessionToken).toBe('refreshed-token');
    });

    it('should not refresh if already refreshing', async () => {
      hueApi.refreshSession.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  sessionToken: 'refreshed-token',
                  expiresIn: 86400,
                }),
              1000
            )
          )
      );

      const { result } = renderHook(() => useSession());

      act(() => {
        result.current.createSession('test-token', '192.168.1.100', 600);
      });

      await act(async () => {
        vi.advanceTimersByTime(300000);
      });

      // Should only be called once
      expect(hueApi.refreshSession).toHaveBeenCalledTimes(1);
    });

    it('should handle refresh failure gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      hueApi.refreshSession.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useSession());

      act(() => {
        result.current.createSession('test-token', '192.168.1.100', 600);
      });

      await act(async () => {
        vi.advanceTimersByTime(300000);
        await Promise.resolve(); // Flush microtasks
      });

      expect(consoleError).toHaveBeenCalledWith(
        '[Session] Auto-refresh failed:',
        expect.any(Error)
      );

      // Session should still exist (let it expire naturally)
      expect(result.current.sessionToken).toBe('test-token');

      consoleError.mockRestore();
    });

    it('should schedule refresh immediately if already past refresh time', async () => {
      hueApi.refreshSession.mockResolvedValue({
        sessionToken: 'refreshed-token',
        expiresIn: 86400,
      });

      const now = Date.now();
      const expiresAt = now + 60000; // Expires in 1 minute (past 5-minute refresh threshold)

      localStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, 'test-token');
      localStorage.setItem(STORAGE_KEYS.BRIDGE_IP, '192.168.1.100');
      localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRES_AT, expiresAt.toString());

      renderHook(() => useSession());

      // Should schedule for next tick
      await act(async () => {
        vi.advanceTimersByTime(0);
        await Promise.resolve(); // Flush microtasks
      });

      expect(hueApi.refreshSession).toHaveBeenCalled();
    });

    it('should not schedule refresh if session is expired', () => {
      const now = Date.now();
      const expiresAt = now - 1000; // Already expired

      localStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, 'test-token');
      localStorage.setItem(STORAGE_KEYS.BRIDGE_IP, '192.168.1.100');
      localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRES_AT, expiresAt.toString());

      renderHook(() => useSession());

      expect(hueApi.refreshSession).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should clear expiration check interval on unmount', () => {
      const { result, unmount } = renderHook(() => useSession());

      act(() => {
        result.current.createSession('test-token', '192.168.1.100', 86400);
      });

      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('should clear refresh timeout on unmount', () => {
      const { result, unmount } = renderHook(() => useSession());

      act(() => {
        result.current.createSession('test-token', '192.168.1.100', 600);
      });

      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });
});
