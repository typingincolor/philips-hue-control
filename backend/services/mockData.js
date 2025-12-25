/**
 * Mock data service for demo mode
 * Provides static mock data that mimics Hue API v2 responses
 * Supports state mutations that persist in memory
 */

export const DEMO_BRIDGE_IP = 'demo-bridge';
export const DEMO_USERNAME = 'demo-user';

// Generate forecast dates starting from today
const generateForecastDates = () => {
  const dates = [];
  const today = new Date();

  for (let i = 0; i < 5; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }

  return dates;
};

// Initial light data (Hue API v2 format)
const initialLights = [
  {
    id: 'light-1',
    on: { on: true },
    dimming: { brightness: 100 },
    color: { xy: { x: 0.6915, y: 0.3083 } }, // Red
    metadata: { name: 'Floor Lamp' },
  },
  {
    id: 'light-2',
    on: { on: true },
    dimming: { brightness: 75 },
    color: { xy: { x: 0.1532, y: 0.0475 } }, // Blue
    metadata: { name: 'TV Backlight' },
  },
  {
    id: 'light-3',
    on: { on: true },
    dimming: { brightness: 50 },
    color: { xy: { x: 0.17, y: 0.7 } }, // Green
    metadata: { name: 'Plant Light' },
  },
  {
    id: 'light-4',
    on: { on: true },
    dimming: { brightness: 25 },
    color: { xy: { x: 0.5016, y: 0.4152 } }, // Orange
    metadata: { name: 'Corner Lamp' },
  },
  {
    id: 'light-5',
    on: { on: true },
    dimming: { brightness: 10 },
    color: { xy: { x: 0.3227, y: 0.329 } }, // Warm White
    metadata: { name: 'Accent' },
  },
  {
    id: 'light-6',
    on: { on: false },
    dimming: { brightness: 0 },
    color: { xy: { x: 0.3227, y: 0.329 } },
    metadata: { name: 'Ceiling' },
  },
  {
    id: 'light-7',
    on: { on: true },
    dimming: { brightness: 90 },
    color_temperature: { mirek: 153 }, // Cool white
    metadata: { name: 'Kitchen Ceiling' },
  },
  {
    id: 'light-8',
    on: { on: true },
    dimming: { brightness: 60 },
    color_temperature: { mirek: 250 }, // Neutral white
    metadata: { name: 'Counter' },
  },
  {
    id: 'light-9',
    on: { on: true },
    dimming: { brightness: 40 },
    color_temperature: { mirek: 400 }, // Warm white
    metadata: { name: 'Under Cabinet' },
  },
  {
    id: 'light-10',
    on: { on: true },
    dimming: { brightness: 80 },
    color: { xy: { x: 0.5614, y: 0.4156 } }, // Yellow
    metadata: { name: 'Bedroom Ceiling' },
  },
  {
    id: 'light-11',
    on: { on: true },
    dimming: { brightness: 45 },
    color: { xy: { x: 0.2731, y: 0.1601 } }, // Purple
    metadata: { name: 'Bedside Left' },
  },
  {
    id: 'light-12',
    on: { on: false },
    dimming: { brightness: 0 },
    color: { xy: { x: 0.3227, y: 0.329 } },
    metadata: { name: 'Bedside Right' },
  },
  {
    id: 'light-13',
    on: { on: true },
    dimming: { brightness: 5 },
    color: { xy: { x: 0.6915, y: 0.3083 } }, // Red (warm at low brightness)
    metadata: { name: 'Closet' },
  },
  {
    id: 'light-14',
    on: { on: true },
    dimming: { brightness: 15 },
    color: { xy: { x: 0.1532, y: 0.0475 } }, // Blue (transitioning)
    metadata: { name: 'Reading' },
  },
];

// Room data (Hue API v2 format - rooms reference devices)
const rooms = [
  {
    id: 'room-1',
    metadata: { name: 'Living Room' },
    children: [
      { rid: 'device-1', rtype: 'device' },
      { rid: 'device-2', rtype: 'device' },
    ],
  },
  {
    id: 'room-2',
    metadata: { name: 'Kitchen' },
    children: [{ rid: 'device-3', rtype: 'device' }],
  },
  {
    id: 'room-3',
    metadata: { name: 'Bedroom' },
    children: [
      { rid: 'device-4', rtype: 'device' },
      { rid: 'device-5', rtype: 'device' },
    ],
  },
];

