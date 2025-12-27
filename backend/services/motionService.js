import { getHueClientForBridge } from './hueClientFactory.js';

/**
 * MotionService - Motion sensor and MotionAware zone handling
 * Handles fetching and parsing motion sensor data
 */
class MotionService {
  /**
   * Parse motion data by combining behaviors (for names) with convenience_area_motion (for status)
   * Also includes zones from motion_area_configuration that don't have MotionAware behaviors
   * @param {Object} behaviorsData - Behaviors data object with data array
   * @param {Object} motionAreasData - Motion areas data object with data array
   * @param {Object} areaConfigData - Motion area configuration data object with data array (optional)
   * @returns {Array} Array of motion sensor objects
   */
  parseMotionSensors(behaviorsData, motionAreasData, areaConfigData = null) {
    if (!behaviorsData?.data || !motionAreasData?.data) return [];

    // Create a map of motion area IDs to their motion status
    const motionStatusMap = {};
    motionAreasData.data.forEach((area) => {
      motionStatusMap[area.id] = {
        motionDetected: area.motion?.motion || false,
        motionValid: area.motion?.motion_valid !== false,
        enabled: area.enabled !== false,
        lastChanged: area.motion?.motion_report?.changed,
      };
    });

    // Track which motion service IDs are covered by MotionAware behaviors
    const coveredMotionServiceIds = new Set();

    // Extract MotionAware zones from behaviors and combine with motion status
    const motionZones = behaviorsData.data
      .filter(
        (behavior) =>
          behavior.configuration?.motion?.motion_service?.rtype === 'convenience_area_motion'
      )
      .map((behavior) => {
        const motionServiceId = behavior.configuration.motion.motion_service.rid;
        coveredMotionServiceIds.add(motionServiceId);
        const status = motionStatusMap[motionServiceId] || {};

        return {
          id: behavior.id,
          name: behavior.metadata?.name || 'Unknown Zone',
          motionDetected: status.motionDetected || false,
          enabled: behavior.enabled && status.enabled,
          reachable: status.motionValid !== false,
          lastChanged: status.lastChanged,
        };
      });

    // Add zones from motion_area_configuration that don't have MotionAware behaviors
    if (areaConfigData?.data) {
      areaConfigData.data.forEach((config) => {
        const motionServiceId = config.motion_area?.rid;
        // Skip if already covered by a MotionAware behavior
        if (!motionServiceId || coveredMotionServiceIds.has(motionServiceId)) {
          return;
        }

        const status = motionStatusMap[motionServiceId] || {};
        motionZones.push({
          id: config.id,
          name: config.name || 'Unknown Zone',
          motionDetected: status.motionDetected || false,
          enabled: config.enabled !== false && status.enabled !== false,
          reachable: status.motionValid !== false,
          lastChanged: status.lastChanged,
        });
      });
    }

    // Sort alphabetically
    motionZones.sort((a, b) => a.name.localeCompare(b.name));

    return motionZones;
  }

  /**
   * Get all motion zones (fetches and parses data)
   * @param {string} bridgeIp - Bridge IP address
   * @param {string} username - Hue username
   * @returns {Object} Object with zones array
   */
  async getMotionZones(bridgeIp, username) {
    try {
      // Get the appropriate client (mock for demo, real otherwise)
      const hueClient = getHueClientForBridge(bridgeIp);

      // Fetch all three endpoints in parallel
      // motion_area_configuration may fail on older bridges, so handle gracefully
      const [behaviorsData, motionAreasData, areaConfigData] = await Promise.all([
        hueClient.getResource(bridgeIp, username, 'behavior_instance'),
        hueClient.getResource(bridgeIp, username, 'convenience_area_motion'),
        hueClient.getResource(bridgeIp, username, 'motion_area_configuration').catch(() => null),
      ]);

      // Parse and combine data
      const zones = this.parseMotionSensors(behaviorsData, motionAreasData, areaConfigData);

      return { zones };
    } catch (error) {
      throw new Error(`Failed to get motion zones: ${error.message}`);
    }
  }
}

// Export singleton instance
export default new MotionService();
