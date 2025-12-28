import { describe, it, expect } from 'vitest';
import { createDevice, DeviceTypes, normalizeDeviceId } from '../../models/Device.js';

describe('Device Model', () => {
  describe('DeviceTypes', () => {
    it('should export device type constants', () => {
      expect(DeviceTypes.LIGHT).toBe('light');
      expect(DeviceTypes.THERMOSTAT).toBe('thermostat');
      expect(DeviceTypes.HOT_WATER).toBe('hotWater');
      expect(DeviceTypes.SENSOR).toBe('sensor');
    });
  });

  describe('normalizeDeviceId', () => {
    it('should create globally unique device ID', () => {
      const id = normalizeDeviceId('hue', 'light-123');
      expect(id).toBe('hue:light-123');
    });

    it('should handle IDs with special characters', () => {
      const id = normalizeDeviceId('hive', 'device/heating/1');
      expect(id).toBe('hive:device/heating/1');
    });
  });

  describe('createDevice', () => {
    it('should create a light device', () => {
      const device = createDevice({
        id: 'light-1',
        name: 'Floor Lamp',
        type: DeviceTypes.LIGHT,
        serviceId: 'hue',
        state: {
          on: true,
          brightness: 80,
          color: '#ff8800',
        },
      });

      expect(device.id).toBe('hue:light-1');
      expect(device.name).toBe('Floor Lamp');
      expect(device.type).toBe('light');
      expect(device.serviceId).toBe('hue');
      expect(device.state.on).toBe(true);
      expect(device.state.brightness).toBe(80);
      expect(device.state.color).toBe('#ff8800');
    });

    it('should create a thermostat device', () => {
      const device = createDevice({
        id: 'heating-1',
        name: 'Central Heating',
        type: DeviceTypes.THERMOSTAT,
        serviceId: 'hive',
        state: {
          currentTemperature: 19.5,
          targetTemperature: 21,
          isHeating: true,
          mode: 'schedule',
        },
      });

      expect(device.id).toBe('hive:heating-1');
      expect(device.type).toBe('thermostat');
      expect(device.state.currentTemperature).toBe(19.5);
      expect(device.state.targetTemperature).toBe(21);
      expect(device.state.isHeating).toBe(true);
      expect(device.state.mode).toBe('schedule');
    });

    it('should create a hot water device', () => {
      const device = createDevice({
        id: 'hotwater-1',
        name: 'Hot Water',
        type: DeviceTypes.HOT_WATER,
        serviceId: 'hive',
        state: {
          isOn: false,
          mode: 'schedule',
        },
      });

      expect(device.id).toBe('hive:hotwater-1');
      expect(device.type).toBe('hotWater');
      expect(device.state.isOn).toBe(false);
      expect(device.state.mode).toBe('schedule');
    });

    it('should include optional capabilities', () => {
      const device = createDevice({
        id: 'light-1',
        name: 'Color Bulb',
        type: DeviceTypes.LIGHT,
        serviceId: 'hue',
        state: { on: true },
        capabilities: ['dimming', 'color', 'colorTemperature'],
      });

      expect(device.capabilities).toContain('dimming');
      expect(device.capabilities).toContain('color');
      expect(device.capabilities).toContain('colorTemperature');
    });

    it('should throw error for missing required fields', () => {
      expect(() =>
        createDevice({
          name: 'Test',
          type: DeviceTypes.LIGHT,
          serviceId: 'hue',
        })
      ).toThrow('Device id is required');

      expect(() =>
        createDevice({
          id: 'light-1',
          type: DeviceTypes.LIGHT,
          serviceId: 'hue',
        })
      ).toThrow('Device name is required');

      expect(() =>
        createDevice({
          id: 'light-1',
          name: 'Test',
          serviceId: 'hue',
        })
      ).toThrow('Device type is required');
    });

    it('should throw error for invalid device type', () => {
      expect(() =>
        createDevice({
          id: 'test-1',
          name: 'Test',
          type: 'invalid',
          serviceId: 'hue',
        })
      ).toThrow('Invalid device type: invalid');
    });
  });
});