// Device data (Hue API v2 format - devices reference lights)
const devices = [
  {
    id: 'device-1',
    services: [
      { rid: 'light-1', rtype: 'light' },
      { rid: 'light-2', rtype: 'light' },
      { rid: 'light-3', rtype: 'light' },
    ],
  },
  {
    id: 'device-2',
    services: [
      { rid: 'light-4', rtype: 'light' },
      { rid: 'light-5', rtype: 'light' },
      { rid: 'light-6', rtype: 'light' },
    ],
  },
  {
    id: 'device-3',
    services: [
      { rid: 'light-7', rtype: 'light' },
      { rid: 'light-8', rtype: 'light' },
      { rid: 'light-9', rtype: 'light' },
    ],
  },
  {
    id: 'device-4',
    services: [
      { rid: 'light-10', rtype: 'light' },
      { rid: 'light-11', rtype: 'light' },
      { rid: 'light-12', rtype: 'light' },
    ],
  },
  {
    id: 'device-5',
    services: [
      { rid: 'light-13', rtype: 'light' },
      { rid: 'light-14', rtype: 'light' },
    ],
  },
];

// Scene data (Hue API v2 format)
const scenes = [
  { id: 'scene-1', metadata: { name: 'Bright' }, group: { rid: 'room-1' } },
  { id: 'scene-2', metadata: { name: 'Relax' }, group: { rid: 'room-1' } },
  { id: 'scene-3', metadata: { name: 'Movie' }, group: { rid: 'room-1' } },
  { id: 'scene-4', metadata: { name: 'Concentrate' }, group: { rid: 'room-2' } },
  { id: 'scene-5', metadata: { name: 'Cooking' }, group: { rid: 'room-2' } },
  { id: 'scene-6', metadata: { name: 'Nightlight' }, group: { rid: 'room-3' } },
  { id: 'scene-7', metadata: { name: 'Relax' }, group: { rid: 'room-3' } },
  { id: 'scene-8', metadata: { name: 'Read' }, group: { rid: 'room-3' } },
];

// Zone data (Hue API v2 format - zones can span multiple rooms)
const zones = [
  {
    id: 'zone-1',
    metadata: { name: 'Downstairs' },
    children: [
      { rid: 'light-1', rtype: 'light' },
      { rid: 'light-7', rtype: 'light' },
      { rid: 'light-6', rtype: 'light' },
    ],
  },
  {
    id: 'zone-2',
    metadata: { name: 'Upstairs' },
    children: [
      { rid: 'light-10', rtype: 'light' },
      { rid: 'light-11', rtype: 'light' },
      { rid: 'light-12', rtype: 'light' },
    ],
  },
  {
    id: 'zone-3',
    metadata: { name: 'All Lights' },
    children: [
      { rid: 'light-1', rtype: 'light' },
      { rid: 'light-2', rtype: 'light' },
      { rid: 'light-3', rtype: 'light' },
      { rid: 'light-4', rtype: 'light' },
      { rid: 'light-5', rtype: 'light' },
      { rid: 'light-6', rtype: 'light' },
      { rid: 'light-7', rtype: 'light' },
      { rid: 'light-8', rtype: 'light' },
      { rid: 'light-9', rtype: 'light' },
      { rid: 'light-10', rtype: 'light' },
      { rid: 'light-11', rtype: 'light' },
      { rid: 'light-12', rtype: 'light' },
      { rid: 'light-13', rtype: 'light' },
      { rid: 'light-14', rtype: 'light' },
    ],
  },
];

// Motion zones (simplified format for demo)
const initialMotionZones = [
  { id: 'motion-1', name: 'Living Room', motionDetected: false, enabled: true, reachable: true },
  { id: 'motion-2', name: 'Kitchen', motionDetected: false, enabled: true, reachable: true },
  { id: 'motion-3', name: 'Hallway', motionDetected: false, enabled: true, reachable: true },
  { id: 'motion-4', name: 'Garage', motionDetected: false, enabled: true, reachable: true },
];

