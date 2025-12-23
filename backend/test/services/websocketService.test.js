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
  });
});
