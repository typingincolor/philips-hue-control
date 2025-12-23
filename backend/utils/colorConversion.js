const COLOR_CONFIG = {
  WARM_DIM: { r: 255, g: 200, b: 130 },
  DEFAULT_WHITE: { r: 255, g: 245, b: 235 },
  DIM_THRESHOLD: {
    START: 15,
    BRIGHT_START: 50
  },
  SHADOW_THRESHOLD: 50,
  XYZ_TO_RGB_MATRIX: {
    r: [1.656492, -0.354851, -0.255038],
    g: [-0.707196, 1.655397, 0.036152],
    b: [0.051713, -0.121364, 1.011530]
  }
};

/**
 * Convert Hue XY color coordinates (CIE 1931) to RGB
 * @param {number} x - X coordinate (0-1)
 * @param {number} y - Y coordinate (0-1)
 * @param {number} brightness - Brightness percentage (0-100)
 * @returns {Object} RGB object with r, g, b values (0-255)
 */
export const xyToRgb = (x, y, brightness = 100) => {
  // Convert xy to XYZ with brightness scaling
  const z = 1.0 - x - y;
  const brightnessScale = Math.pow(brightness / 100, 2.2); // Gamma curve
  const Y = brightnessScale;
  const X = (Y / y) * x;
  const Z = (Y / y) * z;

  // XYZ to RGB (using sRGB D65)
  const matrix = COLOR_CONFIG.XYZ_TO_RGB_MATRIX;
  let r = X * matrix.r[0] + Y * matrix.r[1] + Z * matrix.r[2];
  let g = X * matrix.g[0] + Y * matrix.g[1] + Z * matrix.g[2];
  let b = X * matrix.b[0] + Y * matrix.b[1] + Z * matrix.b[2];

  // Apply gamma correction
  const gammaCorrect = (val) => {
    if (val <= 0.0031308) return 12.92 * val;
    return 1.055 * Math.pow(val, 1.0 / 2.4) - 0.055;
  };

  r = gammaCorrect(r);
  g = gammaCorrect(g);
  b = gammaCorrect(b);

  // Normalize if any value is > 1
  const max = Math.max(r, g, b);
  if (max > 1) {
    r /= max;
    g /= max;
    b /= max;
  }

  // Convert to 0-255 range
  r = Math.max(0, Math.min(255, Math.round(r * 255)));
  g = Math.max(0, Math.min(255, Math.round(g * 255)));
  b = Math.max(0, Math.min(255, Math.round(b * 255)));

  return { r, g, b };
};

/**
 * Convert color temperature (mirek) to RGB
 * @param {number} mirek - Mired color temperature
 * @param {number} brightness - Brightness percentage (0-100)
 * @returns {Object} RGB object with r, g, b values (0-255)
 */
export const mirekToRgb = (mirek, brightness = 100) => {
  // Convert mirek to Kelvin (mirek = 1,000,000 / Kelvin)
  const kelvin = 1000000 / mirek;
  const temp = kelvin / 100;

  let r, g, b;

  // Calculate red
  if (temp <= 66) {
    r = 255;
  } else {
    r = temp - 60;
    r = 329.698727446 * Math.pow(r, -0.1332047592);
    r = Math.max(0, Math.min(255, r));
  }

  // Calculate green
  if (temp <= 66) {
    g = temp;
    g = 99.4708025861 * Math.log(g) - 161.1195681661;
  } else {
    g = temp - 60;
    g = 288.1221695283 * Math.pow(g, -0.0755148492);
  }
  g = Math.max(0, Math.min(255, g));

  // Calculate blue
  if (temp >= 66) {
    b = 255;
  } else if (temp <= 19) {
    b = 0;
  } else {
    b = temp - 10;
    b = 138.5177312231 * Math.log(b) - 305.0447927307;
    b = Math.max(0, Math.min(255, b));
  }

  // Apply brightness scaling
  const brightnessScale = brightness / 100;
  r = Math.round(r * brightnessScale);
  g = Math.round(g * brightnessScale);
  b = Math.round(b * brightnessScale);

  return { r, g, b };
};

/**
 * Get CSS color for a light with warm dim blending
 * @param {Object} light - Hue light object
 * @returns {string|null} CSS rgb() color string or null
 */
