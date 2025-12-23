import { describe, it, expect, vi, beforeEach } from 'vitest';
import zoneService from '../../services/zoneService.js';

describe('ZoneService', () => {
  describe('buildZoneHierarchy', () => {
    it('should return null when lights data is missing', () => {
      const result = zoneService.buildZoneHierarchy(null, { data: [] }, { data: [] });
      expect(result).toBeNull();
    });

    it('should return null when zones data is missing', () => {
      const result = zoneService.buildZoneHierarchy({ data: [] }, null, { data: [] });
      expect(result).toBeNull();
    });

    it('should return empty object when no zones exist', () => {
      const lightsData = { data: [] };
      const zonesData = { data: [] };
      const devicesData = { data: [] };

      const result = zoneService.buildZoneHierarchy(lightsData, zonesData, devicesData);
      expect(result).toEqual({});
    });

    it('should build zone hierarchy with lights', () => {
      const lightsData = {
        data: [
          { id: 'light-1', metadata: { name: 'Light 1' }, on: { on: true } },
          { id: 'light-2', metadata: { name: 'Light 2' }, on: { on: false } },
          { id: 'light-3', metadata: { name: 'Light 3' }, on: { on: true } }
        ]
      };

      const zonesData = {
        data: [
          {
            id: 'zone-1',
            metadata: { name: 'Upstairs' },
            children: [
              { rid: 'light-1', rtype: 'light' },
              { rid: 'light-2', rtype: 'light' }
            ]
          }
        ]
      };

      const devicesData = { data: [] };

      const result = zoneService.buildZoneHierarchy(lightsData, zonesData, devicesData);

      expect(result).toHaveProperty('Upstairs');
      expect(result['Upstairs'].zoneUuid).toBe('zone-1');
      expect(result['Upstairs'].lights).toHaveLength(2);
      expect(result['Upstairs'].lightUuids).toContain('light-1');
      expect(result['Upstairs'].lightUuids).toContain('light-2');
    });

    it('should handle zones with device references', () => {
      const lightsData = {
        data: [
          { id: 'light-1', metadata: { name: 'Light 1' }, on: { on: true } }
        ]
      };

      const zonesData = {
        data: [
          {
            id: 'zone-1',
            metadata: { name: 'All Lights' },
            children: [
              { rid: 'device-1', rtype: 'device' }
            ]
          }
        ]
      };

      const devicesData = {
        data: [
          {
            id: 'device-1',
            services: [{ rid: 'light-1', rtype: 'light' }]
          }
        ]
      };

      const result = zoneService.buildZoneHierarchy(lightsData, zonesData, devicesData);

      expect(result).toHaveProperty('All Lights');
      expect(result['All Lights'].lights).toHaveLength(1);
      expect(result['All Lights'].lightUuids).toContain('light-1');
    });

    it('should handle zones with missing name gracefully', () => {
      const lightsData = {
        data: [
          { id: 'light-1', metadata: { name: 'Light 1' }, on: { on: true } }
        ]
      };

      const zonesData = {
        data: [
          {
            id: 'zone-1',
            metadata: {}, // No name
            children: [{ rid: 'light-1', rtype: 'light' }]
          }
        ]
      };

      const devicesData = { data: [] };

      const result = zoneService.buildZoneHierarchy(lightsData, zonesData, devicesData);

      expect(result).toHaveProperty('Unknown Zone');
    });

    it('should deduplicate lights in zones', () => {
      const lightsData = {
        data: [
          { id: 'light-1', metadata: { name: 'Light 1' }, on: { on: true } }
        ]
      };

      const zonesData = {
        data: [
          {
            id: 'zone-1',
            metadata: { name: 'Test Zone' },
            children: [
              { rid: 'light-1', rtype: 'light' },
              { rid: 'light-1', rtype: 'light' } // Duplicate
            ]
          }
        ]
      };

      const devicesData = { data: [] };

      const result = zoneService.buildZoneHierarchy(lightsData, zonesData, devicesData);

      expect(result['Test Zone'].lightUuids).toHaveLength(1);
    });
  });

  describe('calculateZoneStats', () => {
    it('should calculate stats for zone with lights on', () => {
      const lights = [
        { id: 'light-1', on: { on: true }, dimming: { brightness: 80 } },
        { id: 'light-2', on: { on: true }, dimming: { brightness: 60 } },
        { id: 'light-3', on: { on: false }, dimming: { brightness: 0 } }
      ];

      const stats = zoneService.calculateZoneStats(lights);

      expect(stats.lightsOnCount).toBe(2);
      expect(stats.totalLights).toBe(3);
      expect(stats.averageBrightness).toBe(70); // (80 + 60) / 2
    });

    it('should return zero average brightness when no lights on', () => {
      const lights = [
        { id: 'light-1', on: { on: false } },
        { id: 'light-2', on: { on: false } }
      ];

      const stats = zoneService.calculateZoneStats(lights);

      expect(stats.lightsOnCount).toBe(0);
      expect(stats.averageBrightness).toBe(0);
    });

    it('should handle empty lights array', () => {
      const stats = zoneService.calculateZoneStats([]);

      expect(stats.lightsOnCount).toBe(0);
      expect(stats.totalLights).toBe(0);
      expect(stats.averageBrightness).toBe(0);
    });

    it('should handle missing dimming data with fallback', () => {
      const lights = [
        { id: 'light-1', on: { on: true } } // No dimming property
      ];

      const stats = zoneService.calculateZoneStats(lights);

      expect(stats.lightsOnCount).toBe(1);
      expect(stats.averageBrightness).toBe(50); // Fallback to 50%
    });
  });

  describe('getScenesForZone', () => {
    it('should return scenes for a specific zone', () => {
      const scenesData = {
        data: [
          { id: 'scene-1', metadata: { name: 'Bright' }, group: { rid: 'zone-1', rtype: 'zone' } },
          { id: 'scene-2', metadata: { name: 'Relax' }, group: { rid: 'zone-1', rtype: 'zone' } },
          { id: 'scene-3', metadata: { name: 'Other' }, group: { rid: 'zone-2', rtype: 'zone' } }
        ]
      };

      const scenes = zoneService.getScenesForZone(scenesData, 'zone-1');

      expect(scenes).toHaveLength(2);
      expect(scenes[0].id).toBe('scene-1');
      expect(scenes[0].name).toBe('Bright');
    });

    it('should return empty array when no scenes for zone', () => {
      const scenesData = {
        data: [
          { id: 'scene-1', metadata: { name: 'Bright' }, group: { rid: 'room-1', rtype: 'room' } }
        ]
      };

      const scenes = zoneService.getScenesForZone(scenesData, 'zone-1');

      expect(scenes).toEqual([]);
    });

    it('should handle null scenes data', () => {
      const scenes = zoneService.getScenesForZone(null, 'zone-1');
      expect(scenes).toEqual([]);
    });

    it('should sort scenes alphabetically', () => {
      const scenesData = {
        data: [
          { id: 'scene-1', metadata: { name: 'Zebra' }, group: { rid: 'zone-1', rtype: 'zone' } },
          { id: 'scene-2', metadata: { name: 'Apple' }, group: { rid: 'zone-1', rtype: 'zone' } },
          { id: 'scene-3', metadata: { name: 'Mango' }, group: { rid: 'zone-1', rtype: 'zone' } }
        ]
      };

      const scenes = zoneService.getScenesForZone(scenesData, 'zone-1');

      expect(scenes[0].name).toBe('Apple');
      expect(scenes[1].name).toBe('Mango');
      expect(scenes[2].name).toBe('Zebra');
    });
  });
});
