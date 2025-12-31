import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock logger
vi.mock('../../utils/logger.js', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

// Mock ServiceRegistry
const mockHuePlugin = {
  constructor: { id: 'hue' },
  isConnected: vi.fn(),
  getRooms: vi.fn(),
  getDevices: vi.fn(),
  getScenes: vi.fn(),
};

const mockHivePlugin = {
  constructor: { id: 'hive' },
  isConnected: vi.fn(),
  getRooms: vi.fn(),
  getDevices: vi.fn(),
};

vi.mock('../../services/ServiceRegistry.js', () => ({
  default: {
    get: vi.fn((id, _demoMode) => {
      if (id === 'hue') return mockHuePlugin;
      if (id === 'hive') return mockHivePlugin;
      return null;
    }),
    getAll: vi.fn(() => [mockHuePlugin, mockHivePlugin]),
  },
}));

// Mock roomMappingService
vi.mock('../../services/roomMappingService.js', () => ({
  default: {
    initialize: vi.fn(),
    mapServiceRoom: vi.fn((_serviceId, roomId, _name) => `home-${roomId}`),
    getHomeRoomId: vi.fn((serviceId, roomId) => `home-${roomId}`),
    getServiceRoomIds: vi.fn(() => []),
    getRoomNameById: vi.fn((homeRoomId) => homeRoomId.replace('home-', '')),
  },
}));

import homeService from '../../services/homeService.js';
import { DeviceTypes } from '../../models/Device.js';

describe('homeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHome', () => {
    it('should return home with rooms from connected services', async () => {
      mockHuePlugin.isConnected.mockReturnValue(true);
      mockHivePlugin.isConnected.mockReturnValue(false);

      mockHuePlugin.getRooms.mockResolvedValue([
        {
          id: 'room-1',
          name: 'Living Room',
          devices: [
            {
              id: 'hue:light-1',
              name: 'Floor Lamp',
              type: DeviceTypes.LIGHT,
              serviceId: 'hue',
              state: { on: true, brightness: 80 },
            },
          ],
        },
      ]);
      mockHuePlugin.getDevices.mockResolvedValue([]);

      const home = await homeService.getHome(false);

      expect(home).toHaveProperty('rooms');
      expect(home).toHaveProperty('devices');
      expect(home).toHaveProperty('summary');
      expect(home.rooms).toHaveLength(1);
      expect(home.rooms[0].name).toBe('Living Room');
    });

    it('should aggregate rooms from multiple services', async () => {
      mockHuePlugin.isConnected.mockReturnValue(true);
      mockHivePlugin.isConnected.mockReturnValue(true);

      mockHuePlugin.getRooms.mockResolvedValue([
        {
          id: 'room-1',
          name: 'Living Room',
          devices: [
            {
              id: 'hue:light-1',
              name: 'Hue Light',
              type: DeviceTypes.LIGHT,
              serviceId: 'hue',
              state: { on: true },
            },
          ],
        },
      ]);
      mockHuePlugin.getDevices.mockResolvedValue([]);

      // Hive returns no rooms but home-level devices
      mockHivePlugin.getRooms.mockResolvedValue([]);
      mockHivePlugin.getDevices.mockResolvedValue([
        {
          id: 'hive:heating',
          name: 'Central Heating',
          type: DeviceTypes.THERMOSTAT,
          serviceId: 'hive',
          state: { currentTemperature: 19.5 },
        },
      ]);

      const home = await homeService.getHome(false);

      expect(home.rooms).toHaveLength(1);
      expect(home.devices).toHaveLength(1);
      expect(home.devices[0].type).toBe('thermostat');
    });

    it('should include home-level devices from Hive', async () => {
      mockHuePlugin.isConnected.mockReturnValue(false);
      mockHivePlugin.isConnected.mockReturnValue(true);

      mockHivePlugin.getRooms.mockResolvedValue([]);
      mockHivePlugin.getDevices.mockResolvedValue([
        {
          id: 'hive:heating',
          name: 'Central Heating',
          type: DeviceTypes.THERMOSTAT,
          serviceId: 'hive',
          state: { currentTemperature: 20, targetTemperature: 21, isHeating: true },
        },
        {
          id: 'hive:hotwater',
          name: 'Hot Water',
          type: DeviceTypes.HOT_WATER,
          serviceId: 'hive',
          state: { isOn: false, mode: 'schedule' },
        },
      ]);

      const home = await homeService.getHome(false);

      expect(home.devices).toHaveLength(2);
      expect(home.devices.find((d) => d.type === 'thermostat')).toBeDefined();
      expect(home.devices.find((d) => d.type === 'hotWater')).toBeDefined();
    });

    it('should calculate summary across all services', async () => {
      mockHuePlugin.isConnected.mockReturnValue(true);
      mockHivePlugin.isConnected.mockReturnValue(true);

      mockHuePlugin.getRooms.mockResolvedValue([
        {
          id: 'room-1',
          name: 'Room 1',
          devices: [
            {
              id: 'hue:l1',
              name: 'L1',
              type: DeviceTypes.LIGHT,
              serviceId: 'hue',
              state: { on: true },
            },
            {
              id: 'hue:l2',
              name: 'L2',
              type: DeviceTypes.LIGHT,
              serviceId: 'hue',
              state: { on: false },
            },
          ],
          scenes: [{ id: 's1', name: 'Scene 1' }],
        },
        {
          id: 'room-2',
          name: 'Room 2',
          devices: [
            {
              id: 'hue:l3',
              name: 'L3',
              type: DeviceTypes.LIGHT,
              serviceId: 'hue',
              state: { on: true },
            },
          ],
          scenes: [{ id: 's2', name: 'Scene 2' }],
        },
      ]);
      mockHuePlugin.getDevices.mockResolvedValue([]);

      mockHivePlugin.getRooms.mockResolvedValue([]);
      mockHivePlugin.getDevices.mockResolvedValue([
        {
          id: 'hive:heating',
          name: 'Heating',
          type: DeviceTypes.THERMOSTAT,
          serviceId: 'hive',
          state: {},
        },
      ]);

      const home = await homeService.getHome(false);

      expect(home.summary.totalLights).toBe(3);
      expect(home.summary.lightsOn).toBe(2);
      expect(home.summary.roomCount).toBe(2);
      expect(home.summary.sceneCount).toBe(2);
      expect(home.summary.homeDeviceCount).toBe(1);
    });

    it('should handle demo mode', async () => {
      // In demo mode, should use demo plugins
      mockHuePlugin.isConnected.mockReturnValue(true);
      mockHuePlugin.getRooms.mockResolvedValue([
        {
          id: 'demo-room',
          name: 'Demo Room',
          devices: [],
        },
      ]);
      mockHuePlugin.getDevices.mockResolvedValue([]);

      mockHivePlugin.isConnected.mockReturnValue(false);

      const home = await homeService.getHome(true);

      expect(home.rooms).toBeDefined();
    });

    it('should return empty home when no services connected', async () => {
      mockHuePlugin.isConnected.mockReturnValue(false);
      mockHivePlugin.isConnected.mockReturnValue(false);

      const home = await homeService.getHome(false);

      expect(home.rooms).toEqual([]);
      expect(home.devices).toEqual([]);
      expect(home.summary.totalLights).toBe(0);
    });

    it('should handle service errors gracefully', async () => {
      mockHuePlugin.isConnected.mockReturnValue(true);
      mockHuePlugin.getRooms.mockRejectedValue(new Error('Hue bridge unreachable'));
      mockHuePlugin.getDevices.mockResolvedValue([]);

      mockHivePlugin.isConnected.mockReturnValue(true);
      mockHivePlugin.getRooms.mockResolvedValue([]);
      mockHivePlugin.getDevices.mockResolvedValue([
        {
          id: 'hive:heating',
          name: 'Heating',
          type: DeviceTypes.THERMOSTAT,
          serviceId: 'hive',
          state: {},
        },
      ]);

      // Should not throw, should return partial data
      const home = await homeService.getHome(false);

      expect(home.devices).toHaveLength(1);
      // Rooms from Hue should be empty due to error
      expect(home.rooms).toEqual([]);
    });
  });

  describe('getRoom', () => {
    it('should return a single room by home room ID', async () => {
      mockHuePlugin.isConnected.mockReturnValue(true);
      mockHuePlugin.getRooms.mockResolvedValue([
        {
          id: 'room-1',
          name: 'Living Room',
          devices: [
            {
              id: 'hue:light-1',
              name: 'Light',
              type: DeviceTypes.LIGHT,
              serviceId: 'hue',
              state: { on: true },
            },
          ],
        },
      ]);
      mockHuePlugin.getDevices.mockResolvedValue([]);
      mockHivePlugin.isConnected.mockReturnValue(false);

      const room = await homeService.getRoom('home-room-1', false);

      expect(room).toBeDefined();
      expect(room.name).toBe('Living Room');
    });

    it('should return null for unknown room', async () => {
      mockHuePlugin.isConnected.mockReturnValue(true);
      mockHuePlugin.getRooms.mockResolvedValue([]);
      mockHuePlugin.getDevices.mockResolvedValue([]);
      mockHivePlugin.isConnected.mockReturnValue(false);

      const room = await homeService.getRoom('unknown-room', false);

      expect(room).toBeNull();
    });
  });

  describe('updateDevice', () => {
    it('should route light update to correct plugin', async () => {
      mockHuePlugin.updateDevice = vi.fn().mockResolvedValue({ success: true });

      const result = await homeService.updateDevice('hue:light-1', { on: false }, false);

      expect(mockHuePlugin.updateDevice).toHaveBeenCalledWith('light-1', { on: false });
      expect(result.success).toBe(true);
    });

    it('should route thermostat update to correct plugin', async () => {
      mockHivePlugin.updateDevice = vi.fn().mockResolvedValue({ success: true });

      const result = await homeService.updateDevice(
        'hive:heating',
        { targetTemperature: 22 },
        false
      );

      expect(mockHivePlugin.updateDevice).toHaveBeenCalledWith('heating', {
        targetTemperature: 22,
      });
      expect(result.success).toBe(true);
    });

    it('should throw error for unknown service', async () => {
      await expect(homeService.updateDevice('unknown:device-1', {}, false)).rejects.toThrow(
        'Unknown service: unknown'
      );
    });
  });

  describe('activateScene', () => {
    it('should route scene activation to correct plugin', async () => {
      mockHuePlugin.activateScene = vi.fn().mockResolvedValue({ success: true, lightsAffected: 3 });

      const result = await homeService.activateScene('hue:scene-1', false);

      expect(mockHuePlugin.activateScene).toHaveBeenCalledWith('scene-1');
      expect(result.success).toBe(true);
    });
  });

  describe('updateRoomDevices', () => {
    it('should resolve home room ID to service room ID', async () => {
      // Mock the room mapping service to return the service room ID
      const roomMappingService = await import('../../services/roomMappingService.js');
      roomMappingService.default.getServiceRoomIds.mockReturnValue([
        { serviceId: 'hue', roomId: 'living-room' },
      ]);

      mockHuePlugin.updateRoomDevices = vi.fn().mockResolvedValue({
        success: true,
        updatedLights: [{ id: 'light-1', state: { on: true } }],
      });

      // Call with home-prefixed room ID (as used by the Home API)
      const result = await homeService.updateRoomDevices('home-living-room', { on: true }, false);

      // The plugin should receive the service room ID 'living-room', not 'home-living-room'
      expect(mockHuePlugin.updateRoomDevices).toHaveBeenCalledWith('living-room', { on: true });
      expect(result.success).toBe(true);
    });

    it('should resolve V1-style room ID by adding home- prefix', async () => {
      // Mock: first call returns empty (V1-style ID), second call with home- prefix succeeds
      const roomMappingService = await import('../../services/roomMappingService.js');
      roomMappingService.default.getServiceRoomIds
        .mockReturnValueOnce([]) // First call: 'dining-room' not found
        .mockReturnValueOnce([{ serviceId: 'hue', roomId: 'dining-room' }]); // Second: 'home-dining-room' found

      mockHuePlugin.updateRoomDevices = vi.fn().mockResolvedValue({
        success: true,
        updatedLights: [{ id: 'light-1', state: { on: false } }],
      });

      // Call with V1-style room ID (from WebSocket dashboard_update)
      const result = await homeService.updateRoomDevices('dining-room', { on: false }, false);

      // Should have tried with home- prefix
      expect(roomMappingService.default.getServiceRoomIds).toHaveBeenCalledWith('dining-room');
      expect(roomMappingService.default.getServiceRoomIds).toHaveBeenCalledWith('home-dining-room');
      expect(mockHuePlugin.updateRoomDevices).toHaveBeenCalledWith('dining-room', { on: false });
      expect(result.success).toBe(true);
    });

    it('should throw error when home room ID has no mapping', async () => {
      // Mock the room mapping service to return empty array (no mappings)
      const roomMappingService = await import('../../services/roomMappingService.js');
      roomMappingService.default.getServiceRoomIds.mockReturnValue([]);

      // Call with a home room ID that has no service room mapping
      await expect(
        homeService.updateRoomDevices('home-unknown-room', { on: true }, false)
      ).rejects.toThrow('Room not found: home-unknown-room');
    });
  });
});