// Weather data (London demo)
const weatherData = {
  current: {
    temperature: 18,
    weatherCode: 2, // Partly cloudy
    windSpeed: 12,
    time: new Date().toISOString(),
  },
  forecast: [],
};

// Settings (default for demo mode)
const defaultSettings = {
  location: {
    lat: 51.5074,
    lon: -0.1278,
    name: 'London',
  },
  units: 'celsius',
};

// Mutable state (persisted in memory)
let currentLights = JSON.parse(JSON.stringify(initialLights));
let currentMotionZones = JSON.parse(JSON.stringify(initialMotionZones));

/**
 * Deep clone helper
 */
const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

/**
 * Get mock lights (Hue API v2 format)
 */
export const getMockLights = () => ({
  errors: [],
  data: deepClone(currentLights),
});

/**
 * Get mock rooms (Hue API v2 format)
 */
export const getMockRooms = () => ({
  errors: [],
  data: deepClone(rooms),
});

/**
 * Get mock devices (Hue API v2 format)
 */
export const getMockDevices = () => ({
  errors: [],
  data: deepClone(devices),
});

/**
 * Get mock scenes (Hue API v2 format)
 */
export const getMockScenes = () => ({
  errors: [],
  data: deepClone(scenes),
});

/**
 * Get mock zones (Hue API v2 format)
 */
export const getMockZones = () => ({
  errors: [],
  data: deepClone(zones),
});

/**
 * Get mock motion zones (simplified format)
 */
export const getMockMotionZones = () => deepClone(currentMotionZones);

/**
 * Get mock weather data
 */
export const getMockWeather = () => {
  const forecastDates = generateForecastDates();
  return {
    current: { ...weatherData.current, time: new Date().toISOString() },
    forecast: [
      { date: forecastDates[0], weatherCode: 2, high: 20, low: 14 },
      { date: forecastDates[1], weatherCode: 3, high: 18, low: 12 },
      { date: forecastDates[2], weatherCode: 61, high: 15, low: 10 },
      { date: forecastDates[3], weatherCode: 1, high: 19, low: 13 },
      { date: forecastDates[4], weatherCode: 0, high: 22, low: 15 },
    ],
  };
};

/**
 * Get mock settings
 */
export const getMockSettings = () => deepClone(defaultSettings);

/**
 * Update a single mock light's state
 * @param {string} lightId - The light ID to update
 * @param {object} state - The state to merge (e.g., { on: { on: true } })
 * @returns {object} The updated light
 */
export const updateMockLight = (lightId, state) => {
  const lightIndex = currentLights.findIndex((l) => l.id === lightId);
  if (lightIndex === -1) {
    throw new Error(`Light not found: ${lightId}`);
  }

  const light = currentLights[lightIndex];

  // Deep merge the state
  if (state.on) {
    light.on = { ...light.on, ...state.on };
  }
  if (state.dimming) {
    light.dimming = { ...light.dimming, ...state.dimming };
  }
  if (state.color) {
    light.color = { ...light.color, ...state.color };
    if (state.color.xy) {
      light.color.xy = { ...light.color?.xy, ...state.color.xy };
    }
  }
  if (state.color_temperature) {
    light.color_temperature = { ...light.color_temperature, ...state.color_temperature };
  }

  return deepClone(light);
};

/**
 * Update multiple mock lights
 * @param {Array<{lightId: string, state: object}>} updates - Array of updates
 * @returns {Array<object>} Array of updated lights
 */
export const updateMockLights = (updates) => {
  return updates.map(({ lightId, state }) => updateMockLight(lightId, state));
};

/**
 * Set motion detected state for a zone
 * @param {string} zoneId - The motion zone ID
 * @param {boolean} detected - Whether motion is detected
 */
export const setMockMotion = (zoneId, detected) => {
  const zone = currentMotionZones.find((z) => z.id === zoneId);
  if (zone) {
    zone.motionDetected = detected;
  }
};

/**
 * Reset all mock data to initial state
 */
export const resetMockData = () => {
  currentLights = JSON.parse(JSON.stringify(initialLights));
  currentMotionZones = JSON.parse(JSON.stringify(initialMotionZones));
};
