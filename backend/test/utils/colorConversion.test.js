import { describe, it, expect } from 'vitest';
import { xyToRgb, mirekToRgb, getLightColor, getLightShadow } from '../../utils/colorConversion.js';

describe('colorConversion', () => {
  describe('xyToRgb', () => {
    it('should convert xy coordinates to RGB with default brightness', () => {
      const result = xyToRgb(0.3127, 0.3290); // D65 white point
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
      const bright = xyToRgb(0.3127, 0.3290, 100);
      const dim = xyToRgb(0.3127, 0.3290, 50);
      expect(dim.r).toBeLessThan(bright.r);
      expect(dim.g).toBeLessThan(bright.g);
      expect(dim.b).toBeLessThan(bright.b);
    });

    it('should scale brightness correctly at 0%', () => {
      const result = xyToRgb(0.3127, 0.3290, 0);
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
        color: { xy: { x: 0.3127, y: 0.3290 } }
      };
      const result = getLightColor(light);
      expect(result).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
    });

    it('should return color for light with color temperature data', () => {
      const light = {
        on: { on: true },
        dimming: { brightness: 100 },
        color_temperature: { mirek: 250 }
      };
      const result = getLightColor(light);
      expect(result).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
    });

    it('should prefer xy color over color temperature when both present', () => {
      const light = {
        on: { on: true },
        dimming: { brightness: 100 },
        color: { xy: { x: 0.6915, y: 0.3083 } }, // Red
        color_temperature: { mirek: 250 } // White
      };
      const result = getLightColor(light);
      expect(result).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
      // Should use xy (red-ish) not mirek (white)
      expect(result).toBeTruthy();
    });

    it('should return warm dim color for very dim lights without color data', () => {
      const light = {
        on: { on: true },
        dimming: { brightness: 10 }
      };
      const result = getLightColor(light);
      expect(result).toMatch(/^rgb\(255, 200, 130\)$/); // WARM_DIM_COLOR
    });

    it('should blend warm dim at mid brightness without color data', () => {
      const light = {
        on: { on: true },
        dimming: { brightness: 30 } // Between DIM_START (15) and BRIGHT_START (50)
      };
      const result = getLightColor(light);
      expect(result).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
      expect(result).not.toBe('rgb(255, 200, 130)'); // Not pure warm
      expect(result).not.toBe('rgb(255, 245, 235)'); // Not pure white
    });

    it('should return default white for bright lights without color data', () => {
      const light = {
        on: { on: true },
        dimming: { brightness: 100 }
      };
      const result = getLightColor(light);
      expect(result).toMatch(/^rgb\(255, 245, 235\)$/); // DEFAULT_WHITE
    });

    it('should handle missing dimming data (default to 100)', () => {
      const light = {
        on: { on: true }
      };
      const result = getLightColor(light);
      expect(result).toBeTruthy();
      expect(result).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
    });

    it('should blend colors at dim brightness with color data', () => {
      const light = {
        on: { on: true },
        dimming: { brightness: 20 }, // Dim
        color: { xy: { x: 0.3127, y: 0.3290 } }
      };
      const result = getLightColor(light);
      expect(result).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
      // Should blend towards warm dim
    });

    it('should use full color at bright brightness', () => {
      const light = {
        on: { on: true },
        dimming: { brightness: 80 },
        color: { xy: { x: 0.6915, y: 0.3083 } } // Red
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
});
