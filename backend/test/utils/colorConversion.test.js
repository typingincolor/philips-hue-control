import { describe, it, expect, beforeEach } from 'vitest';
import path from 'path';
import os from 'os';
import {
  xyToRgb,
  mirekToRgb,
  getLightColor,
  getLightShadow,
  enrichLight,
  enrichLights,
} from '../../utils/colorConversion.js';
import slugMappingService from '../../services/slugMappingService.js';

describe('colorConversion', () => {
  beforeEach(() => {
    // Use a temporary file path and clear slug mappings before each test
    const testFilePath = path.join(
      os.tmpdir(),
      `slug-mappings-test-${process.pid}-${Date.now()}.json`
    );
    slugMappingService.setFilePath(testFilePath);
    slugMappingService.clear();
  });
  describe('xyToRgb', () => {
    it('should convert xy coordinates to RGB with default brightness', () => {
      const result = xyToRgb(0.3127, 0.329); // D65 white point
      expect(result).toHaveProperty('r');
      expect(result).toHaveProperty('g');
      expect(result).toHaveProperty('b');
      expect(result.r).toBeGreaterThanOrEqual(0);
      expect(result.r).toBeLessThanOrEqual(255);
      expect(result.g).toBeGreaterThanOrEqual(0);
      expect(result.g).toBeLessThanOrEqual(255);
      expect(result.b).toBeGreaterThanOrEqual(0);
      expect(result.b).toBeLessThanOrEqual(255);
    });

    it('should convert red color correctly', () => {
      const result = xyToRgb(0.6915, 0.3083, 100); // Hue red
      expect(result.r).toBeGreaterThan(result.g);
      expect(result.r).toBeGreaterThan(result.b);
    });

    it('should convert blue color correctly', () => {
      const result = xyToRgb(0.1532, 0.0475, 100); // Hue blue
      expect(result.b).toBeGreaterThan(result.r);
      expect(result.b).toBeGreaterThan(result.g);
    });

    it('should scale brightness correctly at 50%', () => {
      const bright = xyToRgb(0.3127, 0.329, 100);
      const dim = xyToRgb(0.3127, 0.329, 50);
      expect(dim.r).toBeLessThan(bright.r);
      expect(dim.g).toBeLessThan(bright.g);
      expect(dim.b).toBeLessThan(bright.b);
    });

    it('should scale brightness correctly at 0%', () => {
      const result = xyToRgb(0.3127, 0.329, 0);
      expect(result.r).toBe(0);
      expect(result.g).toBe(0);
      expect(result.b).toBe(0);
    });

    it('should handle edge case coordinates', () => {
      const result = xyToRgb(0.0001, 0.0001, 100);
      expect(result.r).toBeGreaterThanOrEqual(0);
      expect(result.r).toBeLessThanOrEqual(255);
    });

    it('should clamp values to 0-255 range', () => {
      const result = xyToRgb(1.0, 0.0001, 100); // Edge case that might overflow
      expect(result.r).toBeLessThanOrEqual(255);
      expect(result.g).toBeLessThanOrEqual(255);
      expect(result.b).toBeLessThanOrEqual(255);
      expect(result.r).toBeGreaterThanOrEqual(0);
      expect(result.g).toBeGreaterThanOrEqual(0);
      expect(result.b).toBeGreaterThanOrEqual(0);
    });
  });

  describe('mirekToRgb', () => {
    it('should convert warm white (454 mirek / 2200K)', () => {
      const result = mirekToRgb(454, 100); // Warm white
      expect(result.r).toBeGreaterThan(result.b); // Warm = more red than blue
      expect(result.r).toBeGreaterThanOrEqual(0);
      expect(result.r).toBeLessThanOrEqual(255);
    });

    it('should convert cool white (153 mirek / 6500K)', () => {
      const result = mirekToRgb(153, 100); // Cool white
      expect(result.b).toBeGreaterThan(0); // Cool should have blue
      expect(result.r).toBeGreaterThanOrEqual(0);
      expect(result.r).toBeLessThanOrEqual(255);
    });

    it('should scale brightness correctly', () => {
      const bright = mirekToRgb(250, 100);
      const dim = mirekToRgb(250, 50);
      expect(dim.r).toBeLessThanOrEqual(bright.r);
      expect(dim.g).toBeLessThanOrEqual(bright.g);
      expect(dim.b).toBeLessThanOrEqual(bright.b);
    });

    it('should handle 0% brightness', () => {
      const result = mirekToRgb(250, 0);
      expect(result.r).toBe(0);
      expect(result.g).toBe(0);
      expect(result.b).toBe(0);
    });

    it('should handle very warm temperatures (high mirek)', () => {
      const result = mirekToRgb(500, 100);
      expect(result.r).toBeGreaterThanOrEqual(0);
      expect(result.r).toBeLessThanOrEqual(255);
      expect(result.r).toBeGreaterThan(result.b);
    });

    it('should handle very cool temperatures (low mirek)', () => {
      const result = mirekToRgb(100, 100);
      expect(result.b).toBeGreaterThanOrEqual(0);
      expect(result.b).toBeLessThanOrEqual(255);
    });

    it('should return valid RGB values for all inputs', () => {
      const result = mirekToRgb(250, 75);
      expect(result.r).toBeGreaterThanOrEqual(0);
      expect(result.r).toBeLessThanOrEqual(255);
      expect(result.g).toBeGreaterThanOrEqual(0);
      expect(result.g).toBeLessThanOrEqual(255);
      expect(result.b).toBeGreaterThanOrEqual(0);
      expect(result.b).toBeLessThanOrEqual(255);
    });
  });

  describe('getLightColor', () => {
    it('should return null for lights that are off', () => {
      const light = { on: { on: false } };
      const result = getLightColor(light);
      expect(result).toBeNull();
    });

    it('should return color for light with xy color data', () => {
      const light = {
        on: { on: true },
        dimming: { brightness: 100 },
        color: { xy: { x: 0.3127, y: 0.329 } },
      };
      const result = getLightColor(light);
      expect(result).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
    });

    it('should return color for light with color temperature data', () => {
      const light = {
        on: { on: true },
        dimming: { brightness: 100 },
        color_temperature: { mirek: 250 },
      };
      const result = getLightColor(light);
      expect(result).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
    });

    it('should prefer xy color over color temperature when both present', () => {
      const light = {
        on: { on: true },
        dimming: { brightness: 100 },
        color: { xy: { x: 0.6915, y: 0.3083 } }, // Red
        color_temperature: { mirek: 250 }, // White
      };
      const result = getLightColor(light);
      expect(result).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
      // Should use xy (red-ish) not mirek (white)
      expect(result).toBeTruthy();
    });

    it('should return warm dim color for very dim lights without color data', () => {
      const light = {
        on: { on: true },
        dimming: { brightness: 10 },
      };
      const result = getLightColor(light);
      expect(result).toMatch(/^rgb\(255, 200, 130\)$/); // WARM_DIM_COLOR
    });

    it('should blend warm dim at mid brightness without color data', () => {
      const light = {
        on: { on: true },
        dimming: { brightness: 30 }, // Between DIM_START (15) and BRIGHT_START (50)
      };
      const result = getLightColor(light);
      expect(result).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
      expect(result).not.toBe('rgb(255, 200, 130)'); // Not pure warm
      expect(result).not.toBe('rgb(255, 245, 235)'); // Not pure white
    });

    it('should return default white for bright lights without color data', () => {
      const light = {
        on: { on: true },
        dimming: { brightness: 100 },
      };
      const result = getLightColor(light);
      expect(result).toMatch(/^rgb\(255, 245, 235\)$/); // DEFAULT_WHITE
    });

    it('should handle missing dimming data (default to 100)', () => {
      const light = {
        on: { on: true },
      };
      const result = getLightColor(light);
      expect(result).toBeTruthy();
      expect(result).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
    });

    it('should blend colors at dim brightness with color data', () => {
      const light = {
        on: { on: true },
        dimming: { brightness: 20 }, // Dim
        color: { xy: { x: 0.3127, y: 0.329 } },
      };
      const result = getLightColor(light);
      expect(result).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
      // Should blend towards warm dim
    });

    it('should use full color at bright brightness', () => {
      const light = {
        on: { on: true },
        dimming: { brightness: 80 },
        color: { xy: { x: 0.6915, y: 0.3083 } }, // Red
      };
      const result = getLightColor(light);
      expect(result).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
      // Should use full color (no warm dim blending)
    });
  });

  describe('getLightShadow', () => {
    it('should return null for lights that are off', () => {
      const light = { on: { on: false } };
      const result = getLightShadow(light, 'rgb(255, 255, 255)');
      expect(result).toBeNull();
    });

    it('should return null when no light color provided', () => {
      const light = { on: { on: true }, dimming: { brightness: 100 } };
      const result = getLightShadow(light, null);
      expect(result).toBeNull();
    });

    it('should return neutral shadow for dim lights', () => {
      const light = { on: { on: true }, dimming: { brightness: 30 } };
      const result = getLightShadow(light, 'rgb(255, 200, 130)');
      expect(result).toBe('0 2px 6px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)');
    });

    it('should return colored glow for bright lights', () => {
      const light = { on: { on: true }, dimming: { brightness: 100 } };
      const lightColor = 'rgb(255, 100, 50)';
      const result = getLightShadow(light, lightColor);
      expect(result).toContain('rgb(255, 100, 50)');
      expect(result).toContain('0 4px 12px');
    });

    it('should scale glow intensity with brightness', () => {
      const light1 = { on: { on: true }, dimming: { brightness: 60 } };
      const light2 = { on: { on: true }, dimming: { brightness: 90 } };
      const color = 'rgb(255, 100, 50)';
      const shadow1 = getLightShadow(light1, color);
      const shadow2 = getLightShadow(light2, color);

      // Both should have colored glow
      expect(shadow1).toContain(color);
      expect(shadow2).toContain(color);

      // Higher brightness should have higher opacity (hex format at end)
      const opacity1 = parseInt(shadow1.match(/\)([0-9a-f]{2}),/)[1], 16);
      const opacity2 = parseInt(shadow2.match(/\)([0-9a-f]{2}),/)[1], 16);
      expect(opacity2).toBeGreaterThan(opacity1);
    });

    it('should handle brightness exactly at threshold', () => {
      const light = { on: { on: true }, dimming: { brightness: 50 } }; // SHADOW_THRESHOLD
      const result = getLightShadow(light, 'rgb(255, 255, 255)');
      expect(result).toBeTruthy();
      expect(result).toContain('0 4px 12px'); // At threshold uses colored glow (>= threshold)
    });

    it('should handle missing brightness (default to 100)', () => {
      const light = { on: { on: true } };
      const result = getLightShadow(light, 'rgb(255, 100, 50)');
      expect(result).toContain('rgb(255, 100, 50)'); // Should have colored glow
    });
  });

  describe('enrichLight', () => {
    it('should enrich light with xy color data', () => {
      const light = {
        id: 'uuid-1',
        metadata: { name: 'Living Room 1' },
        on: { on: true },
        dimming: { brightness: 80 },
        color: { xy: { x: 0.6915, y: 0.3083 } },
      };

      const result = enrichLight(light);

      // ID should be slug-based, original UUID stored in _uuid
      expect(result.id).toBe('living-room-1');
      expect(result._uuid).toBe('uuid-1');
      expect(result.name).toBe('Living Room 1');
      expect(result.on).toBe(true);
      expect(result.brightness).toBe(80);
      expect(result.color).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
      expect(result.shadow).toBeTruthy();
      expect(result.colorSource).toBe('xy');
      expect(result._original).toBe(light);
    });

    it('should enrich light with color temperature data', () => {
      const light = {
        id: 'light-2',
        metadata: { name: 'Bedroom' },
        on: { on: true },
        dimming: { brightness: 60 },
        color_temperature: { mirek: 250 },
      };

      const result = enrichLight(light);

      // ID should be slug-based, original UUID stored in _uuid
      expect(result.id).toBe('bedroom');
      expect(result._uuid).toBe('light-2');
      expect(result.name).toBe('Bedroom');
      expect(result.colorSource).toBe('temperature');
      expect(result.color).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
    });

    it('should use fallback color when no color data present', () => {
      const light = {
        id: 'light-3',
        metadata: { name: 'Kitchen' },
        on: { on: true },
        dimming: { brightness: 100 },
      };

      const result = enrichLight(light);

      expect(result.colorSource).toBe('fallback');
      expect(result.color).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
    });

    it('should return null color for lights that are off', () => {
      const light = {
        id: 'light-4',
        metadata: { name: 'Hallway' },
        on: { on: false },
        dimming: { brightness: 0 },
      };

      const result = enrichLight(light);

      expect(result.on).toBe(false);
      expect(result.color).toBeNull();
      expect(result.shadow).toBeNull();
      expect(result.colorSource).toBeNull();
    });

    it('should handle missing metadata name', () => {
      const light = {
        id: 'light-5',
        on: { on: true },
        dimming: { brightness: 50 },
        color: { xy: { x: 0.3127, y: 0.329 } },
      };

      const result = enrichLight(light);

      expect(result.name).toBe('Unknown');
    });

    it('should handle missing on state (defaults to false)', () => {
      const light = {
        id: 'light-6',
        metadata: { name: 'Test' },
        dimming: { brightness: 50 },
      };

      const result = enrichLight(light);

      expect(result.on).toBe(false);
    });

    it('should show minimum 5% brightness when light is on but brightness is 0', () => {
      const light = {
        id: 'light-7',
        metadata: { name: 'Test' },
        on: { on: true },
        dimming: { brightness: 0 },
      };

      const result = enrichLight(light);

      expect(result.brightness).toBe(5);
    });

    it('should show minimum 5% brightness when light is on but brightness is missing', () => {
      const light = {
        id: 'light-8',
        metadata: { name: 'Test' },
        on: { on: true },
      };

      const result = enrichLight(light);

      expect(result.brightness).toBe(5);
    });

    it('should show minimum 5% brightness when light is on but brightness is less than 5', () => {
      const light = {
        id: 'light-9',
        metadata: { name: 'Test' },
        on: { on: true },
        dimming: { brightness: 2 },
      };

      const result = enrichLight(light);

      expect(result.brightness).toBe(5);
    });

    it('should show 0% brightness when light is off', () => {
      const light = {
        id: 'light-10',
        metadata: { name: 'Test' },
        on: { on: false },
        dimming: { brightness: 50 },
      };

      const result = enrichLight(light);

      expect(result.brightness).toBe(0);
    });

    it('should preserve brightness above 5% when light is on', () => {
      const light = {
        id: 'light-11',
        metadata: { name: 'Test' },
        on: { on: true },
        dimming: { brightness: 80 },
      };

      const result = enrichLight(light);

      expect(result.brightness).toBe(80);
    });

    it('should prefer xy color over temperature when both present', () => {
      const light = {
        id: 'light-12',
        metadata: { name: 'Test' },
        on: { on: true },
        dimming: { brightness: 100 },
        color: { xy: { x: 0.6915, y: 0.3083 } },
        color_temperature: { mirek: 250 },
      };

      const result = enrichLight(light);

      expect(result.colorSource).toBe('xy');
    });

    it('should generate colored glow for bright lights', () => {
      const light = {
        id: 'light-13',
        metadata: { name: 'Bright Light' },
        on: { on: true },
        dimming: { brightness: 100 },
        color: { xy: { x: 0.6915, y: 0.3083 } },
      };

      const result = enrichLight(light);

      expect(result.shadow).toContain('rgb');
      expect(result.shadow).toContain('0 4px 12px');
    });

    it('should generate neutral shadow for dim lights', () => {
      const light = {
        id: 'light-14',
        metadata: { name: 'Dim Light' },
        on: { on: true },
        dimming: { brightness: 30 },
        color: { xy: { x: 0.3127, y: 0.329 } },
      };

      const result = enrichLight(light);

      expect(result.shadow).toContain('rgba(0, 0, 0');
      expect(result.shadow).toContain('0 2px 6px');
    });

    it('should include original light data for advanced use', () => {
      const light = {
        id: 'light-15',
        metadata: { name: 'Test' },
        on: { on: true },
        dimming: { brightness: 50 },
        customField: 'custom value',
      };

      const result = enrichLight(light);

      expect(result._original).toEqual(light);
      expect(result._original.customField).toBe('custom value');
    });
  });

  describe('enrichLights', () => {
    it('should enrich multiple lights', () => {
      const lights = [
        {
          id: 'uuid-1',
          metadata: { name: 'Light 1' },
          on: { on: true },
          dimming: { brightness: 80 },
          color: { xy: { x: 0.6915, y: 0.3083 } },
        },
        {
          id: 'uuid-2',
          metadata: { name: 'Light 2' },
          on: { on: false },
          dimming: { brightness: 0 },
        },
      ];

      const result = enrichLights(lights);

      expect(result).toHaveLength(2);
      // IDs should be slug-based
      expect(result[0].id).toBe('light-1');
      expect(result[0]._uuid).toBe('uuid-1');
      expect(result[0].on).toBe(true);
      expect(result[0].color).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
      expect(result[1].id).toBe('light-2');
      expect(result[1]._uuid).toBe('uuid-2');
      expect(result[1].on).toBe(false);
      expect(result[1].color).toBeNull();
    });

    it('should return empty array for empty input', () => {
      const result = enrichLights([]);
      expect(result).toEqual([]);
    });

    it('should preserve order of lights', () => {
      const lights = [
        { id: 'uuid-a', metadata: { name: 'First' }, on: { on: true } },
        { id: 'uuid-b', metadata: { name: 'Second' }, on: { on: true } },
        { id: 'uuid-c', metadata: { name: 'Third' }, on: { on: true } },
      ];

      const result = enrichLights(lights);

      // IDs should be slug-based
      expect(result[0].id).toBe('first');
      expect(result[1].id).toBe('second');
      expect(result[2].id).toBe('third');
      // Original UUIDs preserved
      expect(result[0]._uuid).toBe('uuid-a');
      expect(result[1]._uuid).toBe('uuid-b');
      expect(result[2]._uuid).toBe('uuid-c');
    });
  });
});
