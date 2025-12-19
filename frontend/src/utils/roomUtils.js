/**
 * Get scenes for a specific room UUID
 * @param {Object} scenesData - Scenes data object with data array
 * @param {string} roomUuid - Room UUID
 * @returns {Array} Array of scene objects with uuid and name
 */
export const getScenesForRoom = (scenesData, roomUuid) => {
  if (!scenesData?.data) return [];

  return scenesData.data
    .filter(scene => scene.group?.rid === roomUuid)
    .map(scene => ({
      id: scene.id,
      uuid: scene.id,
      name: scene.metadata?.name || 'Unknown Scene',
      metadata: scene.metadata
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Build room → device → lights hierarchy
 * @param {Object} lightsData - Lights data object with data array
 * @param {Object} roomsData - Rooms data object with data array
 * @param {Object} devicesData - Devices data object with data array
 * @returns {Object} Room map with light assignments
 */
export const buildRoomHierarchy = (lightsData, roomsData, devicesData) => {
  if (!lightsData?.data || !roomsData?.data || !devicesData?.data) return null;

  // Helper to get light by UUID
  const getLightByUuid = (uuid) => {
    return lightsData.data.find(light => light.id === uuid);
  };

  // Build device → lights map
  const deviceToLights = {};
  devicesData.data.forEach(device => {
    const lightUuids = device.services
      ?.filter(s => s.rtype === 'light')
      .map(s => s.rid) || [];
    deviceToLights[device.id] = lightUuids;
  });

  const roomMap = {};

  // Build rooms with their lights
  roomsData.data.forEach(room => {
    const lightUuids = [];

    // Get lights from room's devices
    room.children?.forEach(child => {
      if (child.rtype === 'device') {
        const deviceLights = deviceToLights[child.rid] || [];
        lightUuids.push(...deviceLights);
      } else if (child.rtype === 'light') {
        lightUuids.push(child.rid);
      }
    });

    if (lightUuids.length > 0) {
      roomMap[room.metadata?.name || 'Unknown Room'] = {
        roomUuid: room.id,
        lightUuids: [...new Set(lightUuids)], // Deduplicate
        lights: lightUuids
          .map(uuid => getLightByUuid(uuid))
          .filter(Boolean)
      };
    }
  });

  // Add unassigned lights
  const assignedLightUuids = new Set(
    Object.values(roomMap).flatMap(r => r.lightUuids)
  );
  const unassignedLights = lightsData.data.filter(
    light => !assignedLightUuids.has(light.id)
  );

  if (unassignedLights.length > 0) {
    roomMap['Unassigned'] = {
      roomUuid: null,
      lightUuids: unassignedLights.map(l => l.id),
      lights: unassignedLights
    };
  }

  return roomMap;
};

/**
 * Calculate room statistics (lights on/off, average brightness)
 * @param {Array} roomLights - Array of light objects
 * @returns {Object} Stats object with lightsOnCount, totalLights, averageBrightness
 */
export const calculateRoomStats = (roomLights) => {
  if (!roomLights || roomLights.length === 0) {
    return { lightsOnCount: 0, totalLights: 0, averageBrightness: 0 };
  }

  const lightsOnCount = roomLights.filter(light => light.on?.on).length;
  const totalLights = roomLights.length;

  // Calculate average brightness of lights that are on
  const lightsOn = roomLights.filter(light => light.on?.on);
  const averageBrightness = lightsOn.length > 0
    ? lightsOn.reduce((sum, light) => {
        // Use 50% as default during scene transitions when brightness data is loading
        const brightness = light.dimming?.brightness ?? 50;
        return sum + brightness;
      }, 0) / lightsOn.length
    : 0;

  return { lightsOnCount, totalLights, averageBrightness };
};