export const getLightColor = (light) => {
  if (!light.on?.on) return null;

  const brightness = light.dimming?.brightness ?? 100;

  // Get actual light color
  let baseColor = null;
  if (light.color?.xy) {
    const { x, y } = light.color.xy;
    baseColor = xyToRgb(x, y, 100); // Full saturation first
  } else if (light.color_temperature?.mirek) {
    baseColor = mirekToRgb(light.color_temperature.mirek, 100);
  }

  // If no color data available, use intelligent fallback
  if (!baseColor) {
    // Assume neutral white as default - prevents green flash during API data load
    // Most color-capable lights default to neutral/warm white
    const DEFAULT_WHITE = COLOR_CONFIG.DEFAULT_WHITE;
    const WARM_DIM_COLOR = COLOR_CONFIG.WARM_DIM;
    const DIM_START = COLOR_CONFIG.DIM_THRESHOLD.START;
    const BRIGHT_START = COLOR_CONFIG.DIM_THRESHOLD.BRIGHT_START;

    // For dim lights, use warm candlelight color
    if (brightness < DIM_START) {
      return `rgb(${WARM_DIM_COLOR.r}, ${WARM_DIM_COLOR.g}, ${WARM_DIM_COLOR.b})`;
    }
    // For mid-range, blend between warm dim and neutral white
    else if (brightness < BRIGHT_START) {
      const t = (brightness - DIM_START) / (BRIGHT_START - DIM_START);
      const blendFactor = t * t * (3 - 2 * t);
      const r = Math.round(WARM_DIM_COLOR.r * (1 - blendFactor) + DEFAULT_WHITE.r * blendFactor);
      const g = Math.round(WARM_DIM_COLOR.g * (1 - blendFactor) + DEFAULT_WHITE.g * blendFactor);
      const b = Math.round(WARM_DIM_COLOR.b * (1 - blendFactor) + DEFAULT_WHITE.b * blendFactor);
      return `rgb(${r}, ${g}, ${b})`;
    }
    // For bright lights, use neutral white until color data loads
    return `rgb(${DEFAULT_WHITE.r}, ${DEFAULT_WHITE.g}, ${DEFAULT_WHITE.b})`;
  }

  // Calculate blend factor using smoothstep
  const WARM_DIM_COLOR = COLOR_CONFIG.WARM_DIM;
  const DIM_START = COLOR_CONFIG.DIM_THRESHOLD.START;
  const BRIGHT_START = COLOR_CONFIG.DIM_THRESHOLD.BRIGHT_START;

  let blendFactor;
  if (brightness <= DIM_START) {
    blendFactor = 0; // Pure warm
  } else if (brightness >= BRIGHT_START) {
    blendFactor = 1; // Pure color
  } else {
    const t = (brightness - DIM_START) / (BRIGHT_START - DIM_START);
    blendFactor = t * t * (3 - 2 * t); // Smoothstep curve
  }

  // Blend colors (blending already accounts for perceived dimness)
  const r = Math.round(WARM_DIM_COLOR.r * (1 - blendFactor) + baseColor.r * blendFactor);
  const g = Math.round(WARM_DIM_COLOR.g * (1 - blendFactor) + baseColor.g * blendFactor);
  const b = Math.round(WARM_DIM_COLOR.b * (1 - blendFactor) + baseColor.b * blendFactor);

  return `rgb(${r}, ${g}, ${b})`;
};

/**
 * Get shadow styling for a light based on brightness
 * @param {Object} light - Hue light object
 * @param {string} lightColor - CSS color string
 * @returns {string|null} CSS box-shadow string or null
 */
export const getLightShadow = (light, lightColor) => {
  if (!lightColor || !light.on?.on) return null;

  const brightness = light.dimming?.brightness ?? 100;
  const SHADOW_THRESHOLD = COLOR_CONFIG.SHADOW_THRESHOLD;

  if (brightness < SHADOW_THRESHOLD) {
    // Dim lights: neutral shadow only
    return '0 2px 6px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)';
  } else {
    // Bright lights: colored glow + depth shadow
    const glowIntensity = Math.round(((brightness - SHADOW_THRESHOLD) / (100 - SHADOW_THRESHOLD)) * 40 + 20);
    const glowOpacity = glowIntensity.toString(16).padStart(2, '0');
    return `0 4px 12px ${lightColor}${glowOpacity}, 0 2px 4px rgba(0, 0, 0, 0.1)`;
  }
};
