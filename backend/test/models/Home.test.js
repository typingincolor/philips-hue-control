import { describe, it, expect } from 'vitest';
import { createHome, createRoom, calculateHomeSummary } from '../../models/Home.js';
import { DeviceTypes } from '../../models/Device.js';

describe('Home Model', () => {
  describe('createRoom', () => {
    it('should create a room with devices', () => {
      const room = createRoom({
        id: 'room-1',
        name: 'Living Room',
        devices: [
          {
            id: 'hue:light-1',
            name: 'Floor Lamp',
            type: DeviceTypes.LIGHT,
            serviceId: 'hue',
            state: { on: true, brightness: 100 },
          },
          {
            id: 'hue:light-2',
            name: 'Ceiling Light',
            type: DeviceTypes.LIGHT,
            serviceId: 'hue',
            state: { on: false, brightness: 0 },
          },
        ],
      });

      expect(room.id).toBe('room-1');
      expect(room.name).toBe('Living Room');
      expect(room.devices).toHaveLength(2);
      expect(room.devices[0].name).toBe('Floor Lamp');
    });

    it('should create a room with scenes', () => {
      const room = createRoom({
        id: 'room-1',
        name: 'Living Room',
        devices: [],
        scenes: [
          { id: 'scene-1', name: 'Bright', serviceId: 'hue' },
          { id: 'scene-2', name: 'Relax', serviceId: 'hue' },
        ],
      });

      expect(room.scenes).toHaveLength(2);
      expect(room.scenes[0].name).toBe('Bright');
    });

    it('should calculate room stats automatically', () => {
      const room = createRoom({
        id: 'room-1',
        name: 'Living Room',
        devices: [
          {
            id: 'hue:light-1',
            name: 'Light 1',
            type: DeviceTypes.LIGHT,
            serviceId: 'hue',
            state: { on: true, brightness: 100 },
          },
          {
            id: 'hue:light-2',
            name: 'Light 2',
            type: DeviceTypes.LIGHT,
            serviceId: 'hue',
            state: { on: true, brightness: 50 },
          },
          {
            id: 'hue:light-3',
            name: 'Light 3',
            type: DeviceTypes.LIGHT,
            serviceId: 'hue',
            state: { on: false, brightness: 0 },
          },
        ],
      });

      expect(room.stats.totalDevices).toBe(3);
      expect(room.stats.lightsOn).toBe(2);
      expect(room.stats.averageBrightness).toBe(75); // (100+50)/2
    });

    it('should include devices from multiple services', () => {
      const room = createRoom({
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
          {
            id: 'other:sensor-1',
            name: 'Motion Sensor',
            type: DeviceTypes.SENSOR,
            serviceId: 'other',
            state: { motion: false },
          },
        ],
      });

      const services = new Set(room.devices.map((d) => d.serviceId));
      expect(services.size).toBe(2);
      expect(services.has('hue')).toBe(true);
      expect(services.has('other')).toBe(true);
    });

    it('should throw error for missing required fields', () => {
      expect(() => createRoom({ name: 'Test' })).toThrow('Room id is required');
      expect(() => createRoom({ id: 'room-1' })).toThrow('Room name is required');
    });
  });

  describe('createHome', () => {
    it('should create a home with rooms and home-level devices', () => {
      const home = createHome({
        rooms: [
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
        ],
        devices: [
          {
            id: 'hive:heating',
            name: 'Central Heating',
            type: DeviceTypes.THERMOSTAT,
            serviceId: 'hive',
            state: { currentTemperature: 19.5 },
          },
        ],
      });

      expect(home.rooms).toHaveLength(1);
      expect(home.devices).toHaveLength(1);
      expect(home.rooms[0].name).toBe('Living Room');
      expect(home.devices[0].type).toBe('thermostat');
    });

    it('should include zones if provided', () => {
      const home = createHome({
        rooms: [],
        devices: [],
        zones: [
          {
            id: 'zone-1',
            name: 'Downstairs',
            devices: [],
          },
        ],
      });

      expect(home.zones).toHaveLength(1);
      expect(home.zones[0].name).toBe('Downstairs');
    });

    it('should calculate summary automatically', () => {
      const home = createHome({
        rooms: [
          {
            id: 'room-1',
            name: 'Room 1',
            devices: [
              {
                id: 'hue:light-1',
                name: 'Light 1',
                type: DeviceTypes.LIGHT,
                serviceId: 'hue',
                state: { on: true, brightness: 80 },
              },
              {
                id: 'hue:light-2',
                name: 'Light 2',
                type: DeviceTypes.LIGHT,
                serviceId: 'hue',
                state: { on: false },
              },
            ],
            scenes: [{ id: 'scene-1', name: 'Bright' }],
          },
          {
            id: 'room-2',
            name: 'Room 2',
            devices: [
              {
                id: 'hue:light-3',
                name: 'Light 3',
                type: DeviceTypes.LIGHT,
                serviceId: 'hue',
                state: { on: true, brightness: 100 },
              },
            ],
            scenes: [{ id: 'scene-2', name: 'Relax' }],
          },
        ],
        devices: [
          {
            id: 'hive:heating',
            name: 'Heating',
            type: DeviceTypes.THERMOSTAT,
            serviceId: 'hive',
            state: {},
          },
        ],
      });

      expect(home.summary.totalLights).toBe(3);
      expect(home.summary.lightsOn).toBe(2);
      expect(home.summary.roomCount).toBe(2);
      expect(home.summary.sceneCount).toBe(2);
      expect(home.summary.homeDeviceCount).toBe(1);
    });
  });

  describe('calculateHomeSummary', () => {
    it('should count lights across all rooms', () => {
      const rooms = [
        {
          devices: [
            { type: DeviceTypes.LIGHT, state: { on: true } },
            { type: DeviceTypes.LIGHT, state: { on: false } },
          ],
          scenes: [],
        },
        {
          devices: [{ type: DeviceTypes.LIGHT, state: { on: true } }],
          scenes: [],
        },
      ];

      const summary = calculateHomeSummary(rooms, []);
      expect(summary.totalLights).toBe(3);
      expect(summary.lightsOn).toBe(2);
    });

    it('should count scenes across all rooms', () => {
      const rooms = [
        { devices: [], scenes: [{ id: '1' }, { id: '2' }] },
        { devices: [], scenes: [{ id: '3' }] },
      ];

      const summary = calculateHomeSummary(rooms, []);
      expect(summary.sceneCount).toBe(3);
    });

    it('should count home-level devices', () => {
      const homeDevices = [{ type: DeviceTypes.THERMOSTAT }, { type: DeviceTypes.HOT_WATER }];

      const summary = calculateHomeSummary([], homeDevices);
      expect(summary.homeDeviceCount).toBe(2);
    });
  });
});
