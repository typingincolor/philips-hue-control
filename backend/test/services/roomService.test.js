import { describe, it, expect } from 'vitest';
import roomService from '../../services/roomService.js';

describe('RoomService', () => {
  describe('getScenesForRoom', () => {
    it('should return empty array when no scenes data', () => {
      const result = roomService.getScenesForRoom(null, 'room-1');
      expect(result).toEqual([]);
    });

    it('should return empty array when scenes data has no data property', () => {
      const result = roomService.getScenesForRoom({}, 'room-1');
      expect(result).toEqual([]);
    });

    it('should filter scenes by room UUID', () => {
      const scenesData = {
        data: [
          { id: 'scene-1', group: { rid: 'room-1' }, metadata: { name: 'Bright' } },
          { id: 'scene-2', group: { rid: 'room-2' }, metadata: { name: 'Dim' } },
          { id: 'scene-3', group: { rid: 'room-1' }, metadata: { name: 'Relax' } }
        ]
      };
      const result = roomService.getScenesForRoom(scenesData, 'room-1');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('scene-1');
      expect(result[1].id).toBe('scene-3');
    });

    it('should sort scenes alphabetically by name', () => {
      const scenesData = {
        data: [
          { id: 'scene-1', group: { rid: 'room-1' }, metadata: { name: 'Zzz Sleep' } },
          { id: 'scene-2', group: { rid: 'room-1' }, metadata: { name: 'Aaa Morning' } },
          { id: 'scene-3', group: { rid: 'room-1' }, metadata: { name: 'Mmm Relax' } }
        ]
      };
      const result = roomService.getScenesForRoom(scenesData, 'room-1');
      expect(result[0].name).toBe('Aaa Morning');
      expect(result[1].name).toBe('Mmm Relax');
      expect(result[2].name).toBe('Zzz Sleep');
    });

    it('should handle scenes without metadata name', () => {
      const scenesData = {
        data: [
          { id: 'scene-1', group: { rid: 'room-1' }, metadata: {} },
          { id: 'scene-2', group: { rid: 'room-1' } }
        ]
      };
      const result = roomService.getScenesForRoom(scenesData, 'room-1');
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Unknown Scene');
      expect(result[1].name).toBe('Unknown Scene');
    });

    it('should return empty array when no scenes match room', () => {
      const scenesData = {
        data: [
          { id: 'scene-1', group: { rid: 'room-2' }, metadata: { name: 'Scene 1' } }
        ]
      };
      const result = roomService.getScenesForRoom(scenesData, 'room-1');
      expect(result).toEqual([]);
    });
  });

  describe('buildRoomHierarchy', () => {
    it('should return null when missing data', () => {
      expect(roomService.buildRoomHierarchy(null, null, null)).toBeNull();
      expect(roomService.buildRoomHierarchy({}, {}, {})).toBeNull();
      expect(roomService.buildRoomHierarchy({ data: [] }, null, null)).toBeNull();
    });

    it('should build room to light mapping via devices', () => {
      const lights = {
        data: [
          { id: 'light-1', metadata: { name: 'Light 1' }, on: { on: true } },
          { id: 'light-2', metadata: { name: 'Light 2' }, on: { on: false } }
        ]
      };
      const rooms = {
        data: [
          {
            id: 'room-1',
            metadata: { name: 'Living Room' },
            children: [{ rid: 'device-1', rtype: 'device' }]
          }
        ]
      };
      const devices = {
        data: [
          {
            id: 'device-1',
            services: [
              { rid: 'light-1', rtype: 'light' },
              { rid: 'light-2', rtype: 'light' }
            ]
          }
        ]
      };

      const result = roomService.buildRoomHierarchy(lights, rooms, devices);
      expect(result).toHaveProperty('Living Room');
      expect(result['Living Room'].lights).toHaveLength(2);
      expect(result['Living Room'].lightUuids).toContain('light-1');
      expect(result['Living Room'].lightUuids).toContain('light-2');
    });

    it('should handle direct light references in rooms', () => {
      const lights = {
        data: [{ id: 'light-1', metadata: { name: 'Light 1' } }]
      };
      const rooms = {
        data: [
          {
            id: 'room-1',
            metadata: { name: 'Bedroom' },
            children: [{ rid: 'light-1', rtype: 'light' }]
          }
        ]
      };
      const devices = { data: [] };

      const result = roomService.buildRoomHierarchy(lights, rooms, devices);
      expect(result['Bedroom'].lights).toHaveLength(1);
      expect(result['Bedroom'].lightUuids).toContain('light-1');
    });

    it('should deduplicate light UUIDs', () => {
      const lights = {
        data: [{ id: 'light-1', metadata: { name: 'Light 1' } }]
      };
      const rooms = {
        data: [
          {
            id: 'room-1',
            metadata: { name: 'Kitchen' },
            children: [
              { rid: 'light-1', rtype: 'light' },
              { rid: 'light-1', rtype: 'light' } // Duplicate
            ]
          }
        ]
      };
      const devices = { data: [] };

      const result = roomService.buildRoomHierarchy(lights, rooms, devices);
      expect(result['Kitchen'].lightUuids).toHaveLength(1);
      expect(result['Kitchen'].lightUuids[0]).toBe('light-1');
    });

    it('should create Unassigned room for lights not in any room', () => {
      const lights = {
        data: [
          { id: 'light-1', metadata: { name: 'Assigned' } },
          { id: 'light-2', metadata: { name: 'Unassigned' } }
        ]
      };
      const rooms = {
        data: [
          {
            id: 'room-1',
            metadata: { name: 'Bedroom' },
            children: [{ rid: 'light-1', rtype: 'light' }]
          }
        ]
      };
      const devices = { data: [] };

      const result = roomService.buildRoomHierarchy(lights, rooms, devices);
      expect(result).toHaveProperty('Unassigned');
      expect(result['Unassigned'].lights).toHaveLength(1);
      expect(result['Unassigned'].lights[0].id).toBe('light-2');
      expect(result['Unassigned'].roomUuid).toBeNull();
    });

    it('should handle rooms with no lights', () => {
      const lights = { data: [] };
      const rooms = {
        data: [
          {
            id: 'room-1',
            metadata: { name: 'Empty Room' },
            children: []
          }
        ]
      };
      const devices = { data: [] };

      const result = roomService.buildRoomHierarchy(lights, rooms, devices);
      expect(result).not.toHaveProperty('Empty Room');
    });

    it('should handle missing room metadata name', () => {
      const lights = {
        data: [{ id: 'light-1', metadata: { name: 'Light 1' } }]
      };
      const rooms = {
        data: [
          {
            id: 'room-1',
            metadata: {},
            children: [{ rid: 'light-1', rtype: 'light' }]
          }
        ]
      };
      const devices = { data: [] };

      const result = roomService.buildRoomHierarchy(lights, rooms, devices);
      expect(result).toHaveProperty('Unknown Room');
    });

    it('should filter out null lights', () => {
      const lights = {
        data: [{ id: 'light-1', metadata: { name: 'Light 1' } }]
      };
      const rooms = {
        data: [
          {
            id: 'room-1',
            metadata: { name: 'Office' },
            children: [
              { rid: 'light-1', rtype: 'light' },
              { rid: 'light-999', rtype: 'light' } // Doesn't exist
            ]
          }
        ]
      };
      const devices = { data: [] };

      const result = roomService.buildRoomHierarchy(lights, rooms, devices);
      expect(result['Office'].lights).toHaveLength(1);
      expect(result['Office'].lights[0].id).toBe('light-1');
    });
  });

  describe('calculateRoomStats', () => {
    it('should return zeros for empty array', () => {
      const result = roomService.calculateRoomStats([]);
      expect(result).toEqual({
        lightsOnCount: 0,
        totalLights: 0,
        averageBrightness: 0
      });
    });

    it('should return zeros for null input', () => {
      const result = roomService.calculateRoomStats(null);
      expect(result).toEqual({
        lightsOnCount: 0,
        totalLights: 0,
        averageBrightness: 0
      });
    });

    it('should count lights correctly', () => {
      const lights = [
        { on: { on: true }, dimming: { brightness: 100 } },
        { on: { on: false }, dimming: { brightness: 0 } },
        { on: { on: true }, dimming: { brightness: 50 } }
      ];
      const result = roomService.calculateRoomStats(lights);
      expect(result.lightsOnCount).toBe(2);
      expect(result.totalLights).toBe(3);
    });

    it('should calculate average brightness of lights that are on', () => {
      const lights = [
        { on: { on: true }, dimming: { brightness: 100 } },
        { on: { on: true }, dimming: { brightness: 50 } },
        { on: { on: false }, dimming: { brightness: 75 } } // Off, shouldn't count
      ];
      const result = roomService.calculateRoomStats(lights);
      expect(result.averageBrightness).toBe(75); // (100 + 50) / 2
    });

    it('should return 0 average brightness when all lights are off', () => {
      const lights = [
        { on: { on: false }, dimming: { brightness: 100 } },
        { on: { on: false }, dimming: { brightness: 50 } }
      ];
      const result = roomService.calculateRoomStats(lights);
      expect(result.averageBrightness).toBe(0);
    });

    it('should handle missing dimming data with 50% default', () => {
      const lights = [
        { on: { on: true } }, // Missing dimming
        { on: { on: true }, dimming: { brightness: 100 } }
      ];
      const result = roomService.calculateRoomStats(lights);
      expect(result.averageBrightness).toBe(75); // (50 + 100) / 2
    });

    it('should handle lights with undefined on state', () => {
      const lights = [
        { on: { on: true }, dimming: { brightness: 100 } },
        { dimming: { brightness: 50 } } // Missing on state
      ];
      const result = roomService.calculateRoomStats(lights);
      expect(result.lightsOnCount).toBe(1);
      expect(result.totalLights).toBe(2);
    });

    it('should handle single light', () => {
      const lights = [{ on: { on: true }, dimming: { brightness: 80 } }];
      const result = roomService.calculateRoomStats(lights);
      expect(result.lightsOnCount).toBe(1);
      expect(result.totalLights).toBe(1);
      expect(result.averageBrightness).toBe(80);
    });

    it('should round correctly for average brightness', () => {
      const lights = [
        { on: { on: true }, dimming: { brightness: 33 } },
        { on: { on: true }, dimming: { brightness: 33 } },
        { on: { on: true }, dimming: { brightness: 34 } }
      ];
      const result = roomService.calculateRoomStats(lights);
      expect(result.averageBrightness).toBeCloseTo(33.333, 2);
    });
  });
});
