import { describe, it, expect, beforeEach } from 'vitest';
import websocketService from '../../services/websocketService.js';

describe('WebSocketService', () => {
  describe('detectChanges', () => {
    it('should detect motion zone changes when motion is detected', () => {
      const previous = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [],
        motionZones: [
          {
            id: 'zone-1',
            name: 'Hallway MotionAware',
            motionDetected: false,
            enabled: true,
            reachable: true
          }
        ]
      };

      const current = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [],
        motionZones: [
          {
            id: 'zone-1',
            name: 'Hallway MotionAware',
            motionDetected: true, // Changed to true
            enabled: true,
            reachable: true
          }
        ]
      };

      const changes = websocketService.detectChanges(previous, current);

      expect(changes).toContainEqual({
        type: 'motion_zone',
        data: current.motionZones[0]
      });
    });

    it('should detect motion zone changes when motion stops', () => {
      const previous = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [],
        motionZones: [
          {
            id: 'zone-1',
            name: 'Hallway MotionAware',
            motionDetected: true,
            enabled: true,
            reachable: true
          }
        ]
      };

      const current = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [],
        motionZones: [
          {
            id: 'zone-1',
            name: 'Hallway MotionAware',
            motionDetected: false, // Changed to false
            enabled: true,
            reachable: true
          }
        ]
      };

      const changes = websocketService.detectChanges(previous, current);

      expect(changes).toContainEqual({
        type: 'motion_zone',
        data: current.motionZones[0]
      });
    });

    it('should detect motion zone reachability changes', () => {
      const previous = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [],
        motionZones: [
          {
            id: 'zone-1',
            name: 'Hallway MotionAware',
            motionDetected: false,
            enabled: true,
            reachable: true
          }
        ]
      };

      const current = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [],
        motionZones: [
          {
            id: 'zone-1',
            name: 'Hallway MotionAware',
            motionDetected: false,
            enabled: true,
            reachable: false // Changed to false
          }
        ]
      };

      const changes = websocketService.detectChanges(previous, current);

      expect(changes).toContainEqual({
        type: 'motion_zone',
        data: current.motionZones[0]
      });
    });

    it('should not detect changes when motion zones are identical', () => {
      const previous = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [],
        motionZones: [
          {
            id: 'zone-1',
            name: 'Hallway MotionAware',
            motionDetected: false,
            enabled: true,
            reachable: true
          }
        ]
      };

      const current = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [],
        motionZones: [
          {
            id: 'zone-1',
            name: 'Hallway MotionAware',
            motionDetected: false,
            enabled: true,
            reachable: true
          }
        ]
      };

      const changes = websocketService.detectChanges(previous, current);

      // Should not include any motion_zone changes
      const motionZoneChanges = changes.filter(c => c.type === 'motion_zone');
      expect(motionZoneChanges).toHaveLength(0);
    });

    it('should detect changes to multiple motion zones', () => {
      const previous = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [],
        motionZones: [
          {
            id: 'zone-1',
            name: 'Hallway MotionAware',
            motionDetected: false,
            enabled: true,
            reachable: true
          },
          {
            id: 'zone-2',
            name: 'Living Room MotionAware',
            motionDetected: false,
            enabled: true,
            reachable: true
          }
        ]
      };

      const current = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [],
        motionZones: [
          {
            id: 'zone-1',
            name: 'Hallway MotionAware',
            motionDetected: true, // Changed
            enabled: true,
            reachable: true
          },
          {
            id: 'zone-2',
            name: 'Living Room MotionAware',
            motionDetected: true, // Changed
            enabled: true,
            reachable: true
          }
        ]
      };

      const changes = websocketService.detectChanges(previous, current);

      const motionZoneChanges = changes.filter(c => c.type === 'motion_zone');
      expect(motionZoneChanges).toHaveLength(2);
      expect(motionZoneChanges[0].data.id).toBe('zone-1');
      expect(motionZoneChanges[1].data.id).toBe('zone-2');
    });

    it('should handle missing motionZones array gracefully', () => {
      const previous = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: []
        // No motionZones property
      };

      const current = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [],
        motionZones: [
          {
            id: 'zone-1',
            name: 'Hallway MotionAware',
            motionDetected: true,
            enabled: true,
            reachable: true
          }
        ]
      };

      const changes = websocketService.detectChanges(previous, current);

      // Should detect the new motion zone as a change
      expect(changes).toContainEqual({
        type: 'motion_zone',
        data: current.motionZones[0]
      });
    });

    it('should handle empty motionZones array', () => {
      const previous = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [],
        motionZones: []
      };

      const current = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [],
        motionZones: []
      };

      const changes = websocketService.detectChanges(previous, current);

      const motionZoneChanges = changes.filter(c => c.type === 'motion_zone');
      expect(motionZoneChanges).toHaveLength(0);
    });

    // Zone (light grouping) change detection tests
    it('should detect zone changes when light state changes', () => {
      const previous = {
        summary: { lightsOn: 1, totalLights: 2, roomCount: 1, sceneCount: 1 },
        rooms: [],
        zones: [
          {
            id: 'zone-1',
            name: 'Upstairs',
            stats: { lightsOnCount: 1, totalLights: 2, averageBrightness: 80 },
            lights: [
              { id: 'light-1', on: { on: true } },
              { id: 'light-2', on: { on: false } }
            ]
          }
        ]
      };

      const current = {
        summary: { lightsOn: 2, totalLights: 2, roomCount: 1, sceneCount: 1 },
        rooms: [],
        zones: [
          {
            id: 'zone-1',
            name: 'Upstairs',
            stats: { lightsOnCount: 2, totalLights: 2, averageBrightness: 90 },
            lights: [
              { id: 'light-1', on: { on: true } },
              { id: 'light-2', on: { on: true } } // Changed to on
            ]
          }
        ]
      };

      const changes = websocketService.detectChanges(previous, current);

      expect(changes).toContainEqual({
        type: 'zone',
        data: current.zones[0]
      });
    });

    it('should detect zone stats changes', () => {
      const previous = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [],
        zones: [
          {
            id: 'zone-1',
            name: 'Downstairs',
            stats: { lightsOnCount: 1, totalLights: 1, averageBrightness: 50 },
            lights: []
          }
        ]
      };

      const current = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [],
        zones: [
          {
            id: 'zone-1',
            name: 'Downstairs',
            stats: { lightsOnCount: 1, totalLights: 1, averageBrightness: 100 }, // Changed
            lights: []
          }
        ]
      };

      const changes = websocketService.detectChanges(previous, current);

      expect(changes).toContainEqual({
        type: 'zone',
        data: current.zones[0]
      });
    });

    it('should not detect changes when zones are identical', () => {
      const zoneData = {
        id: 'zone-1',
        name: 'Upstairs',
        stats: { lightsOnCount: 1, totalLights: 1, averageBrightness: 80 },
        lights: [{ id: 'light-1', on: { on: true } }]
      };

      const previous = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [],
        zones: [zoneData]
      };

      const current = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [],
        zones: [{ ...zoneData }]
      };

      const changes = websocketService.detectChanges(previous, current);

      const zoneChanges = changes.filter(c => c.type === 'zone');
      expect(zoneChanges).toHaveLength(0);
    });

    it('should detect changes to multiple zones', () => {
      const previous = {
        summary: { lightsOn: 2, totalLights: 2, roomCount: 1, sceneCount: 1 },
        rooms: [],
        zones: [
          { id: 'zone-1', name: 'Upstairs', stats: { lightsOnCount: 1 } },
          { id: 'zone-2', name: 'Downstairs', stats: { lightsOnCount: 1 } }
        ]
      };

      const current = {
        summary: { lightsOn: 0, totalLights: 2, roomCount: 1, sceneCount: 1 },
        rooms: [],
        zones: [
          { id: 'zone-1', name: 'Upstairs', stats: { lightsOnCount: 0 } }, // Changed
          { id: 'zone-2', name: 'Downstairs', stats: { lightsOnCount: 0 } } // Changed
        ]
      };

      const changes = websocketService.detectChanges(previous, current);

      const zoneChanges = changes.filter(c => c.type === 'zone');
      expect(zoneChanges).toHaveLength(2);
      expect(zoneChanges[0].data.id).toBe('zone-1');
      expect(zoneChanges[1].data.id).toBe('zone-2');
    });

    it('should handle missing zones array gracefully', () => {
      const previous = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: []
        // No zones property
      };

      const current = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [],
        zones: [
          { id: 'zone-1', name: 'Upstairs', stats: { lightsOnCount: 1 } }
        ]
      };

      const changes = websocketService.detectChanges(previous, current);

      expect(changes).toContainEqual({
        type: 'zone',
        data: current.zones[0]
      });
    });

    it('should handle empty zones array', () => {
      const previous = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [],
        zones: []
      };

      const current = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [],
        zones: []
      };

      const changes = websocketService.detectChanges(previous, current);

      const zoneChanges = changes.filter(c => c.type === 'zone');
      expect(zoneChanges).toHaveLength(0);
    });
  });
});
