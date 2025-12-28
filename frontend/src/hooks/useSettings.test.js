import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// Unmock the hook we're testing (globally mocked in setup.js)
vi.unmock('./useSettings');

import { useSettings } from './useSettings';
import { hueApi } from '../services/hueApi';

// Mock hueApi
vi.mock('../services/hueApi', () => ({
  hueApi: {
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
  },
}));

describe('useSettings', () => {
  const defaultServices = {
    hue: { enabled: true },
    hive: { enabled: false },
  };

  const mockSettings = {
    units: 'celsius',
    location: { lat: 51.5074, lon: -0.1278, name: 'London' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should return default settings when not enabled', () => {
      const { result } = renderHook(() => useSettings(false));

      expect(result.current.settings).toEqual({
        units: 'celsius',
        location: null,
        services: defaultServices,
      });
      expect(result.current.isLoading).toBe(false);
    });

    it('should fetch settings when enabled', async () => {
      hueApi.getSettings.mockResolvedValue({ ...mockSettings, services: defaultServices });

      const { result } = renderHook(() => useSettings(true));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(hueApi.getSettings).toHaveBeenCalledWith();
      expect(result.current.settings).toEqual({ ...mockSettings, services: defaultServices });
    });

    it('should set isLoading while fetching', async () => {
      hueApi.getSettings.mockReturnValue(new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useSettings(true));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });
    });

    it('should handle API error gracefully', async () => {
      hueApi.getSettings.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useSettings(true));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
      // Should keep default settings on error
      expect(result.current.settings).toEqual({
        units: 'celsius',
        location: null,
        services: defaultServices,
      });
    });

    it('should handle missing fields in API response', async () => {
      hueApi.getSettings.mockResolvedValue({});

      const { result } = renderHook(() => useSettings(true));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.settings).toEqual({
        units: 'celsius',
        location: null,
        services: defaultServices,
      });
    });
  });

  describe('updateSettings', () => {
    it('should optimistically update settings', async () => {
      hueApi.getSettings.mockResolvedValue(mockSettings);
      hueApi.updateSettings.mockResolvedValue({});

      const { result } = renderHook(() => useSettings(true));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateSettings({ units: 'fahrenheit' });
      });

      expect(result.current.settings.units).toBe('fahrenheit');
      expect(hueApi.updateSettings).toHaveBeenCalledWith({
        ...mockSettings,
        services: defaultServices,
        units: 'fahrenheit',
      });
    });

    it('should rollback on API error', async () => {
      hueApi.getSettings.mockResolvedValue(mockSettings);
      hueApi.updateSettings.mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useSettings(true));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateSettings({ units: 'fahrenheit' });
      });

      // Should rollback to original settings
      expect(result.current.settings.units).toBe('celsius');
      expect(result.current.error).toBe('Update failed');
    });

    it('should call API even when default settings (always enabled)', async () => {
      hueApi.updateSettings.mockResolvedValue({});

      const { result } = renderHook(() => useSettings(false));

      await act(async () => {
        await result.current.updateSettings({ units: 'fahrenheit' });
      });

      // API is called even when disabled, just won't fetch on init
      expect(hueApi.updateSettings).toHaveBeenCalledWith({
        units: 'fahrenheit',
        location: null,
        services: defaultServices,
      });
    });

    it('should merge partial updates with existing settings', async () => {
      hueApi.getSettings.mockResolvedValue(mockSettings);
      hueApi.updateSettings.mockResolvedValue({});

      const { result } = renderHook(() => useSettings(true));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateSettings({ units: 'fahrenheit' });
      });

      // Location should be preserved
      expect(result.current.settings.location).toEqual(mockSettings.location);
      expect(result.current.settings.units).toBe('fahrenheit');
    });
  });

  describe('service activation', () => {
    const mockSettingsWithServices = {
      units: 'celsius',
      location: { lat: 51.5074, lon: -0.1278, name: 'London' },
      services: {
        hue: { enabled: true },
        hive: { enabled: false },
      },
    };

    it('should return default services when not enabled', () => {
      const { result } = renderHook(() => useSettings(false));

      expect(result.current.settings).toHaveProperty('services');
      expect(result.current.settings.services.hue.enabled).toBe(true);
      expect(result.current.settings.services.hive.enabled).toBe(false);
    });

    it('should fetch settings with services when enabled', async () => {
      hueApi.getSettings.mockResolvedValue(mockSettingsWithServices);

      const { result } = renderHook(() => useSettings(true));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.settings.services).toEqual(mockSettingsWithServices.services);
    });

    it('should update hive service enabled state', async () => {
      hueApi.getSettings.mockResolvedValue(mockSettingsWithServices);
      hueApi.updateSettings.mockResolvedValue({});

      const { result } = renderHook(() => useSettings(true));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateSettings({ services: { hive: { enabled: true } } });
      });

      expect(result.current.settings.services.hive.enabled).toBe(true);
      expect(hueApi.updateSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          services: expect.objectContaining({
            hive: { enabled: true },
          }),
        })
      );
    });

    it('should update hue service enabled state', async () => {
      hueApi.getSettings.mockResolvedValue(mockSettingsWithServices);
      hueApi.updateSettings.mockResolvedValue({});

      const { result } = renderHook(() => useSettings(true));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateSettings({ services: { hue: { enabled: false } } });
      });

      expect(result.current.settings.services.hue.enabled).toBe(false);
    });

    it('should preserve other service states when updating one', async () => {
      hueApi.getSettings.mockResolvedValue(mockSettingsWithServices);
      hueApi.updateSettings.mockResolvedValue({});

      const { result } = renderHook(() => useSettings(true));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateSettings({ services: { hive: { enabled: true } } });
      });

      // Hue should still be enabled
      expect(result.current.settings.services.hue.enabled).toBe(true);
      expect(result.current.settings.services.hive.enabled).toBe(true);
    });

    it('should preserve location and units when updating services', async () => {
      hueApi.getSettings.mockResolvedValue(mockSettingsWithServices);
      hueApi.updateSettings.mockResolvedValue({});

      const { result } = renderHook(() => useSettings(true));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateSettings({ services: { hive: { enabled: true } } });
      });

      expect(result.current.settings.location).toEqual(mockSettingsWithServices.location);
      expect(result.current.settings.units).toBe('celsius');
    });

    it('should handle missing services in API response', async () => {
      // API returns old format without services
      hueApi.getSettings.mockResolvedValue({
        units: 'celsius',
        location: null,
      });

      const { result } = renderHook(() => useSettings(true));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should have default services
      expect(result.current.settings.services).toBeDefined();
      expect(result.current.settings.services.hue.enabled).toBe(true);
      expect(result.current.settings.services.hive.enabled).toBe(false);
    });

    it('should rollback services on API error', async () => {
      hueApi.getSettings.mockResolvedValue(mockSettingsWithServices);
      hueApi.updateSettings.mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useSettings(true));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateSettings({ services: { hive: { enabled: true } } });
      });

      // Should rollback to original
      expect(result.current.settings.services.hive.enabled).toBe(false);
    });
  });

  describe('enabled changes', () => {
    it('should refetch when enabled changes from false to true', async () => {
      hueApi.getSettings.mockResolvedValue(mockSettings);

      const { result, rerender } = renderHook(({ enabled }) => useSettings(enabled), {
        initialProps: { enabled: false },
      });

      expect(hueApi.getSettings).not.toHaveBeenCalled();

      rerender({ enabled: true });

      await waitFor(() => {
        expect(hueApi.getSettings).toHaveBeenCalledWith();
      });

      expect(result.current.settings).toEqual({ ...mockSettings, services: defaultServices });
    });
  });
});
