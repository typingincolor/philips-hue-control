/**
 * State Conversion Utilities
 * Converts simplified state objects to Hue API v2 format
 */

/**
 * Convert Kelvin to mirek (micro reciprocal degrees)
 * Hue API v2 uses mirek: 153 (cool/6500K) to 500 (warm/2000K)
 * @param {number} kelvin - Color temperature in Kelvin (2000-6500)
 * @returns {number} mirek value (153-500)
 */
function kelvinToMirek(kelvin) {
  // Clamp to valid Kelvin range
  const clampedKelvin = Math.max(2000, Math.min(6500, kelvin));
  // Convert: mirek = 1,000,000 / Kelvin
  return Math.round(1000000 / clampedKelvin);
}

/**
 * Convert simplified state to Hue API v2 format
 * @param {Object} state - Simplified state { on?: boolean, brightness?: number, colorTemperature?: number }
 * @returns {Object} Hue API v2 state { on?: { on: boolean }, dimming?: { brightness: number }, color_temperature?: { mirek: number } }
 */
export function convertToHueState(state) {
  if (!state) {
    return {};
  }

  const hueState = {};

  if (typeof state.on !== 'undefined') {
    hueState.on = { on: state.on };
  }

  if (typeof state.brightness !== 'undefined') {
    hueState.dimming = { brightness: state.brightness };
  }

  if (typeof state.colorTemperature !== 'undefined') {
    hueState.color_temperature = { mirek: kelvinToMirek(state.colorTemperature) };
  }

  return hueState;
}
