import { describe, it, expect, beforeEach } from 'vitest';
import path from 'path';
import os from 'os';
import {
  normalizeHueLight,
  normalizeHiveThermostat,
  normalizeHiveHotWater,
  normalizeDashboardLight,
} from '../../services/deviceNormalizer.js';
import { DeviceTypes } from '../../models/Device.js';
import slugMappingService from '../../services/slugMappingService.js';

describe('deviceNormalizer', () => {
  beforeEach(() => {
    // Use a temporary file path and clear slug mappings before each test
    const testFilePath = path.join(
      os.tmpdir(),
      `slug-mappings-test-${process.pid}-${Date.now()}.json`
    );
    slugMappingService.setFilePath(testFilePath);
    slugMappingService.clear();
  });
  describe('normalizeHueLight', () => {
    it('should normalize a Hue light with color', () => {
      const hueLight = {
        id: 'uuid-1',
        metadata: { name: 'Floor Lamp' },
        on: { on: true },
        dimming: { brightness: 80 },
        color: { xy: { x: 0.6915, y: 0.3083 } },
      };

      const device = normalizeHueLight(hueLight);

      // ID should be slug-based (hue:floor-lamp), original UUID stored in _uuid
      expect(device.id).toBe('hue:floor-lamp');
      expect(device._uuid).toBe('uuid-1');
      expect(device.name).toBe('Floor Lamp');
      expect(device.type).toBe(DeviceTypes.LIGHT);
      expect(device.serviceId).toBe('hue');
      expect(device.state.on).toBe(true);
      expect(device.state.brightness).toBe(80);
      expect(device.state.color).toBeDefined();
    });

    it('should normalize a Hue light with color temperature', () => {
      const hueLight = {
        id: 'light-2',
        metadata: { name: 'Ceiling Light' },
        on: { on: true },
        dimming: { brightness: 100 },
        color_temperature: { mirek: 250 },
      };

      const device = normalizeHueLight(hueLight);

      expect(device.state.on).toBe(true);
      expect(device.state.brightness).toBe(100);
      expect(device.state.colorTemperature).toBeDefined();
    });

    it('should handle light that is off', () => {
      const hueLight = {
        id: 'light-3',
        metadata: { name: 'Desk Lamp' },
        on: { on: false },
        dimming: { brightness: 0 },
      };

      const device = normalizeHueLight(hueLight);

      expect(device.state.on).toBe(false);
      expect(device.state.brightness).toBe(0);
    });

    it('should include capabilities based on light features', () => {
      const hueLightWithColor = {
        id: 'light-1',
        metadata: { name: 'Color Bulb' },
        on: { on: true },
        dimming: { brightness: 100 },
        color: { xy: { x: 0.5, y: 0.5 } },
        color_temperature: { mirek: 250 },
      };

      const device = normalizeHueLight(hueLightWithColor);

      expect(device.capabilities).toContain('on');
      expect(device.capabilities).toContain('dimming');
      expect(device.capabilities).toContain('color');
      expect(device.capabilities).toContain('colorTemperature');
    });

    it('should preserve original UUID for reference', () => {
      const hueLight = {
        id: 'abc-123-def',
        metadata: { name: 'Test Light' },
        on: { on: true },
      };

      const device = normalizeHueLight(hueLight);

      // ID should be slug-based, original UUID stored in _uuid
      expect(device.id).toBe('hue:test-light');
      expect(device._uuid).toBe('abc-123-def');
    });
  });

  describe('normalizeHiveThermostat', () => {
    it('should normalize Hive heating status', () => {
      const hiveHeating = {
        currentTemperature: 19.5,
        targetTemperature: 21,
        isHeating: true,
        mode: 'schedule',
      };

      const device = normalizeHiveThermostat(hiveHeating);

      expect(device.id).toBe('hive:heating');
      expect(device.name).toBe('Central Heating');
      expect(device.type).toBe(DeviceTypes.THERMOSTAT);
      expect(device.serviceId).toBe('hive');
      expect(device.state.currentTemperature).toBe(19.5);
      expect(device.state.targetTemperature).toBe(21);
      expect(device.state.isHeating).toBe(true);
      expect(device.state.mode).toBe('schedule');
    });

    it('should include thermostat capabilities', () => {
      const hiveHeating = {
        currentTemperature: 20,
        targetTemperature: 20,
        isHeating: false,
        mode: 'manual',
      };

      const device = normalizeHiveThermostat(hiveHeating);

      expect(device.capabilities).toContain('temperature');
      expect(device.capabilities).toContain('targetTemperature');
      expect(device.capabilities).toContain('mode');
    });

    it('should handle missing target temperature (off mode)', () => {
      const hiveHeating = {
        currentTemperature: 18,
        isHeating: false,
        mode: 'off',
      };

      const device = normalizeHiveThermostat(hiveHeating);

      expect(device.state.currentTemperature).toBe(18);
      expect(device.state.targetTemperature).toBeNull();
      expect(device.state.mode).toBe('off');
    });
  });

  describe('normalizeHiveHotWater', () => {
    it('should normalize Hive hot water status', () => {
      const hiveHotWater = {
        isOn: true,
        mode: 'schedule',
      };

      const device = normalizeHiveHotWater(hiveHotWater);

      expect(device.id).toBe('hive:hotwater');
      expect(device.name).toBe('Hot Water');
      expect(device.type).toBe(DeviceTypes.HOT_WATER);
      expect(device.serviceId).toBe('hive');
      expect(device.state.isOn).toBe(true);
      expect(device.state.mode).toBe('schedule');
    });

    it('should include hot water capabilities', () => {
      const hiveHotWater = {
        isOn: false,
        mode: 'off',
      };

      const device = normalizeHiveHotWater(hiveHotWater);

      expect(device.capabilities).toContain('on');
      expect(device.capabilities).toContain('mode');
    });
  });

  describe('normalizeDashboardLight', () => {
    it('should preserve slug and UUID from pre-enriched light', () => {
      // This simulates a light that has already been through enrichLight()
      // enrichLight() sets: id = slug (without serviceId prefix), _uuid = original UUID
      // createDevice() then adds the serviceId prefix
      const preEnrichedLight = {
        id: 'bedroom-lamp', // Slug from enrichLight (without hue: prefix)
        _uuid: 'abc-123-def-456', // Original UUID from enrichLight
        name: 'Bedroom Lamp',
        on: true,
        brightness: 80,
        color: '#ff9900',
      };

      const device = normalizeDashboardLight(preEnrichedLight);

      // createDevice adds the serviceId prefix
      expect(device.id).toBe('hue:bedroom-lamp');
      // The device should preserve the original UUID, not the slug
      expect(device._uuid).toBe('abc-123-def-456');
      expect(device.name).toBe('Bedroom Lamp');
      expect(device.state.on).toBe(true);
      expect(device.state.brightness).toBe(80);
    });

    it('should not corrupt slug mappings when processing pre-enriched lights', () => {
      // First, create a proper slug mapping for a light
      const originalUuid = 'original-uuid-123';
      const lightName = 'TV Backlight';
      const expectedSlug = slugMappingService.getSlug('hue', originalUuid, lightName);

      // Now simulate passing a pre-enriched light through normalizeDashboardLight
      // The pre-enriched light has: id = slug (without prefix), _uuid = original UUID
      const preEnrichedLight = {
        id: expectedSlug, // Slug without serviceId prefix
        _uuid: originalUuid, // Original UUID
        name: lightName,
        on: true,
        brightness: 50,
      };

      // Process through normalizeDashboardLight
      const device = normalizeDashboardLight(preEnrichedLight);

      // Device should have prefixed id and preserved UUID
      expect(device.id).toBe(`hue:${expectedSlug}`);
      expect(device._uuid).toBe(originalUuid);

      // The slug mapping should still resolve the original UUID to the same slug
      // It should NOT have created a mapping from the slug to something else
      const resolvedSlug = slugMappingService.getSlug('hue', originalUuid, lightName);
      expect(resolvedSlug).toBe(expectedSlug);

      // Looking up by UUID should return the device slug, not a corrupted chain
      const uuidLookup = slugMappingService.getUuid('hue', expectedSlug);
      expect(uuidLookup).toBe(originalUuid);
    });
  });
});
