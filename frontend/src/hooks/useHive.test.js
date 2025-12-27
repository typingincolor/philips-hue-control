import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHive } from './useHive';
import * as hueApi from '../services/hueApi';

// Mock the hueApi
vi.mock('../services/hueApi', () => ({
  connectHive: vi.fn(),
  disconnectHive: vi.fn(),
  getHiveStatus: vi.fn(),
  getHiveSchedules: vi.fn(),
  getHiveConnectionStatus: vi.fn(),
}));

describe('useHive', () => {
  const mockSessionToken = 'test-session-token';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should start with disconnected state', () => {
      const { result } = renderHook(() => useHive(mockSessionToken));

      expect(result.current.isConnected).toBe(false);
      expect(result.current.status).toBeNull();
      expect(result.current.schedules).toEqual([]);
    });

    it('should start with no error', () => {
      const { result } = renderHook(() => useHive(mockSessionToken));

      expect(result.current.error).toBeNull();
    });

    it('should not be loading initially', () => {
      const { result } = renderHook(() => useHive(mockSessionToken));

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('connect', () => {
    it('should set loading state while connecting', async () => {
      hueApi.connectHive.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useHive(mockSessionToken));

      act(() => {
        result.current.connect('test@hive.com', 'password');
      });

      expect(result.current.isConnecting).toBe(true);
    });

    it('should pass session token to connectHive API', async () => {
      hueApi.connectHive.mockResolvedValue({ success: true });
      hueApi.getHiveStatus.mockResolvedValue({
        heating: { currentTemperature: 20, isHeating: false },
        hotWater: { isOn: false },
      });
      hueApi.getHiveSchedules.mockResolvedValue([]);

      const { result } = renderHook(() => useHive(mockSessionToken));

      await act(async () => {
        await result.current.connect('test@hive.com', 'password');
      });

      expect(hueApi.connectHive).toHaveBeenCalledWith(
        mockSessionToken,
        'test@hive.com',
        'password'
      );
    });

    it('should set connected state on successful connection', async () => {
      hueApi.connectHive.mockResolvedValue({ success: true });
      hueApi.getHiveStatus.mockResolvedValue({
        heating: { currentTemperature: 20, isHeating: false },
        hotWater: { isOn: false },
      });
      hueApi.getHiveSchedules.mockResolvedValue([]);

      const { result } = renderHook(() => useHive(mockSessionToken));

      await act(async () => {
        await result.current.connect('test@hive.com', 'password');
      });

      expect(result.current.isConnected).toBe(true);
    });

    it('should set error on failed connection', async () => {
      hueApi.connectHive.mockResolvedValue({ success: false, error: 'Invalid credentials' });

      const { result } = renderHook(() => useHive(mockSessionToken));

      await act(async () => {
        await result.current.connect('bad@email.com', 'wrong');
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.error).toContain('Invalid');
    });

    it('should fetch status after successful connection', async () => {
      hueApi.connectHive.mockResolvedValue({ success: true });
      hueApi.getHiveStatus.mockResolvedValue({
        heating: { currentTemperature: 19.5, isHeating: true },
        hotWater: { isOn: false },
      });
      hueApi.getHiveSchedules.mockResolvedValue([]);

      const { result } = renderHook(() => useHive(mockSessionToken));

      await act(async () => {
        await result.current.connect('test@hive.com', 'password');
      });

      expect(result.current.status).not.toBeNull();
      expect(result.current.status.heating.currentTemperature).toBe(19.5);
    });

    it('should pass session token to getHiveStatus API', async () => {
      hueApi.connectHive.mockResolvedValue({ success: true });
      hueApi.getHiveStatus.mockResolvedValue({
        heating: { currentTemperature: 20, isHeating: false },
        hotWater: { isOn: false },
      });
      hueApi.getHiveSchedules.mockResolvedValue([]);

      const { result } = renderHook(() => useHive(mockSessionToken));

      await act(async () => {
        await result.current.connect('test@hive.com', 'password');
      });

      expect(hueApi.getHiveStatus).toHaveBeenCalledWith(mockSessionToken);
    });

    it('should pass session token to getHiveSchedules API', async () => {
      hueApi.connectHive.mockResolvedValue({ success: true });
      hueApi.getHiveStatus.mockResolvedValue({
        heating: { currentTemperature: 20, isHeating: false },
        hotWater: { isOn: false },
      });
      hueApi.getHiveSchedules.mockResolvedValue([]);

      const { result } = renderHook(() => useHive(mockSessionToken));

      await act(async () => {
        await result.current.connect('test@hive.com', 'password');
      });

      expect(hueApi.getHiveSchedules).toHaveBeenCalledWith(mockSessionToken);
    });
  });

  describe('disconnect', () => {
    it('should clear connection state on disconnect', async () => {
      hueApi.connectHive.mockResolvedValue({ success: true });
      hueApi.getHiveStatus.mockResolvedValue({
        heating: { currentTemperature: 20, isHeating: false },
        hotWater: { isOn: false },
      });
      hueApi.getHiveSchedules.mockResolvedValue([]);
      hueApi.disconnectHive.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useHive(mockSessionToken));

      // Connect first
      await act(async () => {
        await result.current.connect('test@hive.com', 'password');
      });

      expect(result.current.isConnected).toBe(true);

      // Then disconnect
      await act(async () => {
        await result.current.disconnect();
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.status).toBeNull();
    });

    it('should pass session token to disconnectHive API', async () => {
      hueApi.connectHive.mockResolvedValue({ success: true });
      hueApi.getHiveStatus.mockResolvedValue({
        heating: { currentTemperature: 20, isHeating: false },
        hotWater: { isOn: false },
      });
      hueApi.getHiveSchedules.mockResolvedValue([]);
      hueApi.disconnectHive.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useHive(mockSessionToken));

      await act(async () => {
        await result.current.connect('test@hive.com', 'password');
      });

      await act(async () => {
        await result.current.disconnect();
      });

      expect(hueApi.disconnectHive).toHaveBeenCalledWith(mockSessionToken);
    });

    it('should clear schedules on disconnect', async () => {
      hueApi.connectHive.mockResolvedValue({ success: true });
      hueApi.getHiveStatus.mockResolvedValue({
        heating: { currentTemperature: 20, isHeating: false },
        hotWater: { isOn: false },
      });
      hueApi.getHiveSchedules.mockResolvedValue([{ id: '1', name: 'Schedule 1' }]);
      hueApi.disconnectHive.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useHive(mockSessionToken));

      await act(async () => {
        await result.current.connect('test@hive.com', 'password');
      });

      expect(result.current.schedules.length).toBe(1);

      await act(async () => {
        await result.current.disconnect();
      });

      expect(result.current.schedules).toEqual([]);
    });
  });

  describe('refresh', () => {
    it('should refresh status when connected', async () => {
      hueApi.connectHive.mockResolvedValue({ success: true });
      hueApi.getHiveStatus
        .mockResolvedValueOnce({
          heating: { currentTemperature: 20, isHeating: false },
          hotWater: { isOn: false },
        })
        .mockResolvedValueOnce({
          heating: { currentTemperature: 21, isHeating: true },
          hotWater: { isOn: true },
        });
      hueApi.getHiveSchedules.mockResolvedValue([]);

      const { result } = renderHook(() => useHive(mockSessionToken));

      await act(async () => {
        await result.current.connect('test@hive.com', 'password');
      });

      expect(result.current.status.heating.currentTemperature).toBe(20);

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.status.heating.currentTemperature).toBe(21);
    });

    it('should pass session token to getHiveStatus on refresh', async () => {
      hueApi.connectHive.mockResolvedValue({ success: true });
      hueApi.getHiveStatus
        .mockResolvedValueOnce({
          heating: { currentTemperature: 20, isHeating: false },
          hotWater: { isOn: false },
        })
        .mockResolvedValueOnce({
          heating: { currentTemperature: 21, isHeating: true },
          hotWater: { isOn: true },
        });
      hueApi.getHiveSchedules.mockResolvedValue([]);

      const { result } = renderHook(() => useHive(mockSessionToken));

      await act(async () => {
        await result.current.connect('test@hive.com', 'password');
      });

      vi.clearAllMocks();
      hueApi.getHiveStatus.mockResolvedValue({
        heating: { currentTemperature: 21, isHeating: true },
        hotWater: { isOn: true },
      });

      await act(async () => {
        await result.current.refresh();
      });

      expect(hueApi.getHiveStatus).toHaveBeenCalledWith(mockSessionToken);
    });

    it('should set error if refresh fails', async () => {
      hueApi.connectHive.mockResolvedValue({ success: true });
      hueApi.getHiveStatus
        .mockResolvedValueOnce({
          heating: { currentTemperature: 20, isHeating: false },
          hotWater: { isOn: false },
        })
        .mockRejectedValueOnce(new Error('Connection lost'));
      hueApi.getHiveSchedules.mockResolvedValue([]);

      const { result } = renderHook(() => useHive(mockSessionToken));

      await act(async () => {
        await result.current.connect('test@hive.com', 'password');
      });

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.error).toContain('Connection');
    });
  });

  describe('demo mode', () => {
    it('should use demo data when demoMode is true', async () => {
      const { result } = renderHook(() => useHive(mockSessionToken, true));

      await act(async () => {
        await result.current.connect('demo@hive.com', 'demo');
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.status).not.toBeNull();
    });
  });

  describe('checkConnection', () => {
    it('should check connection status and update state', async () => {
      hueApi.getHiveConnectionStatus.mockResolvedValue({ connected: true });
      hueApi.getHiveStatus.mockResolvedValue({
        heating: { currentTemperature: 20, isHeating: false },
        hotWater: { isOn: false },
      });
      hueApi.getHiveSchedules.mockResolvedValue([]);

      const { result } = renderHook(() => useHive(mockSessionToken));

      await act(async () => {
        await result.current.checkConnection();
      });

      expect(hueApi.getHiveConnectionStatus).toHaveBeenCalledWith(mockSessionToken);
      expect(result.current.isConnected).toBe(true);
    });

    it('should not fetch data if not connected', async () => {
      hueApi.getHiveConnectionStatus.mockResolvedValue({ connected: false });

      const { result } = renderHook(() => useHive(mockSessionToken));

      await act(async () => {
        await result.current.checkConnection();
      });

      expect(result.current.isConnected).toBe(false);
      expect(hueApi.getHiveStatus).not.toHaveBeenCalled();
    });

    it('should fetch status and schedules if connected', async () => {
      hueApi.getHiveConnectionStatus.mockResolvedValue({ connected: true });
      hueApi.getHiveStatus.mockResolvedValue({
        heating: { currentTemperature: 19.5, isHeating: true },
        hotWater: { isOn: false },
      });
      hueApi.getHiveSchedules.mockResolvedValue([{ id: '1', name: 'Morning', type: 'heating' }]);

      const { result } = renderHook(() => useHive(mockSessionToken));

      await act(async () => {
        await result.current.checkConnection();
      });

      expect(result.current.status.heating.currentTemperature).toBe(19.5);
      expect(result.current.schedules.length).toBe(1);
    });
  });
});
