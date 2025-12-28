import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getHome, updateDevice, activateScene, getHomeDevices } from './homeApi';

// Mock fetch
global.fetch = vi.fn();

// Mock hueApi for session token (apiUtils imports from hueApi)
vi.mock('./hueApi', () => ({
  getSessionToken: vi.fn(() => 'test-token'),
}));

describe('homeApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getHome', () => {
    it('should fetch home data', async () => {
      const mockHome = {
        rooms: [{ id: 'room-1', name: 'Living Room' }],
        devices: [],
        summary: { totalLights: 1 },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHome),
      });

      const result = await getHome();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v2/home'),
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual(mockHome);
    });

    it('should include demo mode header when enabled', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await getHome(true);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Demo-Mode': 'true',
          }),
        })
      );
    });

    it('should throw error on failed request', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(getHome()).rejects.toThrow();
    });
  });

  describe('updateDevice', () => {
    it('should update device state', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await updateDevice('hue:light-1', { on: false });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v2/home/devices/hue:light-1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ on: false }),
        })
      );
      expect(result.success).toBe(true);
    });

    it('should update thermostat temperature', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await updateDevice('hive:heating', { targetTemperature: 22 });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v2/home/devices/hive:heating'),
        expect.objectContaining({
          body: JSON.stringify({ targetTemperature: 22 }),
        })
      );
    });
  });

  describe('activateScene', () => {
    it('should activate a scene', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, lightsAffected: 3 }),
      });

      const result = await activateScene('hue:scene-1');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v2/home/scenes/hue:scene-1/activate'),
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(result.success).toBe(true);
      expect(result.lightsAffected).toBe(3);
    });
  });

  describe('getHomeDevices', () => {
    it('should fetch home-level devices', async () => {
      const mockDevices = [
        { id: 'hive:heating', type: 'thermostat' },
        { id: 'hive:hotwater', type: 'hotWater' },
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDevices),
      });

      const result = await getHomeDevices();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v2/home/devices'),
        expect.any(Object)
      );
      expect(result).toHaveLength(2);
    });
  });
});
