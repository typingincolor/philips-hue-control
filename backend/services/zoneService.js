/**
 * ZoneService - Zone hierarchy building and statistics
 * Handles zone data processing (zones are custom light groupings that can span rooms)
 */
class ZoneService {
  /**
   * Build zone hierarchy mapping zone names to their lights
   * @param {Object} lightsData - Lights data from Hue API
   * @param {Object} zonesData - Zones data from Hue API
   * @param {Object} devicesData - Devices data from Hue API
   * @returns {Object|null} Zone map or null if data is missing
   */
  buildZoneHierarchy(lightsData, zonesData, devicesData) {
    if (!lightsData?.data || !zonesData?.data) return null;

    // Create light lookup map
    const lightMap = new Map();
    lightsData.data.forEach(light => {
      lightMap.set(light.id, light);
    });

    // Create device → lights map
    const deviceToLights = {};
    if (devicesData?.data) {
      devicesData.data.forEach(device => {
        const lightUuids = device.services
          ?.filter(s => s.rtype === 'light')
          .map(s => s.rid) || [];
        deviceToLights[device.id] = lightUuids;
      });
    }

    const zoneMap = {};

    // Process each zone
    zonesData.data.forEach(zone => {
      const zoneName = zone.metadata?.name || 'Unknown Zone';
      const lightUuids = [];

      // Walk zone children to find lights
      zone.children?.forEach(child => {
        if (child.rtype === 'device') {
          // Get lights from device
          const deviceLights = deviceToLights[child.rid] || [];
          lightUuids.push(...deviceLights);
        } else if (child.rtype === 'light') {
          // Direct light reference
          lightUuids.push(child.rid);
        }
      });

      // Deduplicate and filter existing lights
      const uniqueLightUuids = [...new Set(lightUuids)];
      const lights = uniqueLightUuids
        .map(uuid => lightMap.get(uuid))
        .filter(Boolean);

      if (uniqueLightUuids.length > 0) {
        zoneMap[zoneName] = {
          zoneUuid: zone.id,
          lightUuids: uniqueLightUuids,
          lights
        };
      }
    });

    return zoneMap;
  }

  /**
   * Calculate statistics for a zone's lights
   * @param {Array} lights - Array of light objects
   * @returns {Object} Stats object with lightsOnCount, totalLights, averageBrightness
   */
  calculateZoneStats(lights) {
    if (!lights || lights.length === 0) {
      return {
        lightsOnCount: 0,
        totalLights: 0,
        averageBrightness: 0
      };
    }

    const lightsOn = lights.filter(light => light.on?.on);
    const lightsOnCount = lightsOn.length;
    const totalLights = lights.length;

    // Calculate average brightness of lights that are on
    const averageBrightness = lightsOnCount > 0
      ? lightsOn.reduce((sum, light) => {
          const brightness = light.dimming?.brightness ?? 50; // 50% fallback
          return sum + brightness;
        }, 0) / lightsOnCount
      : 0;

    return {
      lightsOnCount,
      totalLights,
      averageBrightness: Math.round(averageBrightness)
    };
  }

  /**
   * Get scenes for a specific zone
   * @param {Object} scenesData - Scenes data from Hue API
   * @param {string} zoneUuid - Zone UUID to filter by
   * @returns {Array} Array of scene objects for the zone
   */
  getScenesForZone(scenesData, zoneUuid) {
    if (!scenesData?.data) return [];

    return scenesData.data
      .filter(scene => scene.group?.rid === zoneUuid && scene.group?.rtype === 'zone')
      .map(scene => ({
        id: scene.id,
        name: scene.metadata?.name || 'Unknown Scene'
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
}

// Export singleton instance
export default new ZoneService();
