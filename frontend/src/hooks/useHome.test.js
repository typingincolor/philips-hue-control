import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useHome } from './useHome';
import * as homeApi from '../services/homeApi';

// Mock the homeApi
vi.mock('../services/homeApi', () => ({
  getHome: vi.fn(),
  updateDevice: vi.fn(),
  activateScene: vi.fn(),
}));

describe('useHome', () => {
  const mockHome = {
    rooms: [
      {
        id: 'home-room-1',
        name: 'Living Room',
        devices: [
          {
            id: 'hue:light-1',
            name: 'Floor Lamp',
            type: 'light',
            serviceId: 'hue',
            state: { on: true, brightness: 80 },
          },
        ],
        scenes: [{ id: 'hue:scene-1', name: 'Bright', serviceId: 'hue' }],
        stats: { totalDevices: 1, lightsOn: 1, averageBrightness: 80 },
      },
    ],
    devices: [
      {
        id: 'hive:heating',
        name: 'Central Heating',
        type: 'thermostat',
        serviceId: 'hive',
        state: { currentTemperature: 19.5, targetTemperature: 21, isHeating: true },
      },
    ],
    zones: [],
    summary: {
      totalLights: 1,
      lightsOn: 1,
      roomCount: 1,
      sceneCount: 1,
      homeDeviceCount: 1,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should start with loading state', () => {
      homeApi.getHome.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useHome());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.home).toBeNull();
    });

    it('should fetch home data on mount', async () => {
      homeApi.getHome.mockResolvedValue(mockHome);

      const { result } = renderHook(() => useHome());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(homeApi.getHome).toHaveBeenCalled();
      expect(result.current.home).toEqual(mockHome);
    });
  });

  describe('data access', () => {
    it('should provide rooms from home', async () => {
      homeApi.getHome.mockResolvedValue(mockHome);

      const { result } = renderHook(() => useHome());

      await waitFor(() => {
        expect(result.current.home).not.toBeNull();
      });

      expect(result.current.home.rooms).toHaveLength(1);
      expect(result.current.home.rooms[0].name).toBe('Living Room');
    });

    it('should provide home-level devices', async () => {
      homeApi.getHome.mockResolvedValue(mockHome);

      const { result } = renderHook(() => useHome());

      await waitFor(() => {
        expect(result.current.home).not.toBeNull();
      });

      expect(result.current.home.devices).toHaveLength(1);
      expect(result.current.home.devices[0].type).toBe('thermostat');
    });

    it('should provide summary stats', async () => {
      homeApi.getHome.mockResolvedValue(mockHome);

      const { result } = renderHook(() => useHome());

      await waitFor(() => {
        expect(result.current.home).not.toBeNull();
      });

      expect(result.current.home.summary.totalLights).toBe(1);
      expect(result.current.home.summary.lightsOn).toBe(1);
    });
  });

  describe('updateDevice', () => {
    it('should update device and refresh home', async () => {
      homeApi.getHome.mockResolvedValue(mockHome);
      homeApi.updateDevice.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useHome());

      await waitFor(() => {
        expect(result.current.home).not.toBeNull();
      });

      await act(async () => {
        await result.current.updateDevice('hue:light-1', { on: false });
      });

      expect(homeApi.updateDevice).toHaveBeenCalledWith('hue:light-1', { on: false }, false);
    });

    it('should track updating device ID', async () => {
      homeApi.getHome.mockResolvedValue(mockHome);
      homeApi.updateDevice.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useHome());

      await waitFor(() => {
        expect(result.current.home).not.toBeNull();
      });

      act(() => {
        result.current.updateDevice('hue:light-1', { on: false });
      });

      expect(result.current.updatingDevices).toContain('hue:light-1');
    });
  });

  describe('activateScene', () => {
    it('should activate scene and refresh home', async () => {
      homeApi.getHome.mockResolvedValue(mockHome);
      homeApi.activateScene.mockResolvedValue({ success: true, lightsAffected: 3 });

      const { result } = renderHook(() => useHome());

      await waitFor(() => {
        expect(result.current.home).not.toBeNull();
      });

      await act(async () => {
        await result.current.activateScene('hue:scene-1');
      });

      expect(homeApi.activateScene).toHaveBeenCalledWith('hue:scene-1', false);
    });

    it('should track activating scene ID', async () => {
      homeApi.getHome.mockResolvedValue(mockHome);
      homeApi.activateScene.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useHome());

      await waitFor(() => {
        expect(result.current.home).not.toBeNull();
      });

      act(() => {
        result.current.activateScene('hue:scene-1');
      });

      expect(result.current.activatingScene).toBe('hue:scene-1');
    });
  });

  describe('error handling', () => {
    it('should set error on fetch failure', async () => {
      homeApi.getHome.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useHome());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
    });

    it('should set error on update failure', async () => {
      homeApi.getHome.mockResolvedValue(mockHome);
      homeApi.updateDevice.mockRejectedValue(new Error('Device not found'));

      const { result } = renderHook(() => useHome());

      await waitFor(() => {
        expect(result.current.home).not.toBeNull();
      });

      await act(async () => {
        await result.current.updateDevice('unknown:device', { on: true });
      });

      expect(result.current.error).toBe('Device not found');
    });
  });

  describe('refresh', () => {
    it('should refetch home data', async () => {
      homeApi.getHome.mockResolvedValue(mockHome);

      const { result } = renderHook(() => useHome());

      await waitFor(() => {
        expect(result.current.home).not.toBeNull();
      });

      homeApi.getHome.mockClear();

      await act(async () => {
        await result.current.refresh();
      });

      expect(homeApi.getHome).toHaveBeenCalled();
    });
  });

  describe('demo mode', () => {
    it('should pass demo mode to API calls', async () => {
      homeApi.getHome.mockResolvedValue(mockHome);

      renderHook(() => useHome(true));

      await waitFor(() => {
        expect(homeApi.getHome).toHaveBeenCalledWith(true);
      });
    });
  });
});
