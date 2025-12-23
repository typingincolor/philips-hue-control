// Mock data for testing without a Hue bridge

export const mockLights = {
  errors: [],
  data: [
    {
      id: "light-1",
      on: { on: true },
      dimming: { brightness: 100 },
      color: { xy: { x: 0.6915, y: 0.3083 } }, // Red
      metadata: { name: "Bright Red" }
    },
    {
      id: "light-2",
      on: { on: true },
      dimming: { brightness: 75 },
      color: { xy: { x: 0.1532, y: 0.0475 } }, // Blue
      metadata: { name: "Blue 75%" }
    },
    {
      id: "light-3",
      on: { on: true },
      dimming: { brightness: 50 },
      color: { xy: { x: 0.1700, y: 0.7000 } }, // Green
      metadata: { name: "Green 50%" }
    },
    {
      id: "light-4",
      on: { on: true },
      dimming: { brightness: 25 },
      color: { xy: { x: 0.5016, y: 0.4152 } }, // Orange
      metadata: { name: "Dim Orange" }
    },
    {
      id: "light-5",
      on: { on: true },
      dimming: { brightness: 10 },
      color: { xy: { x: 0.3227, y: 0.3290 } }, // Warm White
      metadata: { name: "Very Dim White" }
    },
    {
      id: "light-6",
      on: { on: false },
      dimming: { brightness: 0 },
      color: { xy: { x: 0.3227, y: 0.3290 } },
      metadata: { name: "Off" }
    },
    {
      id: "light-7",
      on: { on: true },
      dimming: { brightness: 90 },
      color_temperature: { mirek: 153 }, // Cool white
      metadata: { name: "Bright Cool" }
    },
    {
      id: "light-8",
      on: { on: true },
      dimming: { brightness: 60 },
      color_temperature: { mirek: 250 }, // Neutral white
      metadata: { name: "Neutral 60%" }
    },
    {
      id: "light-9",
      on: { on: true },
      dimming: { brightness: 40 },
      color_temperature: { mirek: 400 }, // Warm white
      metadata: { name: "Dim Warm" }
    },
    {
      id: "light-10",
      on: { on: true },
      dimming: { brightness: 80 },
      color: { xy: { x: 0.5614, y: 0.4156 } }, // Yellow
      metadata: { name: "Bright Yellow" }
    },
    {
      id: "light-11",
      on: { on: true },
      dimming: { brightness: 45 },
      color: { xy: { x: 0.2731, y: 0.1601 } }, // Purple
      metadata: { name: "Purple 45%" }
    },
    {
      id: "light-12",
      on: { on: false },
      dimming: { brightness: 0 },
      color: { xy: { x: 0.3227, y: 0.3290 } },
      metadata: { name: "Off 2" }
    },
    {
      id: "light-13",
      on: { on: true },
      dimming: { brightness: 5 },
      color: { xy: { x: 0.6915, y: 0.3083 } }, // Red (should look warm)
      metadata: { name: "Very Dim Red" }
    },
    {
      id: "light-14",
      on: { on: true },
      dimming: { brightness: 15 },
      color: { xy: { x: 0.1532, y: 0.0475 } }, // Blue (should start transitioning)
      metadata: { name: "Dim Blue" }
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
        { rid: "device-4", rtype: "device" },
        { rid: "device-5", rtype: "device" }
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
    },
    {
      id: "device-5",
      services: [
        { rid: "light-13", rtype: "light" },
        { rid: "light-14", rtype: "light" }
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

// Mock dashboard data (v1 API format)
const mockDashboard = {
  summary: {
    totalLights: 14,
    lightsOn: 11,
    roomCount: 3,
    sceneCount: 4
  },
  zones: [
    {
      id: "zone-1",
      name: "Downstairs",
      stats: {
        lightsOnCount: 2,
        totalLights: 3,
        averageBrightness: 95
      },
      lights: [
        { id: "light-1", name: "Bright Red", on: true, brightness: 100 },
        { id: "light-7", name: "Bright Cool", on: true, brightness: 90 },
        { id: "light-6", name: "Off", on: false, brightness: 0 }
      ],
      scenes: [
        { id: "scene-z1", name: "Evening" }
      ]
    },
    {
      id: "zone-2",
      name: "Upstairs",
      stats: {
        lightsOnCount: 0,
        totalLights: 2,
        averageBrightness: 0
      },
      lights: [
        { id: "light-12", name: "Off 2", on: false, brightness: 0 },
        { id: "light-6", name: "Off", on: false, brightness: 0 }
      ],
      scenes: [
        { id: "scene-z2", name: "Morning" }
      ]
    },
    {
      id: "zone-3",
      name: "Dining room lamps",
      stats: {
        lightsOnCount: 3,
        totalLights: 3,
        averageBrightness: 68
      },
      lights: [
        { id: "light-2", name: "Blue 75%", on: true, brightness: 75 },
        { id: "light-3", name: "Green 50%", on: true, brightness: 50 },
        { id: "light-10", name: "Bright Yellow", on: true, brightness: 80 }
      ],
      scenes: [
        { id: "scene-z3", name: "Dinner" }
      ]
    }
  ],
  motionZones: [],
  rooms: [
    {
      id: "room-1",
      name: "Living Room",
      stats: {
        lightsOnCount: 5,
        totalLights: 6,
        averageBrightness: 52
      },
      lights: [
        { id: "light-1", name: "Bright Red", on: true, brightness: 100, color: "rgb(255, 120, 100)", shadow: "0 0 30px rgba(255, 120, 100, 0.6)" },
        { id: "light-2", name: "Blue 75%", on: true, brightness: 75, color: "rgb(100, 120, 255)", shadow: "0 0 25px rgba(100, 120, 255, 0.5)" },
        { id: "light-3", name: "Green 50%", on: true, brightness: 50, color: "rgb(120, 255, 120)", shadow: "0 0 20px rgba(120, 255, 120, 0.4)" },
        { id: "light-4", name: "Dim Orange", on: true, brightness: 25, color: "rgb(255, 200, 130)", shadow: "0 4px 8px rgba(0, 0, 0, 0.1)" },
        { id: "light-5", name: "Very Dim White", on: true, brightness: 10, color: "rgb(255, 200, 130)", shadow: "0 4px 8px rgba(0, 0, 0, 0.1)" },
        { id: "light-6", name: "Off", on: false, brightness: 0, color: null, shadow: null }
      ],
      scenes: [
        { id: "scene-1", name: "Bright" },
        { id: "scene-2", name: "Relax" }
      ]
    },
    {
      id: "room-2",
      name: "Kitchen",
      stats: {
        lightsOnCount: 3,
        totalLights: 3,
        averageBrightness: 63
      },
      lights: [
        { id: "light-7", name: "Bright Cool", on: true, brightness: 90, color: "rgb(220, 230, 255)", shadow: "0 0 28px rgba(220, 230, 255, 0.56)" },
        { id: "light-8", name: "Neutral 60%", on: true, brightness: 60, color: "rgb(255, 240, 220)", shadow: "0 0 22px rgba(255, 240, 220, 0.44)" },
        { id: "light-9", name: "Dim Warm", on: true, brightness: 40, color: "rgb(255, 220, 180)", shadow: "0 4px 8px rgba(0, 0, 0, 0.1)" }
      ],
      scenes: [
        { id: "scene-3", name: "Concentrate" }
      ]
    },
    {
      id: "room-3",
      name: "Bedroom",
      stats: {
        lightsOnCount: 3,
        totalLights: 5,
        averageBrightness: 47
      },
      lights: [
        { id: "light-10", name: "Bright Yellow", on: true, brightness: 80, color: "rgb(255, 230, 120)", shadow: "0 0 26px rgba(255, 230, 120, 0.52)" },
        { id: "light-11", name: "Purple 45%", on: true, brightness: 45, color: "rgb(200, 150, 255)", shadow: "0 4px 8px rgba(0, 0, 0, 0.1)" },
        { id: "light-12", name: "Off 2", on: false, brightness: 0, color: null, shadow: null },
        { id: "light-13", name: "Very Dim Red", on: true, brightness: 5, color: "rgb(255, 200, 130)", shadow: "0 4px 8px rgba(0, 0, 0, 0.1)" },
        { id: "light-14", name: "Dim Blue", on: true, brightness: 15, color: "rgb(255, 200, 130)", shadow: "0 4px 8px rgba(0, 0, 0, 0.1)" }
      ],
      scenes: [
        { id: "scene-4", name: "Nightlight" }
      ]
    }
  ]
};

// Mock API functions that simulate the real API
export const mockApi = {
  // V1 API Methods (new simplified API)
  async getDashboard() {
    await delay(300);
    console.log('[MOCK] getDashboard called');
    return mockDashboard;
  },

  async getMotionZones() {
    await delay(200);
    console.log('[MOCK] getMotionZones called');
    return { zones: [] };
  },

  async updateLight(sessionToken, lightId, state) {
    await delay(150);
    console.log(`[MOCK] updateLight ${lightId}:`, state);

    // Find and update the light in mockDashboard
    for (const room of mockDashboard.rooms) {
      const light = room.lights.find(l => l.id === lightId);
      if (light) {
        light.on = state.on ?? light.on;
        if (state.brightness !== undefined) {
          light.brightness = state.brightness;
        }
      }
    }

    return { light: { id: lightId, ...state } };
  },

  async updateRoomLights(sessionToken, roomId, state) {
    await delay(200);
    console.log(`[MOCK] updateRoomLights ${roomId}:`, state);

    const room = mockDashboard.rooms.find(r => r.id === roomId);
    if (room) {
      room.lights.forEach(light => {
        light.on = state.on ?? light.on;
      });
      return { updatedLights: room.lights };
    }

    return { updatedLights: [] };
  },

  async updateZoneLights(sessionToken, zoneId, state) {
    await delay(200);
    console.log(`[MOCK] updateZoneLights ${zoneId}:`, state);

    const zone = mockDashboard.zones.find(z => z.id === zoneId);
    if (zone) {
      zone.lights.forEach(light => {
        light.on = state.on ?? light.on;
      });
      return { updatedLights: zone.lights };
    }

    return { updatedLights: [] };
  },

  async activateSceneV1(sessionToken, sceneId) {
    await delay(200);
    console.log(`[MOCK] activateSceneV1 ${sceneId}`);
    return { affectedLights: [] };
  },

  async createSession(bridgeIp, username) {
    await delay(100);
    console.log('[MOCK] createSession called');
    return {
      sessionToken: 'demo-session-token',
      expiresIn: 86400,
      bridgeIp
    };
  },

  async refreshSession(sessionToken) {
    await delay(100);
    console.log('[MOCK] refreshSession called');
    return {
      sessionToken: 'demo-session-token-refreshed',
      expiresIn: 86400,
      bridgeIp: 'demo-bridge'
    };
  },

  // Legacy V2 API Methods (kept for compatibility)
  async getLights() {
    await delay(300);
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
