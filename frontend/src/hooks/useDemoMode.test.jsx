import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDemoMode } from './useDemoMode';
import { DemoModeProvider } from '../context/DemoModeContext';

describe('useDemoMode', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // Mock window.location
    delete window.location;
    window.location = { search: '' };
  });

  afterEach(() => {
    // Restore original location
    window.location = originalLocation;
  });

  const wrapper = ({ children }) => <DemoModeProvider>{children}</DemoModeProvider>;

  it('should return false when demo param is not present', () => {
    window.location.search = '';
    const { result } = renderHook(() => useDemoMode(), { wrapper });
    expect(result.current).toBe(false);
  });

  it('should return false when demo param is false', () => {
    window.location.search = '?demo=false';
    const { result } = renderHook(() => useDemoMode(), { wrapper });
    expect(result.current).toBe(false);
  });

  it('should return true when demo param is true', () => {
    window.location.search = '?demo=true';
    const { result } = renderHook(() => useDemoMode(), { wrapper });
    expect(result.current).toBe(true);
  });

  it('should return false when demo param has other value', () => {
    window.location.search = '?demo=yes';
    const { result } = renderHook(() => useDemoMode(), { wrapper });
    expect(result.current).toBe(false);
  });

  it('should work with multiple query parameters', () => {
    window.location.search = '?foo=bar&demo=true&baz=qux';
    const { result } = renderHook(() => useDemoMode(), { wrapper });
    expect(result.current).toBe(true);
  });

  it('should handle demo as first parameter', () => {
    window.location.search = '?demo=true&other=value';
    const { result } = renderHook(() => useDemoMode(), { wrapper });
    expect(result.current).toBe(true);
  });

  it('should handle demo as last parameter', () => {
    window.location.search = '?other=value&demo=true';
    const { result } = renderHook(() => useDemoMode(), { wrapper });
    expect(result.current).toBe(true);
  });

  it('should be case sensitive', () => {
    window.location.search = '?demo=True';
    const { result } = renderHook(() => useDemoMode(), { wrapper });
    expect(result.current).toBe(false);
  });

  it('should throw error when used outside DemoModeProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useDemoMode());
    }).toThrow('useDemoMode must be used within a DemoModeProvider');

    consoleSpy.mockRestore();
  });
});
