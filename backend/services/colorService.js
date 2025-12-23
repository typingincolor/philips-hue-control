import { xyToRgb, mirekToRgb, getLightColor, getLightShadow } from '../utils/colorConversion.js';

/**
 * ColorService - Color conversion and light enrichment
 * Handles all color-related calculations and pre-computation
 */
class ColorService {
  /**
   * Convert XY coordinates to RGB
   */
  xyToRgb(x, y, brightness = 100) {
    return xyToRgb(x, y, brightness);
  }

  /**
   * Convert mirek to RGB
   */
  mirekToRgb(mirek, brightness = 100) {
    return mirekToRgb(mirek, brightness);
  }

  /**
   * Get CSS color for a light
   */
  getLightColor(light) {
    return getLightColor(light);
  }

  /**
   * Get shadow styling for a light
   */
  getLightShadow(light, lightColor) {
    return getLightShadow(light, lightColor);
  }

  /**
   * Enrich a light object with pre-computed color and shadow properties
   * @param {Object} light - Raw Hue light object
   * @returns {Object} Enriched light object with color, shadow, and colorSource properties
   */
  enrichLight(light) {
    // Determine color source
    let colorSource = null;
    if (light.color?.xy) {
      colorSource = 'xy';
    } else if (light.color_temperature?.mirek) {
      colorSource = 'temperature';
    } else if (light.on?.on) {
      colorSource = 'fallback';
    }

    // Get pre-computed color
    const color = this.getLightColor(light);

    // Get pre-computed shadow
    const shadow = this.getLightShadow(light, color);

    // Return enriched light with additional properties
    return {
      id: light.id,
      name: light.metadata?.name || 'Unknown',
      on: light.on?.on ?? false,
      brightness: light.dimming?.brightness ?? 0,
      color,
      shadow,
      colorSource,
      // Keep original data for advanced use cases
      _original: light
    };
  }

  /**
   * Enrich multiple lights
   * @param {Array} lights - Array of raw Hue light objects
   * @returns {Array} Array of enriched light objects
   */
  enrichLights(lights) {
    return lights.map(light => this.enrichLight(light));
  }
}

// Export singleton instance
export default new ColorService();
