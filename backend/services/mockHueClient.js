/**
 * MockHueClient - Mock implementation of HueClient for demo mode
 * Has the same interface as HueClient but returns mock data
 */

import {
  getMockLights,
  getMockRooms,
  getMockDevices,
  getMockScenes,
  getMockZones,
  getMockMotionZones,
  updateMockLight,
  updateMockLights,
} from './mockData.js';

/**
 * MockHueClient class - mirrors HueClient interface
 * All methods are async to match HueClient's Promise-based API
 */
class MockHueClient {
  /**
   * Get all lights
   */
  async getLights() {
    return getMockLights();
  }

  /**
   * Get all rooms
   */
  async getRooms() {
    return getMockRooms();
  }

  /**
   * Get all devices
   */
  async getDevices() {
    return getMockDevices();
  }

  /**
   * Get all scenes
   */
  async getScenes() {
    return getMockScenes();
  }

  /**
   * Get all zones
   */
  async getZones() {
    return getMockZones();
  }

  /**
   * Get a specific resource type
   * @param {string} _bridgeIp - Ignored in mock
   * @param {string} _username - Ignored in mock
   * @param {string} resourceType - Resource type to fetch
   */
  async getResource(_bridgeIp, _username, resourceType) {
    switch (resourceType) {
      case 'behavior_instance':
        return this._getBehaviorInstances();
      case 'convenience_area_motion':
        return this._getConvenienceAreaMotion();
      case 'light':
        return getMockLights();
      case 'room':
        return getMockRooms();
      case 'device':
        return getMockDevices();
      case 'scene':
        return getMockScenes();
      case 'zone':
        return getMockZones();
      default:
        return { errors: [], data: [] };
    }
  }

  /**
   * Get behavior instances (motion zone configurations)
   * @private
   */
  _getBehaviorInstances() {
    const motionZones = getMockMotionZones();
    return {
      errors: [],
      data: motionZones.map((zone) => ({
        id: `behavior-${zone.id}`,
        type: 'behavior_instance',
        enabled: zone.enabled,
        configuration: {
          name: zone.name,
          motion: {
            motion_service: {
              rid: `motion-service-${zone.id}`,
              rtype: 'convenience_area_motion',
            },
          },
        },
      })),
    };
  }

  /**
   * Get convenience area motion data
   * @private
   */
  _getConvenienceAreaMotion() {
    const motionZones = getMockMotionZones();
    return {
      errors: [],
      data: motionZones.map((zone) => ({
        id: `motion-service-${zone.id}`,
        type: 'convenience_area_motion',
        motion: {
          motion: zone.motionDetected,
          motion_valid: zone.reachable,
        },
      })),
    };
  }

  /**
   * Update a light's state
   * @param {string} _bridgeIp - Ignored in mock
   * @param {string} _username - Ignored in mock
   * @param {string} lightId - The light ID to update
   * @param {object} state - The state to apply
   */
  async updateLight(_bridgeIp, _username, lightId, state) {
    const updatedLight = updateMockLight(lightId, state);
    return {
      errors: [],
      data: [{ rid: updatedLight.id, rtype: 'light' }],
    };
  }

  /**
   * Update multiple lights
   * @param {string} _bridgeIp - Ignored in mock
   * @param {string} _username - Ignored in mock
   * @param {Array<{lightId: string, state: object}>} updates - Light updates
   */
  async updateLights(_bridgeIp, _username, updates) {
    const results = updateMockLights(updates);
    return results.map((light) => ({
      errors: [],
      data: [{ rid: light.id, rtype: 'light' }],
    }));
  }

  /**
   * Activate a scene
   * Returns the light IDs that would be affected by the scene
   * @param {string} _bridgeIp - Ignored in mock
   * @param {string} _username - Ignored in mock
   * @param {string} sceneId - The scene ID to activate
   */
  async activateScene(_bridgeIp, _username, sceneId) {
    const scenes = getMockScenes().data;
    const scene = scenes.find((s) => s.id === sceneId);

    if (!scene) {
      return { errors: [], data: [] };
    }

    // Get the room or zone for this scene
    const roomId = scene.group?.rid;
    if (!roomId) {
      return { errors: [], data: [] };
    }

    // Get lights in the room
    const rooms = getMockRooms().data;
    const zones = getMockZones().data;
    const devices = getMockDevices().data;

    // Build device to lights map
    const deviceToLights = new Map();
    for (const device of devices) {
      const lightIds = device.services.filter((s) => s.rtype === 'light').map((s) => s.rid);
      deviceToLights.set(device.id, lightIds);
    }

    // Find lights for this room/zone
    let affectedLightIds = [];

    const room = rooms.find((r) => r.id === roomId);
    if (room) {
      for (const child of room.children) {
        if (child.rtype === 'device') {
          const lights = deviceToLights.get(child.rid) || [];
          affectedLightIds.push(...lights);
        }
      }
    }

    const zone = zones.find((z) => z.id === roomId);
    if (zone) {
      for (const child of zone.children) {
        if (child.rtype === 'light') {
          affectedLightIds.push(child.rid);
        }
      }
    }

    // Deduplicate
    affectedLightIds = [...new Set(affectedLightIds)];

    // In a real scene, we'd set specific colors/brightness per light
    // For demo, we just return which lights would be affected
    return {
      errors: [],
      data: affectedLightIds.map((id) => ({ rid: id, rtype: 'light' })),
    };
  }

  /**
   * Get room hierarchy data (lights, rooms, devices) in parallel
   */
  async getHierarchyData() {
    const [lightsData, roomsData, devicesData] = await Promise.all([
      this.getLights(),
      this.getRooms(),
      this.getDevices(),
    ]);

    return { lightsData, roomsData, devicesData };
  }

  /**
   * Get zone hierarchy data (lights, zones, devices) in parallel
   */
  async getZoneHierarchyData() {
    const [lightsData, zonesData, devicesData] = await Promise.all([
      this.getLights(),
      this.getZones(),
      this.getDevices(),
    ]);

    return { lightsData, zonesData, devicesData };
  }

  /**
   * Get dashboard data (lights, rooms, devices, scenes) in parallel
   */
  async getDashboardData() {
    const [lightsData, roomsData, devicesData, scenesData] = await Promise.all([
      this.getLights(),
      this.getRooms(),
      this.getDevices(),
      this.getScenes(),
    ]);

    return { lightsData, roomsData, devicesData, scenesData };
  }

  /**
   * Get motion data (behavior instances and motion status)
   */
  async getMotionData() {
    const [behaviorData, motionData] = await Promise.all([
      this._getBehaviorInstances(),
      this._getConvenienceAreaMotion(),
    ]);

    return { behaviorData, motionData };
  }

  /**
   * Clear cache - no-op for mock client
   */
  clearCache() {
    // No caching needed for mock data
  }
}

// Export singleton instance to match HueClient pattern
export default new MockHueClient();
