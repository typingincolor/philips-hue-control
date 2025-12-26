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
  });
});
