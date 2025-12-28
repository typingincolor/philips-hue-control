import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { transformHomeToDashboard, getDashboardFromHome } from './homeAdapter';
import * as homeApi from './homeApi';

// Mock homeApi
vi.mock('./homeApi', () => ({
  getHome: vi.fn(),
}));

describe('homeAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('transformHomeToDashboard', () => {
    it('should transform V2 home structure to V1 dashboard format', () => {
      const home = {
        rooms: [
          {
            id: 'room-1',
            name: 'Living Room',
            devices: [
              {
                id: 'hue:light-1',
                name: 'Floor Lamp',
                type: 'light',
                serviceId: 'hue',
                state: {
                  on: true,
                  brightness: 80,
                  color: 'rgb(255, 200, 150)',
                  shadow: '0 0 10px rgb(255, 200, 150)',
                },
              },
              {
                id: 'hue:light-2',
                name: 'Ceiling Light',
                type: 'light',
                serviceId: 'hue',
                state: {
                  on: false,
                  brightness: 0,
                },
              },
            ],
            scenes: [
              { id: 'hue:scene-1', name: 'Bright', serviceId: 'hue' },
              { id: 'hue:scene-2', name: 'Relax', serviceId: 'hue' },
            ],
          },
        ],
        devices: [],
        summary: {
          totalLights: 2,
          lightsOn: 1,
          roomCount: 1,
          sceneCount: 2,
        },
      };

      const dashboard = transformHomeToDashboard(home);

      // Check summary
      expect(dashboard.summary.totalLights).toBe(2);
      expect(dashboard.summary.lightsOn).toBe(1);
      expect(dashboard.summary.roomCount).toBe(1);
      expect(dashboard.summary.sceneCount).toBe(2);

      // Check rooms
      expect(dashboard.rooms).toHaveLength(1);
      expect(dashboard.rooms[0].id).toBe('room-1');
      expect(dashboard.rooms[0].name).toBe('Living Room');

      // Check lights have V1 format (IDs without prefix)
      expect(dashboard.rooms[0].lights).toHaveLength(2);
      expect(dashboard.rooms[0].lights[0].id).toBe('light-1');
      expect(dashboard.rooms[0].lights[0].name).toBe('Floor Lamp');
      expect(dashboard.rooms[0].lights[0].on).toBe(true);
      expect(dashboard.rooms[0].lights[0].brightness).toBe(80);

      // Check scenes have V1 format (IDs without prefix)
      expect(dashboard.rooms[0].scenes).toHaveLength(2);
      expect(dashboard.rooms[0].scenes[0].id).toBe('scene-1');
      expect(dashboard.rooms[0].scenes[0].name).toBe('Bright');

      // Check room stats
      expect(dashboard.rooms[0].stats.lightsOnCount).toBe(1);
      expect(dashboard.rooms[0].stats.totalLights).toBe(2);
      expect(dashboard.rooms[0].stats.averageBrightness).toBe(80);
    });

    it('should handle empty home', () => {
      const home = {
        rooms: [],
        devices: [],
        summary: {
          totalLights: 0,
          lightsOn: 0,
          roomCount: 0,
          sceneCount: 0,
        },
      };

      const dashboard = transformHomeToDashboard(home);

      expect(dashboard.summary.totalLights).toBe(0);
      expect(dashboard.rooms).toEqual([]);
      expect(dashboard.zones).toEqual([]);
      expect(dashboard.motionZones).toEqual([]);
    });

    it('should filter out non-light devices', () => {
      const home = {
        rooms: [
          {
            id: 'room-1',
            name: 'Living Room',
            devices: [
              {
                id: 'hue:light-1',
                name: 'Lamp',
                type: 'light',
                state: { on: true, brightness: 50 },
              },
              {
                id: 'hive:heating',
                name: 'Heating',
                type: 'thermostat',
                state: { currentTemperature: 20 },
              },
            ],
            scenes: [],
          },
        ],
        devices: [],
      };

      const dashboard = transformHomeToDashboard(home);

      // Only light should be included
      expect(dashboard.rooms[0].lights).toHaveLength(1);
      expect(dashboard.rooms[0].lights[0].id).toBe('light-1');
    });

    it('should calculate average brightness correctly', () => {
      const home = {
        rooms: [
          {
            id: 'room-1',
            name: 'Room',
            devices: [
              { id: 'hue:l1', name: 'L1', type: 'light', state: { on: true, brightness: 100 } },
              { id: 'hue:l2', name: 'L2', type: 'light', state: { on: true, brightness: 50 } },
              { id: 'hue:l3', name: 'L3', type: 'light', state: { on: false, brightness: 0 } },
            ],
            scenes: [],
          },
        ],
        devices: [],
      };

      const dashboard = transformHomeToDashboard(home);

      // Average of 100 and 50 (only on lights)
      expect(dashboard.rooms[0].stats.averageBrightness).toBe(75);
    });

    it('should handle IDs without service prefix', () => {
      const home = {
        rooms: [
          {
            id: 'room-1',
            name: 'Room',
            devices: [
              { id: 'light-1', name: 'Lamp', type: 'light', state: { on: true } },
            ],
            scenes: [{ id: 'scene-1', name: 'Scene' }],
          },
        ],
        devices: [],
      };

      const dashboard = transformHomeToDashboard(home);

      // IDs should pass through unchanged if no prefix
      expect(dashboard.rooms[0].lights[0].id).toBe('light-1');
      expect(dashboard.rooms[0].scenes[0].id).toBe('scene-1');
    });

    it('should provide default values for missing state properties', () => {
      const home = {
        rooms: [
          {
            id: 'room-1',
            name: 'Room',
            devices: [
              { id: 'hue:light-1', name: 'Lamp', type: 'light', state: {} },
            ],
            scenes: [],
          },
        ],
        devices: [],
      };

      const dashboard = transformHomeToDashboard(home);

      const light = dashboard.rooms[0].lights[0];
      expect(light.on).toBe(false);
      expect(light.brightness).toBe(0);
      expect(light.color).toBe('rgb(255, 255, 255)');
      expect(light.shadow).toBe('none');
    });
  });

  describe('getDashboardFromHome', () => {
    it('should fetch home and transform to dashboard', async () => {
      const mockHome = {
        rooms: [
          {
            id: 'room-1',
            name: 'Room',
            devices: [
              { id: 'hue:light-1', name: 'Lamp', type: 'light', state: { on: true, brightness: 75 } },
            ],
            scenes: [],
          },
        ],
        devices: [],
        summary: { totalLights: 1, lightsOn: 1, roomCount: 1, sceneCount: 0 },
      };

      homeApi.getHome.mockResolvedValue(mockHome);

      const dashboard = await getDashboardFromHome(false);

      expect(homeApi.getHome).toHaveBeenCalledWith(false);
      expect(dashboard.summary.totalLights).toBe(1);
      expect(dashboard.rooms).toHaveLength(1);
    });

    it('should pass demo mode to homeApi', async () => {
      homeApi.getHome.mockResolvedValue({ rooms: [], devices: [] });

      await getDashboardFromHome(true);

      expect(homeApi.getHome).toHaveBeenCalledWith(true);
    });
  });
});
