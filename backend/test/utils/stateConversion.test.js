import { describe, it, expect } from 'vitest';
import { convertToHueState } from '../../utils/stateConversion.js';

describe('stateConversion', () => {
  describe('convertToHueState', () => {
    it('should convert state properties to Hue API v2 format', () => {
      expect(convertToHueState({ on: true })).toEqual({ on: { on: true } });
      expect(convertToHueState({ on: false })).toEqual({ on: { on: false } });
      expect(convertToHueState({ brightness: 75 })).toEqual({ dimming: { brightness: 75 } });
      expect(convertToHueState({ on: true, brightness: 50 })).toEqual({
        on: { on: true },
        dimming: { brightness: 50 },
      });
    });

    it('should handle edge cases', () => {
      // Empty/null/undefined return empty object
      expect(convertToHueState({})).toEqual({});
      expect(convertToHueState(null)).toEqual({});
      expect(convertToHueState(undefined)).toEqual({});

      // Brightness boundaries
      expect(convertToHueState({ brightness: 0 })).toEqual({ dimming: { brightness: 0 } });
      expect(convertToHueState({ brightness: 100 })).toEqual({ dimming: { brightness: 100 } });

      // Unknown properties are ignored
      expect(convertToHueState({ on: true, unknownProp: 'value' })).toEqual({ on: { on: true } });
    });

    it('should convert colorTemperature from Kelvin to mirek', () => {
      // 6500K (cool white) = ~154 mirek
      expect(convertToHueState({ colorTemperature: 6500 })).toEqual({
        color_temperature: { mirek: 154 },
      });

      // 2700K (warm white) = ~370 mirek
      expect(convertToHueState({ colorTemperature: 2700 })).toEqual({
        color_temperature: { mirek: 370 },
      });

      // 4000K (neutral) = 250 mirek
      expect(convertToHueState({ colorTemperature: 4000 })).toEqual({
        color_temperature: { mirek: 250 },
      });

      // Combined with other properties
      expect(convertToHueState({ on: true, brightness: 80, colorTemperature: 4000 })).toEqual({
        on: { on: true },
        dimming: { brightness: 80 },
        color_temperature: { mirek: 250 },
      });
    });

    it('should clamp colorTemperature to valid range', () => {
      // Below 2000K should clamp to 2000K = 500 mirek
      expect(convertToHueState({ colorTemperature: 1000 })).toEqual({
        color_temperature: { mirek: 500 },
      });

      // Above 6500K should clamp to 6500K = ~154 mirek
      expect(convertToHueState({ colorTemperature: 10000 })).toEqual({
        color_temperature: { mirek: 154 },
      });
    });
  });
});
