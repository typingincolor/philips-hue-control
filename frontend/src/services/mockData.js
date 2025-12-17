// Mock data for testing without a Hue bridge

export const mockLights = {
  errors: [],
  data: [
    {
      id: "light-1",
      on: { on: true },
      dimming: { brightness: 100 },
      color: { xy: { x: 0.6915, y: 0.3083 } }, // Red
      metadata: { name: "Living Room 1" }
    },
    {
      id: "light-2",
      on: { on: true },
      dimming: { brightness: 75 },
      color: { xy: { x: 0.1532, y: 0.0475 } }, // Blue
      metadata: { name: "Living Room 2" }
    },
    {
      id: "light-3",
      on: { on: true },
      dimming: { brightness: 50 },
      color: { xy: { x: 0.1700, y: 0.7000 } }, // Green
      metadata: { name: "Living Room 3" }
    },
    {
      id: "light-4",
      on: { on: true },
      dimming: { brightness: 25 },
      color: { xy: { x: 0.5016, y: 0.4152 } }, // Orange
      metadata: { name: "Living Room 4" }
    },
    {
      id: "light-5",
      on: { on: true },
      dimming: { brightness: 10 },
      color: { xy: { x: 0.3227, y: 0.3290 } }, // Warm White
      metadata: { name: "Living Room 5" }
    },
    {
      id: "light-6",
      on: { on: false },
      dimming: { brightness: 0 },
      color: { xy: { x: 0.3227, y: 0.3290 } },
      metadata: { name: "Living Room 6" }
    },
    {
      id: "light-7",
      on: { on: true },
      dimming: { brightness: 90 },
      color_temperature: { mirek: 153 }, // Cool white
      metadata: { name: "Kitchen 1" }
    },
    {
      id: "light-8",
      on: { on: true },
      dimming: { brightness: 60 },
      color_temperature: { mirek: 250 }, // Neutral white
      metadata: { name: "Kitchen 2" }
    },
    {
      id: "light-9",
      on: { on: true },
      dimming: { brightness: 40 },
      color_temperature: { mirek: 400 }, // Warm white
      metadata: { name: "Kitchen 3" }
    },
    {
      id: "light-10",
      on: { on: true },
      dimming: { brightness: 80 },
      color: { xy: { x: 0.5614, y: 0.4156 } }, // Yellow
      metadata: { name: "Bedroom 1" }
    },
    {
      id: "light-11",
      on: { on: true },
      dimming: { brightness: 45 },
      color: { xy: { x: 0.2731, y: 0.1601 } }, // Purple
      metadata: { name: "Bedroom 2" }
    },
    {
      id: "light-12",
      on: { on: false },
      dimming: { brightness: 0 },
      color: { xy: { x: 0.3227, y: 0.3290 } },
      metadata: { name: "Bedroom 3" }
    }
  ]
};

export const mockRooms = {
  errors: [],
  data: [
    {
      id: "room-1",
      metadata: { name: "Living Room" },
      children: [
        { rid: "device-1", rtype: "device" },
        { rid: "device-2", rtype: "device" }
      ]
    },
    {
      id: "room-2",
      metadata: { name: "Kitchen" },
      children: [
        { rid: "device-3", rtype: "device" }
      ]
    },
    {
      id: "room-3",
      metadata: { name: "Bedroom" },
      children: [
        { rid: "device-4", rtype: "device" }
      ]
    }
  ]
};

export const mockDevices = {
  errors: [],
  data: [
    {
      id: "device-1",
      services: [
        { rid: "light-1", rtype: "light" },
        { rid: "light-2", rtype: "light" },
        { rid: "light-3", rtype: "light" }
      ]
    },
    {
      id: "device-2",
      services: [
        { rid: "light-4", rtype: "light" },
        { rid: "light-5", rtype: "light" },
        { rid: "light-6", rtype: "light" }
      ]
    },
    {
      id: "device-3",
      services: [
        { rid: "light-7", rtype: "light" },
        { rid: "light-8", rtype: "light" },
        { rid: "light-9", rtype: "light" }
      ]
    },
    {
      id: "device-4",
      services: [
        { rid: "light-10", rtype: "light" },
        { rid: "light-11", rtype: "light" },
        { rid: "light-12", rtype: "light" }
      ]
    }
  ]
};

export const mockScenes = {
  errors: [],
  data: [
    {
      id: "scene-1",
      metadata: { name: "Bright" },
      group: { rid: "room-1" }
    },
    {
      id: "scene-2",
      metadata: { name: "Relax" },
      group: { rid: "room-1" }
    },
    {
      id: "scene-3",
      metadata: { name: "Concentrate" },
      group: { rid: "room-2" }
    },
    {
      id: "scene-4",
      metadata: { name: "Nightlight" },
      group: { rid: "room-3" }
    }
  ]
};

// Mock API functions that simulate the real API
export const mockApi = {
  async getLights() {
    await delay(300); // Simulate network delay
    return mockLights;
  },

  async getRooms() {
    await delay(200);
    return mockRooms;
  },

  async getResource(bridgeIp, username, resourceType) {
    await delay(200);
    if (resourceType === 'device') {
      return mockDevices;
    }
    return { errors: [], data: [] };
  },

  async getScenes() {
    await delay(200);
    return mockScenes;
  },

  async setLightState(bridgeIp, username, lightId, state) {
    await delay(150);
    console.log(`[MOCK] Setting light ${lightId} to:`, state);

    // Update the mock data
    const light = mockLights.data.find(l => l.id === lightId);
    if (light && state.on) {
      light.on = state.on;
    }

    return { errors: [], data: [{ rid: lightId, rtype: "light" }] };
  },

  async activateScene(bridgeIp, username, sceneId) {
    await delay(200);
    console.log(`[MOCK] Activating scene ${sceneId}`);
    return { errors: [], data: [{ rid: sceneId, rtype: "scene" }] };
  }
};

// Helper function to simulate network delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
