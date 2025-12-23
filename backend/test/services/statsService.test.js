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
          { id: 'light-4', on: { on: true } }
        ]
      };
      const roomMap = {
        'Living Room': { lightUuids: ['light-1', 'light-2'] },
        'Bedroom': { lightUuids: ['light-3'] }
      };
      const scenesData = {
        data: [
          { id: 'scene-1', name: 'Bright' },
          { id: 'scene-2', name: 'Relax' },
          { id: 'scene-3', name: 'Concentrate' }
        ]
      };

      const result = statsService.calculateDashboardStats(lightsData, roomMap, scenesData);

      expect(result.totalLights).toBe(4);
      expect(result.lightsOn).toBe(3);
      expect(result.roomCount).toBe(2);
      expect(result.sceneCount).toBe(3);
    });

    it('should return zeros for null inputs', () => {
      const result = statsService.calculateDashboardStats(null, null, null);

      expect(result.totalLights).toBe(0);
      expect(result.lightsOn).toBe(0);
      expect(result.roomCount).toBe(0);
      expect(result.sceneCount).toBe(0);
    });

    it('should handle empty data arrays', () => {
      const lightsData = { data: [] };
      const roomMap = {};
      const scenesData = { data: [] };

      const result = statsService.calculateDashboardStats(lightsData, roomMap, scenesData);

      expect(result.totalLights).toBe(0);
      expect(result.lightsOn).toBe(0);
      expect(result.roomCount).toBe(0);
      expect(result.sceneCount).toBe(0);
    });

    it('should count only lights that are on', () => {
      const lightsData = {
        data: [
          { id: 'light-1', on: { on: false } },
          { id: 'light-2', on: { on: false } },
          { id: 'light-3', on: { on: false } }
        ]
      };

      const result = statsService.calculateDashboardStats(lightsData, null, null);

      expect(result.totalLights).toBe(3);
      expect(result.lightsOn).toBe(0);
    });

    it('should handle lights with missing on state', () => {
      const lightsData = {
        data: [
          { id: 'light-1', on: { on: true } },
          { id: 'light-2' }, // Missing on state
          { id: 'light-3', on: {} } // Missing on.on
        ]
      };

      const result = statsService.calculateDashboardStats(lightsData, null, null);

      expect(result.totalLights).toBe(3);
      expect(result.lightsOn).toBe(1);
    });

    it('should count rooms correctly including Unassigned', () => {
      const roomMap = {
        'Living Room': { lightUuids: ['light-1'] },
        'Bedroom': { lightUuids: ['light-2'] },
        'Unassigned': { lightUuids: ['light-3'] }
      };

      const result = statsService.calculateDashboardStats(null, roomMap, null);

      expect(result.roomCount).toBe(3);
    });

    it('should handle missing data properties', () => {
      const lightsData = {}; // Missing data array
      const scenesData = {}; // Missing data array

      const result = statsService.calculateDashboardStats(lightsData, null, scenesData);

      expect(result.totalLights).toBe(0);
      expect(result.sceneCount).toBe(0);
    });

    it('should handle single light, single room, single scene', () => {
      const lightsData = {
        data: [{ id: 'light-1', on: { on: true } }]
      };
      const roomMap = {
        'Living Room': { lightUuids: ['light-1'] }
      };
      const scenesData = {
        data: [{ id: 'scene-1', name: 'Bright' }]
      };

      const result = statsService.calculateDashboardStats(lightsData, roomMap, scenesData);

      expect(result.totalLights).toBe(1);
      expect(result.lightsOn).toBe(1);
      expect(result.roomCount).toBe(1);
      expect(result.sceneCount).toBe(1);
    });

    it('should handle all lights on', () => {
      const lightsData = {
        data: [
          { id: 'light-1', on: { on: true } },
          { id: 'light-2', on: { on: true } },
          { id: 'light-3', on: { on: true } }
        ]
      };

      const result = statsService.calculateDashboardStats(lightsData, null, null);

      expect(result.totalLights).toBe(3);
      expect(result.lightsOn).toBe(3);
    });

    it('should handle large dataset', () => {
      // Create 100 lights (50 on, 50 off)
      const lights = [];
      for (let i = 0; i < 100; i++) {
        lights.push({
          id: `light-${i}`,
          on: { on: i % 2 === 0 }
        });
      }

      const lightsData = { data: lights };

      // Create 10 rooms
      const roomMap = {};
      for (let i = 0; i < 10; i++) {
        roomMap[`Room ${i}`] = { lightUuids: [] };
      }

      // Create 25 scenes
      const scenes = [];
      for (let i = 0; i < 25; i++) {
        scenes.push({ id: `scene-${i}` });
      }
      const scenesData = { data: scenes };

      const result = statsService.calculateDashboardStats(lightsData, roomMap, scenesData);

      expect(result.totalLights).toBe(100);
      expect(result.lightsOn).toBe(50);
      expect(result.roomCount).toBe(10);
      expect(result.sceneCount).toBe(25);
    });
  });
});
