import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { DemoModeProvider, useDemoMode } from './DemoModeContext';

describe('DemoModeContext', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // Mock window.location
    delete window.location;
    window.location = { search: '' };
  });

  afterEach(() => {
    window.location = originalLocation;
    vi.clearAllMocks();
  });

  const wrapper = ({ children }) => <DemoModeProvider>{children}</DemoModeProvider>;

  describe('isDemoMode', () => {
    it('should return false when URL has no demo param', () => {
      window.location.search = '';
      const { result } = renderHook(() => useDemoMode(), { wrapper });
      expect(result.current.isDemoMode).toBe(false);
    });

    it('should return true when URL has demo=true', () => {
      window.location.search = '?demo=true';
      const { result } = renderHook(() => useDemoMode(), { wrapper });
      expect(result.current.isDemoMode).toBe(true);
    });

    it('should return false when URL has demo=false', () => {
      window.location.search = '?demo=false';
      const { result } = renderHook(() => useDemoMode(), { wrapper });
      expect(result.current.isDemoMode).toBe(false);
    });

    it('should return false when URL has demo param with other value', () => {
      window.location.search = '?demo=1';
      const { result } = renderHook(() => useDemoMode(), { wrapper });
      expect(result.current.isDemoMode).toBe(false);
    });

    it('should handle demo param with other params', () => {
      window.location.search = '?foo=bar&demo=true&baz=qux';
      const { result } = renderHook(() => useDemoMode(), { wrapper });
      expect(result.current.isDemoMode).toBe(true);
    });
  });

  describe('useDemoMode outside provider', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useDemoMode());
      }).toThrow('useDemoMode must be used within a DemoModeProvider');

      consoleSpy.mockRestore();
    });
  });
});
