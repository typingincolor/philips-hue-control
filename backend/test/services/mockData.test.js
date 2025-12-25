import { describe, it, expect, beforeEach } from 'vitest';
import {
  getMockLights,
  getMockRooms,
  getMockDevices,
  getMockScenes,
  getMockZones,
  getMockMotionZones,
  getMockWeather,
  getMockSettings,
  updateMockLight,
  updateMockLights,
  setMockMotion,
  resetMockData,
  DEMO_BRIDGE_IP,
  DEMO_USERNAME,
} from '../../services/mockData.js';

describe('mockData', () => {
  beforeEach(() => {
    resetMockData();
  });

  describe('constants', () => {
    it('should export demo bridge constants', () => {
      expect(DEMO_BRIDGE_IP).toBe('demo-bridge');
      expect(DEMO_USERNAME).toBe('demo-user');
    });
  });

  describe('getMockLights', () => {
    it('should return lights in Hue API v2 format', () => {
      const result = getMockLights();

      expect(result).toHaveProperty('errors', []);
      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('should have lights with required properties', () => {
      const { data } = getMockLights();
      const light = data[0];

      expect(light).toHaveProperty('id');
      expect(light).toHaveProperty('on');
      expect(light).toHaveProperty('dimming');
      expect(light).toHaveProperty('metadata');
      expect(light.metadata).toHaveProperty('name');
    });

    it('should have lights with on state object', () => {
      const { data } = getMockLights();
      const light = data[0];

      expect(light.on).toHaveProperty('on');
      expect(typeof light.on.on).toBe('boolean');
    });

    it('should have lights with dimming object', () => {
      const { data } = getMockLights();
      const light = data[0];

      expect(light.dimming).toHaveProperty('brightness');
      expect(typeof light.dimming.brightness).toBe('number');
      expect(light.dimming.brightness).toBeGreaterThanOrEqual(0);
      expect(light.dimming.brightness).toBeLessThanOrEqual(100);
    });

    it('should have lights with color or color_temperature', () => {
      const { data } = getMockLights();

      // At least some lights should have color or color_temperature
      const hasColorOrTemp = data.some((l) => l.color || l.color_temperature);
      expect(hasColorOrTemp).toBe(true);
    });
  });

  describe('getMockRooms', () => {
    it('should return rooms in Hue API v2 format', () => {
      const result = getMockRooms();

      expect(result).toHaveProperty('errors', []);
      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should have rooms with children references to devices', () => {
      const { data } = getMockRooms();
      const room = data[0];

      expect(room).toHaveProperty('id');
      expect(room).toHaveProperty('metadata');
      expect(room.metadata).toHaveProperty('name');
      expect(room).toHaveProperty('children');
      expect(Array.isArray(room.children)).toBe(true);

      const child = room.children[0];
      expect(child).toHaveProperty('rid');
      expect(child).toHaveProperty('rtype', 'device');
    });
  });

  describe('getMockDevices', () => {
    it('should return devices in Hue API v2 format', () => {
      const result = getMockDevices();

      expect(result).toHaveProperty('errors', []);
      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should have devices with services referencing lights', () => {
      const { data } = getMockDevices();
      const device = data[0];

      expect(device).toHaveProperty('id');
      expect(device).toHaveProperty('services');
      expect(Array.isArray(device.services)).toBe(true);

      const service = device.services[0];
      expect(service).toHaveProperty('rid');
      expect(service).toHaveProperty('rtype', 'light');
    });

    it('should have device-light hierarchy matching rooms', () => {
      const lights = getMockLights().data;
      const rooms = getMockRooms().data;
      const devices = getMockDevices().data;

      // Build device to light map
      const deviceToLights = new Map();
      for (const device of devices) {
        const lightIds = device.services.filter((s) => s.rtype === 'light').map((s) => s.rid);
        deviceToLights.set(device.id, lightIds);
      }

      // Verify all room children reference valid devices
      for (const room of rooms) {
        for (const child of room.children) {
          if (child.rtype === 'device') {
            expect(deviceToLights.has(child.rid)).toBe(true);
          }
        }
      }

      // Verify all device services reference valid lights
      const lightIds = new Set(lights.map((l) => l.id));
      for (const device of devices) {
        for (const service of device.services) {
          if (service.rtype === 'light') {
            expect(lightIds.has(service.rid)).toBe(true);
          }
        }
      }
    });
  });

  describe('getMockScenes', () => {
    it('should return scenes in Hue API v2 format', () => {
      const result = getMockScenes();

      expect(result).toHaveProperty('errors', []);
      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should have scenes with group references', () => {
      const { data } = getMockScenes();
      const scene = data[0];

      expect(scene).toHaveProperty('id');
      expect(scene).toHaveProperty('metadata');
      expect(scene.metadata).toHaveProperty('name');
      expect(scene).toHaveProperty('group');
      expect(scene.group).toHaveProperty('rid');
    });
  });

  describe('getMockZones', () => {
    it('should return zones in Hue API v2 format', () => {
      const result = getMockZones();

      expect(result).toHaveProperty('errors', []);
      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should have zones with children references', () => {
      const { data } = getMockZones();
      const zone = data[0];

      expect(zone).toHaveProperty('id');
      expect(zone).toHaveProperty('metadata');
      expect(zone.metadata).toHaveProperty('name');
      expect(zone).toHaveProperty('children');
      expect(Array.isArray(zone.children)).toBe(true);
    });
  });

  describe('getMockMotionZones', () => {
    it('should return motion zones array', () => {
      const result = getMockMotionZones();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should have motion zones with required properties', () => {
      const zones = getMockMotionZones();
      const zone = zones[0];

      expect(zone).toHaveProperty('id');
      expect(zone).toHaveProperty('name');
      expect(zone).toHaveProperty('motionDetected');
      expect(zone).toHaveProperty('enabled');
      expect(zone).toHaveProperty('reachable');
    });

    it('should have boolean motion properties', () => {
      const zones = getMockMotionZones();
      const zone = zones[0];

      expect(typeof zone.motionDetected).toBe('boolean');
      expect(typeof zone.enabled).toBe('boolean');
      expect(typeof zone.reachable).toBe('boolean');
    });
  });

  describe('getMockWeather', () => {
    it('should return weather data with current conditions', () => {
      const result = getMockWeather();

      expect(result).toHaveProperty('current');
      expect(result.current).toHaveProperty('temperature');
      expect(result.current).toHaveProperty('condition');
      expect(result.current).toHaveProperty('windSpeed');
    });

    it('should return weather data with forecast', () => {
      const result = getMockWeather();

      expect(result).toHaveProperty('forecast');
      expect(Array.isArray(result.forecast)).toBe(true);
      expect(result.forecast.length).toBeGreaterThan(0);

      const day = result.forecast[0];
      expect(day).toHaveProperty('date');
      expect(day).toHaveProperty('condition');
      expect(day).toHaveProperty('high');
      expect(day).toHaveProperty('low');
    });
  });

  describe('getMockSettings', () => {
    it('should return settings with location', () => {
      const result = getMockSettings();

      expect(result).toHaveProperty('location');
      expect(result.location).toHaveProperty('lat');
      expect(result.location).toHaveProperty('lon');
      expect(result.location).toHaveProperty('name');
    });

    it('should return settings with units', () => {
      const result = getMockSettings();

      expect(result).toHaveProperty('units');
      expect(['celsius', 'fahrenheit']).toContain(result.units);
    });

    it('should default to London location', () => {
      const result = getMockSettings();

      expect(result.location.name).toBe('London');
      expect(result.location.lat).toBeCloseTo(51.5074, 2);
      expect(result.location.lon).toBeCloseTo(-0.1278, 2);
    });
  });

  describe('updateMockLight', () => {
    it('should update light on state', () => {
      const lights = getMockLights().data;
      const lightId = lights[0].id;
      const originalState = lights[0].on.on;

      updateMockLight(lightId, { on: { on: !originalState } });

      const updatedLights = getMockLights().data;
      const updatedLight = updatedLights.find((l) => l.id === lightId);

      expect(updatedLight.on.on).toBe(!originalState);
    });

    it('should update light brightness', () => {
      const lights = getMockLights().data;
      const lightId = lights[0].id;

      updateMockLight(lightId, { dimming: { brightness: 42 } });

      const updatedLights = getMockLights().data;
      const updatedLight = updatedLights.find((l) => l.id === lightId);

      expect(updatedLight.dimming.brightness).toBe(42);
    });

    it('should update light color', () => {
      const lights = getMockLights().data;
      // Find a light with color (not color_temperature)
      const colorLight = lights.find((l) => l.color);
      const lightId = colorLight.id;

      updateMockLight(lightId, { color: { xy: { x: 0.5, y: 0.4 } } });

      const updatedLights = getMockLights().data;
      const updatedLight = updatedLights.find((l) => l.id === lightId);

      expect(updatedLight.color.xy.x).toBe(0.5);
      expect(updatedLight.color.xy.y).toBe(0.4);
    });

    it('should return the updated light', () => {
      const lights = getMockLights().data;
      const lightId = lights[0].id;

      const result = updateMockLight(lightId, { on: { on: true } });

      expect(result).toHaveProperty('id', lightId);
      expect(result.on.on).toBe(true);
    });

    it('should throw error for unknown light', () => {
      expect(() => updateMockLight('unknown-light', { on: { on: true } })).toThrow();
    });

    it('should persist changes across calls', () => {
      const lights = getMockLights().data;
      const lightId = lights[0].id;

      updateMockLight(lightId, { dimming: { brightness: 77 } });

      // Get lights again - should still have the change
      const newLights = getMockLights().data;
      const light = newLights.find((l) => l.id === lightId);

      expect(light.dimming.brightness).toBe(77);
    });
  });

  describe('updateMockLights', () => {
    it('should update multiple lights', () => {
      const lights = getMockLights().data;
      const updates = [
        { lightId: lights[0].id, state: { on: { on: true }, dimming: { brightness: 100 } } },
        { lightId: lights[1].id, state: { on: { on: false }, dimming: { brightness: 0 } } },
      ];

      updateMockLights(updates);

      const updatedLights = getMockLights().data;
      const light0 = updatedLights.find((l) => l.id === lights[0].id);
      const light1 = updatedLights.find((l) => l.id === lights[1].id);

      expect(light0.on.on).toBe(true);
      expect(light0.dimming.brightness).toBe(100);
      expect(light1.on.on).toBe(false);
      expect(light1.dimming.brightness).toBe(0);
    });

    it('should return array of updated lights', () => {
      const lights = getMockLights().data;
      const updates = [
        { lightId: lights[0].id, state: { on: { on: true } } },
        { lightId: lights[1].id, state: { on: { on: true } } },
      ];

      const result = updateMockLights(updates);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0]).toHaveProperty('id', lights[0].id);
      expect(result[1]).toHaveProperty('id', lights[1].id);
    });
  });

  describe('setMockMotion', () => {
    it('should update motion detected state', () => {
      const zones = getMockMotionZones();
      const zoneId = zones[0].id;

      setMockMotion(zoneId, true);

      const updatedZones = getMockMotionZones();
      const zone = updatedZones.find((z) => z.id === zoneId);

      expect(zone.motionDetected).toBe(true);
    });

    it('should set motion to false', () => {
      const zones = getMockMotionZones();
      const zoneId = zones[0].id;

      // First set to true
      setMockMotion(zoneId, true);
      // Then set to false
      setMockMotion(zoneId, false);

      const updatedZones = getMockMotionZones();
      const zone = updatedZones.find((z) => z.id === zoneId);

      expect(zone.motionDetected).toBe(false);
    });
  });

  describe('resetMockData', () => {
    it('should reset all light changes', () => {
      const lights = getMockLights().data;
      const lightId = lights[0].id;
      const originalBrightness = lights[0].dimming.brightness;

      // Make a change
      updateMockLight(lightId, { dimming: { brightness: 99 } });

      // Reset
      resetMockData();

      // Verify reset
      const resetLights = getMockLights().data;
      const light = resetLights.find((l) => l.id === lightId);

      expect(light.dimming.brightness).toBe(originalBrightness);
    });

    it('should reset all motion changes', () => {
      const zones = getMockMotionZones();
      const zoneId = zones[0].id;

      // Make a change
      setMockMotion(zoneId, true);

      // Reset
      resetMockData();

      // Verify reset - all should start as false
      const resetZones = getMockMotionZones();
      const zone = resetZones.find((z) => z.id === zoneId);

      expect(zone.motionDetected).toBe(false);
    });
  });
});
