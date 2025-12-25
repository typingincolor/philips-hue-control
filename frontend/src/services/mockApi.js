// Mock API service for demo mode
// Provides the same interface as hueApi.js but returns mock data

import { mockLights, mockRooms, mockDevices, mockScenes, mockDashboard } from './mockData';

// Helper function to simulate network delay
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Random motion detection system for demo mode
let motionCallbacks = [];
let motionTimerId = null;

const triggerMotionInZone = (zone) => {
  zone.motionDetected = true;
  console.log(`[MOCK] Motion detected in: ${zone.name}`);
  motionCallbacks.forEach((cb) => cb([...mockDashboard.motionZones]));

  // Clear motion after 5 seconds
  setTimeout(() => {
    zone.motionDetected = false;
    motionCallbacks.forEach((cb) => cb([...mockDashboard.motionZones]));
  }, 5000);
};

const triggerRandomMotion = () => {
  const reachableZones = mockDashboard.motionZones.filter((z) => z.reachable);
  if (reachableZones.length === 0) return;

  // Shuffle zones for random selection
  const shuffled = [...reachableZones].sort(() => Math.random() - 0.5);

  // 30% chance of multiple zones (simulating walking through rooms)
  const triggerMultiple = Math.random() < 0.3 && shuffled.length > 1;
  const zonesToTrigger = triggerMultiple
    ? shuffled.slice(0, Math.min(2 + Math.floor(Math.random() * 2), shuffled.length)) // 2-3 zones
    : [shuffled[0]];

  // Trigger zones with slight delays between them (0.5-1.5s apart)
  zonesToTrigger.forEach((zone, index) => {
    const delayMs = index * (500 + Math.random() * 1000);
    setTimeout(() => triggerMotionInZone(zone), delayMs);
  });

  // Schedule next motion (random 10-60 seconds)
  const nextDelay = 10000 + Math.random() * 50000;
  motionTimerId = setTimeout(triggerRandomMotion, nextDelay);
};

const startMotionSimulation = () => {
  if (motionTimerId) return; // Already running

  // Initial delay of 3-10 seconds before first motion
  const initialDelay = 3000 + Math.random() * 7000;
  motionTimerId = setTimeout(triggerRandomMotion, initialDelay);
  console.log('[MOCK] Motion simulation started');
};

const stopMotionSimulation = () => {
  if (motionTimerId) {
    clearTimeout(motionTimerId);
    motionTimerId = null;
  }
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
    return { zones: mockDashboard.motionZones };
  },

  async updateLight(sessionToken, lightId, state) {
    await delay(150);
    console.log(`[MOCK] updateLight ${lightId}:`, state);

    // Find and update the light in mockDashboard
    let updatedLight = null;
    for (const room of mockDashboard.rooms) {
      const light = room.lights.find((l) => l.id === lightId);
      if (light) {
        light.on = state.on ?? light.on;
        if (state.brightness !== undefined) {
          light.brightness = state.brightness;
        }
        updatedLight = { ...light };
      }
    }

    return { light: updatedLight || { id: lightId, ...state } };
  },

  async updateRoomLights(sessionToken, roomId, state) {
    await delay(200);
    console.log(`[MOCK] updateRoomLights ${roomId}:`, state);

    const room = mockDashboard.rooms.find((r) => r.id === roomId);
    if (room) {
      room.lights.forEach((light) => {
        light.on = state.on ?? light.on;
      });
      return { updatedLights: room.lights };
    }

    return { updatedLights: [] };
  },

  async updateZoneLights(sessionToken, zoneId, state) {
    await delay(200);
    console.log(`[MOCK] updateZoneLights ${zoneId}:`, state);

    const zone = mockDashboard.zones.find((z) => z.id === zoneId);
    if (zone) {
      zone.lights.forEach((light) => {
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

  async createSession(bridgeIp, _username) {
    await delay(100);
    console.log('[MOCK] createSession called');
    return {
      sessionToken: 'demo-session-token',
      expiresIn: 86400,
      bridgeIp,
    };
  },

  async refreshSession(_sessionToken) {
    await delay(100);
    console.log('[MOCK] refreshSession called');
    return {
      sessionToken: 'demo-session-token-refreshed',
      expiresIn: 86400,
      bridgeIp: 'demo-bridge',
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

    const light = mockLights.data.find((l) => l.id === lightId);
    if (light && state.on) {
      light.on = state.on;
    }

    return { errors: [], data: [{ rid: lightId, rtype: 'light' }] };
  },

  async activateScene(bridgeIp, username, sceneId) {
    await delay(200);
    console.log(`[MOCK] Activating scene ${sceneId}`);
    return { errors: [], data: [{ rid: sceneId, rtype: 'scene' }] };
  },

  // Subscribe to motion updates (demo mode only)
  subscribeToMotion(callback) {
    motionCallbacks.push(callback);
    startMotionSimulation();

    // Return unsubscribe function
    return () => {
      motionCallbacks = motionCallbacks.filter((cb) => cb !== callback);
      if (motionCallbacks.length === 0) {
        stopMotionSimulation();
      }
    };
  },
};
