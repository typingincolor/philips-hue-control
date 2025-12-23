import hueClient from './hueClient.js';

/**
 * MotionService - Motion sensor and MotionAware zone handling
 * Handles fetching and parsing motion sensor data
 */
class MotionService {
  /**
   * Parse MotionAware data by combining behaviors (for names) with convenience_area_motion (for status)
   * @param {Object} behaviorsData - Behaviors data object with data array
   * @param {Object} motionAreasData - Motion areas data object with data array
   * @returns {Array} Array of motion sensor objects
   */
  parseMotionSensors(behaviorsData, motionAreasData) {
    if (!behaviorsData?.data || !motionAreasData?.data) return [];

    // Create a map of motion area IDs to their motion status
    const motionStatusMap = {};
    motionAreasData.data.forEach(area => {
      motionStatusMap[area.id] = {
        motionDetected: area.motion?.motion || false,
        motionValid: area.motion?.motion_valid !== false,
        enabled: area.enabled !== false,
        lastChanged: area.motion?.motion_report?.changed
      };
    });

    // Extract MotionAware zones from behaviors and combine with motion status
    const motionZones = behaviorsData.data
      .filter(behavior =>
        behavior.configuration?.motion?.motion_service?.rtype === 'convenience_area_motion'
      )
      .map(behavior => {
        const motionServiceId = behavior.configuration.motion.motion_service.rid;
        const status = motionStatusMap[motionServiceId] || {};

        return {
          id: behavior.id,
          name: behavior.metadata?.name || 'Unknown Zone',
          motionDetected: status.motionDetected || false,
          enabled: behavior.enabled && status.enabled,
          reachable: status.motionValid !== false,
          lastChanged: status.lastChanged
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

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
      // Fetch both endpoints in parallel
      const [behaviorsData, motionAreasData] = await Promise.all([
        hueClient.getResource(bridgeIp, username, 'behavior_instance'),
        hueClient.getResource(bridgeIp, username, 'convenience_area_motion')
      ]);

      // Parse and combine data
      const zones = this.parseMotionSensors(behaviorsData, motionAreasData);

      return { zones };
    } catch (error) {
      throw new Error(`Failed to get motion zones: ${error.message}`);
    }
  }
}

// Export singleton instance
export default new MotionService();
