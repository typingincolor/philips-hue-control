import { describe, it, expect, beforeEach, vi } from 'vitest';
import MockHueClient from '../../services/mockHueClient.js';
import { resetMockData, getMockLights, getMockRooms } from '../../services/mockData.js';

// Mock logger to suppress output
vi.mock('../../utils/logger.js', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe('MockHueClient', () => {
  const bridgeIp = 'demo-bridge';
  const username = 'demo-user';

  beforeEach(() => {
    resetMockData();
  });

  describe('interface compatibility with HueClient', () => {
    it('should have getLights method', () => {
      expect(typeof MockHueClient.getLights).toBe('function');
    });

    it('should have getRooms method', () => {
      expect(typeof MockHueClient.getRooms).toBe('function');
    });

    it('should have getDevices method', () => {
      expect(typeof MockHueClient.getDevices).toBe('function');
    });

    it('should have getScenes method', () => {
      expect(typeof MockHueClient.getScenes).toBe('function');
    });

    it('should have getZones method', () => {
      expect(typeof MockHueClient.getZones).toBe('function');
    });

    it('should have getResource method', () => {
      expect(typeof MockHueClient.getResource).toBe('function');
    });

    it('should have updateLight method', () => {
      expect(typeof MockHueClient.updateLight).toBe('function');
    });

    it('should have updateLights method', () => {
      expect(typeof MockHueClient.updateLights).toBe('function');
    });

    it('should have activateScene method', () => {
      expect(typeof MockHueClient.activateScene).toBe('function');
    });

    it('should have getHierarchyData method', () => {
      expect(typeof MockHueClient.getHierarchyData).toBe('function');
    });

    it('should have getZoneHierarchyData method', () => {
      expect(typeof MockHueClient.getZoneHierarchyData).toBe('function');
    });

    it('should have getDashboardData method', () => {
      expect(typeof MockHueClient.getDashboardData).toBe('function');
    });

    it('should have clearCache method', () => {
      expect(typeof MockHueClient.clearCache).toBe('function');
    });
  });

  describe('getLights', () => {
    it('should return lights in Hue API v2 format', async () => {
      const result = await MockHueClient.getLights(bridgeIp, username);

      expect(result).toHaveProperty('errors', []);
      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should return same data as getMockLights', async () => {
      const result = await MockHueClient.getLights(bridgeIp, username);
      const expected = getMockLights();

      expect(result).toEqual(expected);
    });
  });

  describe('getRooms', () => {
    it('should return rooms in Hue API v2 format', async () => {
      const result = await MockHueClient.getRooms(bridgeIp, username);

      expect(result).toHaveProperty('errors', []);
      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should return same data as getMockRooms', async () => {
      const result = await MockHueClient.getRooms(bridgeIp, username);
      const expected = getMockRooms();

      expect(result).toEqual(expected);
    });
  });

  describe('getDevices', () => {
    it('should return devices in Hue API v2 format', async () => {
      const result = await MockHueClient.getDevices(bridgeIp, username);

      expect(result).toHaveProperty('errors', []);
      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('getScenes', () => {
    it('should return scenes in Hue API v2 format', async () => {
      const result = await MockHueClient.getScenes(bridgeIp, username);

      expect(result).toHaveProperty('errors', []);
      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('getZones', () => {
    it('should return zones in Hue API v2 format', async () => {
      const result = await MockHueClient.getZones(bridgeIp, username);

      expect(result).toHaveProperty('errors', []);
      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('getResource', () => {
    it('should return behavior_instance data', async () => {
      const result = await MockHueClient.getResource(bridgeIp, username, 'behavior_instance');

      expect(result).toHaveProperty('errors', []);
      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should return convenience_area_motion data', async () => {
      const result = await MockHueClient.getResource(bridgeIp, username, 'convenience_area_motion');

      expect(result).toHaveProperty('errors', []);
      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('updateLight', () => {
    it('should update light on state', async () => {
      const lights = (await MockHueClient.getLights(bridgeIp, username)).data;
      const lightId = lights[0].id;

      await MockHueClient.updateLight(bridgeIp, username, lightId, { on: { on: false } });

      const updatedLights = (await MockHueClient.getLights(bridgeIp, username)).data;
      const light = updatedLights.find((l) => l.id === lightId);

      expect(light.on.on).toBe(false);
    });

    it('should update light brightness', async () => {
      const lights = (await MockHueClient.getLights(bridgeIp, username)).data;
      const lightId = lights[0].id;

      await MockHueClient.updateLight(bridgeIp, username, lightId, {
        dimming: { brightness: 50 },
      });

      const updatedLights = (await MockHueClient.getLights(bridgeIp, username)).data;
      const light = updatedLights.find((l) => l.id === lightId);

      expect(light.dimming.brightness).toBe(50);
    });

    it('should return success response', async () => {
      const lights = (await MockHueClient.getLights(bridgeIp, username)).data;
      const lightId = lights[0].id;

      const result = await MockHueClient.updateLight(bridgeIp, username, lightId, {
        on: { on: true },
      });

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should throw for unknown light', async () => {
      await expect(
        MockHueClient.updateLight(bridgeIp, username, 'unknown-id', { on: { on: true } })
      ).rejects.toThrow('Light not found');
    });
  });

  describe('updateLights', () => {
    it('should update multiple lights', async () => {
      const lights = (await MockHueClient.getLights(bridgeIp, username)).data;
      const updates = [
        { lightId: lights[0].id, state: { on: { on: false } } },
        { lightId: lights[1].id, state: { dimming: { brightness: 25 } } },
      ];

      await MockHueClient.updateLights(bridgeIp, username, updates);

      const updatedLights = (await MockHueClient.getLights(bridgeIp, username)).data;
      expect(updatedLights.find((l) => l.id === lights[0].id).on.on).toBe(false);
      expect(updatedLights.find((l) => l.id === lights[1].id).dimming.brightness).toBe(25);
    });

    it('should return array of results', async () => {
      const lights = (await MockHueClient.getLights(bridgeIp, username)).data;
      const updates = [
        { lightId: lights[0].id, state: { on: { on: true } } },
        { lightId: lights[1].id, state: { on: { on: true } } },
      ];

      const result = await MockHueClient.updateLights(bridgeIp, username, updates);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });
  });

  describe('activateScene', () => {
    it('should return success response', async () => {
      const result = await MockHueClient.activateScene(bridgeIp, username, 'scene-1');

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should return affected light ids', async () => {
      const result = await MockHueClient.activateScene(bridgeIp, username, 'scene-1');

      // Scene-1 is for room-1, which should affect lights from device-1 and device-2
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0]).toHaveProperty('rid');
    });
  });

  describe('getHierarchyData', () => {
    it('should return lights, rooms, and devices', async () => {
      const result = await MockHueClient.getHierarchyData(bridgeIp, username);

      expect(result).toHaveProperty('lightsData');
      expect(result).toHaveProperty('roomsData');
      expect(result).toHaveProperty('devicesData');

      expect(result.lightsData).toHaveProperty('data');
      expect(result.roomsData).toHaveProperty('data');
      expect(result.devicesData).toHaveProperty('data');
    });
  });

  describe('getZoneHierarchyData', () => {
    it('should return lights, zones, and devices', async () => {
      const result = await MockHueClient.getZoneHierarchyData(bridgeIp, username);

      expect(result).toHaveProperty('lightsData');
      expect(result).toHaveProperty('zonesData');
      expect(result).toHaveProperty('devicesData');

      expect(result.lightsData).toHaveProperty('data');
      expect(result.zonesData).toHaveProperty('data');
      expect(result.devicesData).toHaveProperty('data');
    });
  });

  describe('getDashboardData', () => {
    it('should return lights, rooms, devices, and scenes', async () => {
      const result = await MockHueClient.getDashboardData(bridgeIp, username);

      expect(result).toHaveProperty('lightsData');
      expect(result).toHaveProperty('roomsData');
      expect(result).toHaveProperty('devicesData');
      expect(result).toHaveProperty('scenesData');

      expect(result.lightsData).toHaveProperty('data');
      expect(result.roomsData).toHaveProperty('data');
      expect(result.devicesData).toHaveProperty('data');
      expect(result.scenesData).toHaveProperty('data');
    });
  });

  describe('clearCache', () => {
    it('should be callable without error', () => {
      // MockHueClient doesn't need caching, but should have the method
      expect(() => MockHueClient.clearCache()).not.toThrow();
      expect(() => MockHueClient.clearCache('demo-bridge')).not.toThrow();
    });
  });

  describe('getMotionData', () => {
    it('should return behavior_instance and motion data', async () => {
      const result = await MockHueClient.getMotionData(bridgeIp, username);

      expect(result).toHaveProperty('behaviorData');
      expect(result).toHaveProperty('motionData');

      expect(result.behaviorData).toHaveProperty('data');
      expect(result.motionData).toHaveProperty('data');
    });
  });
});
