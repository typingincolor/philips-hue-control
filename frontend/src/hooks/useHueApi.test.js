import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHueApi } from './useHueApi';
import { hueApi } from '../services/hueApi';
import { mockApi } from '../services/mockApi';

// Mock the dependencies
vi.mock('./useDemoMode', () => ({
  useDemoMode: vi.fn(),
}));

vi.mock('../services/hueApi', () => ({
  hueApi: { name: 'hueApi' },
}));

vi.mock('../services/mockApi', () => ({
  mockApi: { name: 'mockApi' },
}));

describe('useHueApi', () => {
  const originalLocation = window.location;
  let useDemoModeMock;

  beforeEach(async () => {
    // Get the mocked useDemoMode
    const { useDemoMode } = await import('./useDemoMode');
    useDemoModeMock = useDemoMode;

    // Mock window.location
    delete window.location;
    window.location = { search: '' };
  });

  afterEach(() => {
    // Restore original location
    window.location = originalLocation;
    vi.clearAllMocks();
  });

  it('should return hueApi when not in demo mode', () => {
    useDemoModeMock.mockReturnValue(false);
    const { result } = renderHook(() => useHueApi());
    expect(result.current).toBe(hueApi);
  });

  it('should return mockApi when in demo mode', () => {
    useDemoModeMock.mockReturnValue(true);
    const { result } = renderHook(() => useHueApi());
    expect(result.current).toBe(mockApi);
  });

  it('should update when demo mode changes', () => {
    useDemoModeMock.mockReturnValue(false);
    const { result, rerender } = renderHook(() => useHueApi());
    expect(result.current).toBe(hueApi);

    useDemoModeMock.mockReturnValue(true);
    rerender();
    expect(result.current).toBe(mockApi);
  });

  it('should consistently return same API reference when mode unchanged', () => {
    useDemoModeMock.mockReturnValue(false);
    const { result, rerender } = renderHook(() => useHueApi());
    const firstResult = result.current;

    rerender();
    expect(result.current).toBe(firstResult);
  });
});
