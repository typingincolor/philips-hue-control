import { describe, it, expect } from 'vitest';
import colorService from '../../services/colorService.js';

describe('ColorService', () => {
  describe('enrichLight', () => {
    it('should enrich light with xy color data', () => {
      const light = {
        id: 'light-1',
        metadata: { name: 'Living Room 1' },
        on: { on: true },
        dimming: { brightness: 80 },
        color: { xy: { x: 0.6915, y: 0.3083 } }
      };

      const result = colorService.enrichLight(light);

      expect(result.id).toBe('light-1');
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
        color_temperature: { mirek: 250 }
      };

      const result = colorService.enrichLight(light);

      expect(result.id).toBe('light-2');
      expect(result.name).toBe('Bedroom');
      expect(result.colorSource).toBe('temperature');
      expect(result.color).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
    });

    it('should use fallback color when no color data present', () => {
      const light = {
        id: 'light-3',
        metadata: { name: 'Kitchen' },
        on: { on: true },
        dimming: { brightness: 100 }
      };

      const result = colorService.enrichLight(light);

      expect(result.colorSource).toBe('fallback');
      expect(result.color).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
    });

    it('should return null color for lights that are off', () => {
      const light = {
        id: 'light-4',
        metadata: { name: 'Hallway' },
        on: { on: false },
        dimming: { brightness: 0 }
      };

      const result = colorService.enrichLight(light);

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
        color: { xy: { x: 0.3127, y: 0.3290 } }
      };

      const result = colorService.enrichLight(light);

      expect(result.name).toBe('Unknown');
    });

    it('should handle missing on state (defaults to false)', () => {
      const light = {
        id: 'light-6',
        metadata: { name: 'Test' },
        dimming: { brightness: 50 }
      };

      const result = colorService.enrichLight(light);

      expect(result.on).toBe(false);
    });

    it('should handle missing brightness (defaults to 0)', () => {
      const light = {
        id: 'light-7',
        metadata: { name: 'Test' },
        on: { on: true }
      };

      const result = colorService.enrichLight(light);

      expect(result.brightness).toBe(0);
    });

    it('should prefer xy color over temperature when both present', () => {
      const light = {
        id: 'light-8',
        metadata: { name: 'Test' },
        on: { on: true },
        dimming: { brightness: 100 },
        color: { xy: { x: 0.6915, y: 0.3083 } },
        color_temperature: { mirek: 250 }
      };

      const result = colorService.enrichLight(light);

      expect(result.colorSource).toBe('xy');
    });

    it('should generate colored glow for bright lights', () => {
      const light = {
        id: 'light-9',
        metadata: { name: 'Bright Light' },
        on: { on: true },
        dimming: { brightness: 100 },
        color: { xy: { x: 0.6915, y: 0.3083 } }
      };

      const result = colorService.enrichLight(light);

      expect(result.shadow).toContain('rgb');
      expect(result.shadow).toContain('0 4px 12px');
    });

    it('should generate neutral shadow for dim lights', () => {
      const light = {
        id: 'light-10',
        metadata: { name: 'Dim Light' },
        on: { on: true },
        dimming: { brightness: 30 },
        color: { xy: { x: 0.3127, y: 0.3290 } }
      };

      const result = colorService.enrichLight(light);

      expect(result.shadow).toContain('rgba(0, 0, 0');
      expect(result.shadow).toContain('0 2px 6px');
    });

    it('should include original light data for advanced use', () => {
      const light = {
        id: 'light-11',
        metadata: { name: 'Test' },
        on: { on: true },
        dimming: { brightness: 50 },
        customField: 'custom value'
      };

      const result = colorService.enrichLight(light);

      expect(result._original).toEqual(light);
      expect(result._original.customField).toBe('custom value');
    });
  });

  describe('enrichLights', () => {
    it('should enrich multiple lights', () => {
      const lights = [
        {
          id: 'light-1',
          metadata: { name: 'Light 1' },
          on: { on: true },
          dimming: { brightness: 80 },
          color: { xy: { x: 0.6915, y: 0.3083 } }
        },
        {
          id: 'light-2',
          metadata: { name: 'Light 2' },
          on: { on: false },
          dimming: { brightness: 0 }
        }
      ];

      const result = colorService.enrichLights(lights);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('light-1');
      expect(result[0].on).toBe(true);
      expect(result[0].color).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
      expect(result[1].id).toBe('light-2');
      expect(result[1].on).toBe(false);
      expect(result[1].color).toBeNull();
    });

    it('should return empty array for empty input', () => {
      const result = colorService.enrichLights([]);
      expect(result).toEqual([]);
    });

    it('should preserve order of lights', () => {
      const lights = [
        { id: 'light-a', on: { on: true } },
        { id: 'light-b', on: { on: true } },
        { id: 'light-c', on: { on: true } }
      ];

      const result = colorService.enrichLights(lights);

      expect(result[0].id).toBe('light-a');
      expect(result[1].id).toBe('light-b');
      expect(result[2].id).toBe('light-c');
    });
  });
});
