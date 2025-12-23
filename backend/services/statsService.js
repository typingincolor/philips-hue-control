/**
 * StatsService - Dashboard statistics calculation
 * Handles aggregation and statistics across all resources
 */
class StatsService {
  /**
   * Calculate dashboard summary statistics
   * @param {Object} lightsData - Lights data object
   * @param {Object} roomMap - Room map from buildRoomHierarchy
   * @param {Object} scenesData - Scenes data object
   * @returns {Object} Summary statistics
   */
  calculateDashboardStats(lightsData, roomMap, scenesData) {
    const totalLights = lightsData?.data?.length || 0;
    const lightsOn = lightsData?.data?.filter(light => light.on?.on).length || 0;
    const roomCount = roomMap ? Object.keys(roomMap).length : 0;
    const sceneCount = scenesData?.data?.length || 0;

    return {
      totalLights,
      lightsOn,
      roomCount,
      sceneCount
    };
  }
}

// Export singleton instance
export default new StatsService();
