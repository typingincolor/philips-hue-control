import { describe, it, expect } from 'vitest';
import statsService from '../../services/statsService.js';

describe('StatsService', () => {
  describe('calculateDashboardStats', () => {
    it('should calculate stats for full dashboard data', () => {
      const lightsData = {
        data: [
          { id: 'light-1', on: { on: true } },
          { id: 'light-2', on: { on: false } },
          { id: 'light-3', on: { on: true } },
          { id: 'light-4', on: { on: true } },
        ],
      };
      const roomMap = {
        'Living Room': { lightUuids: ['light-1', 'light-2'] },
        Bedroom: { lightUuids: ['light-3'] },
      };
      const scenesData = {
        data: [
          { id: 'scene-1', name: 'Bright' },
          { id: 'scene-2', name: 'Relax' },
        ],
      };

      const result = statsService.calculateDashboardStats(lightsData, roomMap, scenesData);

      expect(result.totalLights).toBe(4);
      expect(result.lightsOn).toBe(3);
      expect(result.roomCount).toBe(2);
      expect(result.sceneCount).toBe(2);
    });

    it('should handle edge cases and missing data', () => {
      // Null inputs return zeros
      expect(statsService.calculateDashboardStats(null, null, null)).toEqual({
        totalLights: 0,
        lightsOn: 0,
        roomCount: 0,
        sceneCount: 0,
      });

      // Empty data returns zeros
      expect(statsService.calculateDashboardStats({ data: [] }, {}, { data: [] })).toEqual({
        totalLights: 0,
        lightsOn: 0,
        roomCount: 0,
        sceneCount: 0,
      });

      // Missing data properties handled
      expect(statsService.calculateDashboardStats({}, null, {})).toEqual({
        totalLights: 0,
        lightsOn: 0,
        roomCount: 0,
        sceneCount: 0,
      });
    });

    it('should handle lights with missing on state', () => {
      const lightsData = {
        data: [
          { id: 'light-1', on: { on: true } },
          { id: 'light-2' }, // Missing on state
          { id: 'light-3', on: {} }, // Missing on.on
        ],
      };

      const result = statsService.calculateDashboardStats(lightsData, null, null);

      expect(result.totalLights).toBe(3);
      expect(result.lightsOn).toBe(1);
    });
  });
});
