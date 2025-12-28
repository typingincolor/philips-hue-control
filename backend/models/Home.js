/**
 * Home Model - Unified home representation aggregating all services
 */

import { DeviceTypes } from './Device.js';

/**
 * Calculate room statistics from devices
 * @param {Object[]} devices - Array of device objects
 * @returns {Object} Room stats
 */
function calculateRoomStats(devices) {
  const lights = devices.filter((d) => d.type === DeviceTypes.LIGHT);
  const lightsOn = lights.filter((d) => d.state?.on);

  let averageBrightness = 0;
  if (lightsOn.length > 0) {
    const totalBrightness = lightsOn.reduce((sum, d) => sum + (d.state?.brightness || 0), 0);
    averageBrightness = Math.round(totalBrightness / lightsOn.length);
  }

  return {
    totalDevices: devices.length,
    lightsOn: lightsOn.length,
    averageBrightness,
  };
}

/**
 * Create a room object with calculated stats
 * @param {Object} params - Room parameters
 * @param {string} params.id - Room ID
 * @param {string} params.name - Room name
 * @param {Object[]} params.devices - Devices in the room
 * @param {Object[]} [params.scenes] - Room scenes
 * @returns {Object} Room object
 */
export function createRoom({ id, name, devices = [], scenes = [] }) {
  if (!id) {
    throw new Error('Room id is required');
  }
  if (!name) {
    throw new Error('Room name is required');
  }

  return {
    id,
    name,
    devices,
    scenes,
    stats: calculateRoomStats(devices),
  };
}

/**
 * Calculate home summary statistics
 * @param {Object[]} rooms - Array of room objects
 * @param {Object[]} homeDevices - Array of home-level devices
 * @returns {Object} Summary stats
 */
export function calculateHomeSummary(rooms, homeDevices) {
  let totalLights = 0;
  let lightsOn = 0;
  let sceneCount = 0;

  for (const room of rooms) {
    const lights = (room.devices || []).filter((d) => d.type === DeviceTypes.LIGHT);
    totalLights += lights.length;
    lightsOn += lights.filter((d) => d.state?.on).length;
    sceneCount += (room.scenes || []).length;
  }

  return {
    totalLights,
    lightsOn,
    roomCount: rooms.length,
    sceneCount,
    homeDeviceCount: homeDevices.length,
  };
}

/**
 * Create a home object with rooms and home-level devices
 * @param {Object} params - Home parameters
 * @param {Object[]} params.rooms - Rooms in the home
 * @param {Object[]} params.devices - Home-level devices (not in rooms)
 * @param {Object[]} [params.zones] - Optional zones
 * @returns {Object} Home object
 */
export function createHome({ rooms = [], devices = [], zones = [] }) {
  return {
    rooms,
    devices,
    zones,
    summary: calculateHomeSummary(rooms, devices),
  };
}
