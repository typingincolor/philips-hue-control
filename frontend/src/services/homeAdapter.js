/**
 * Home Adapter - Transforms V2 Home format to V1 Dashboard format
 * This provides backward compatibility during the V1→V2 migration
 */

import * as homeApi from './homeApi';

/**
 * Transform a V2 device to V1 light format
 * @param {Object} device - V2 device object
 * @returns {Object} V1-compatible light object
 */
function transformDeviceToLight(device) {
  if (device.type !== 'light') return null;

  // Extract original ID without service prefix
  const originalId = device.id.includes(':') ? device.id.split(':')[1] : device.id;

  return {
    id: originalId,
    name: device.name,
    on: device.state?.on ?? false,
    brightness: device.state?.brightness ?? 0,
    color: device.state?.color ?? 'rgb(255, 255, 255)',
    shadow: device.state?.shadow ?? 'none',
    colorSource: device.state?.colorSource ?? null,
  };
}

/**
 * Transform a V2 scene to V1 scene format
 * @param {Object} scene - V2 scene object
 * @returns {Object} V1-compatible scene object
 */
function transformScene(scene) {
  // Extract original ID without service prefix
  const originalId = scene.id.includes(':') ? scene.id.split(':')[1] : scene.id;

  return {
    id: originalId,
    name: scene.name,
  };
}

/**
 * Transform a V2 room to V1 room format
 * @param {Object} room - V2 room object
 * @returns {Object} V1-compatible room object
 */
function transformRoom(room) {
  const lights = (room.devices || []).map(transformDeviceToLight).filter((light) => light !== null);

  // Calculate room stats from lights
  const lightsOnCount = lights.filter((l) => l.on).length;
  const totalLights = lights.length;
  const totalBrightness = lights.reduce((sum, l) => sum + (l.on ? l.brightness : 0), 0);
  const averageBrightness = lightsOnCount > 0 ? Math.round(totalBrightness / lightsOnCount) : 0;

  return {
    id: room.id,
    name: room.name,
    lights,
    scenes: (room.scenes || []).map(transformScene),
    stats: {
      lightsOnCount,
      totalLights,
      averageBrightness,
    },
  };
}

/**
 * Transform V2 Home format to V1 Dashboard format
 * @param {Object} home - V2 home object
 * @returns {Object} V1-compatible dashboard object
 */
export function transformHomeToDashboard(home) {
  const rooms = (home.rooms || []).map(transformRoom);

  // Calculate summary
  const totalLights = rooms.reduce((sum, r) => sum + r.lights.length, 0);
  const lightsOn = rooms.reduce((sum, r) => sum + r.stats.lightsOnCount, 0);
  const sceneCount = rooms.reduce((sum, r) => sum + r.scenes.length, 0);

  return {
    summary: {
      totalLights,
      lightsOn,
      roomCount: rooms.length,
      sceneCount,
    },
    rooms,
    // V2 doesn't have zones yet in the home model, return empty
    zones: [],
    // Motion zones not in V2 Home model yet
    motionZones: [],
  };
}

/**
 * Fetch V2 Home data and transform to V1 Dashboard format
 * Drop-in replacement for hueApi.getDashboard()
 * @param {boolean} demoMode - Whether demo mode is enabled
 * @returns {Promise<Object>} V1-compatible dashboard object
 */
export async function getDashboardFromHome(demoMode = false) {
  const home = await homeApi.getHome(demoMode);
  return transformHomeToDashboard(home);
}

// Default service ID for legacy operations (when no service prefix is present)
const DEFAULT_SERVICE_ID = 'hue';

/**
 * Add service prefix to ID if not already present
 * @param {string} id - Device/scene/room/zone ID
 * @returns {string} ID with service prefix
 */
function ensureServicePrefix(id) {
  if (!id) return id;
  return id.includes(':') ? id : `${DEFAULT_SERVICE_ID}:${id}`;
}

/**
 * Update a single light/device
 * Adapter for hueApi.updateLight()
 * @param {string} lightId - Light ID (V1 format, without service prefix)
 * @param {Object} state - New state to apply
 * @param {boolean} demoMode - Whether demo mode is enabled
 * @param {Object} existingLight - Optional existing light data for merging
 * @returns {Promise<Object>} Result object with light property containing merged state
 */
export async function updateLight(lightId, state, demoMode = false, existingLight = null) {
  const fullId = ensureServicePrefix(lightId);
  const result = await homeApi.updateDevice(fullId, state, demoMode);

  // Merge applied state with existing light data for optimistic update
  const mergedLight = existingLight ? { ...existingLight, ...state } : { id: lightId, ...state };

  return {
    success: result.success,
    light: mergedLight,
  };
}

/**
 * Update all lights in a room
 * Adapter for hueApi.updateRoomLights()
 * @param {string} roomId - Room ID (V1 format)
 * @param {Object} state - New state to apply
 * @param {boolean} demoMode - Whether demo mode is enabled
 * @returns {Promise<Object>} Result object with updatedLights property
 */
export async function updateRoomLights(roomId, state, demoMode = false) {
  const result = await homeApi.updateRoomDevices(roomId, state, demoMode);
  return result;
}

/**
 * Update all lights in a zone
 * Adapter for hueApi.updateZoneLights()
 * @param {string} zoneId - Zone ID (V1 format)
 * @param {Object} state - New state to apply
 * @param {boolean} demoMode - Whether demo mode is enabled
 * @returns {Promise<Object>} Result object with updatedLights property
 */
export async function updateZoneLights(zoneId, state, demoMode = false) {
  const result = await homeApi.updateZoneDevices(zoneId, state, demoMode);
  return result;
}

/**
 * Activate a scene
 * Adapter for hueApi.activateSceneV1()
 * @param {string} sceneId - Scene ID (V1 format, without service prefix)
 * @param {boolean} demoMode - Whether demo mode is enabled
 * @returns {Promise<Object>} Result object with affectedLights property
 */
export async function activateSceneV1(sceneId, demoMode = false) {
  const fullId = ensureServicePrefix(sceneId);
  const result = await homeApi.activateScene(fullId, demoMode);

  // Transform response to V1 format
  return {
    affectedLights: result.affectedLights || [],
    ...result,
  };
}
