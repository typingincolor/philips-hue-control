export const COLOR_CONFIG = {
  WARM_DIM: { r: 255, g: 200, b: 130 },
  DEFAULT_WHITE: { r: 255, g: 245, b: 235 },
  DIM_THRESHOLD: {
    START: 15,
    BRIGHT_START: 50,
  },
  SHADOW_THRESHOLD: 50,
  XYZ_TO_RGB_MATRIX: {
    r: [1.656492, -0.354851, -0.255038],
    g: [-0.707196, 1.655397, 0.036152],
    b: [0.051713, -0.121364, 1.01153],
  },
};

// Color temperature range in Kelvin for white ambiance lights
export const COLOR_TEMPERATURE = {
  MIN: 2700, // Warm white
  MAX: 6500, // Cool daylight
  DEFAULT: 4000, // Neutral
};
