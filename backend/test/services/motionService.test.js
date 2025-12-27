import { describe, it, expect, vi, beforeEach } from 'vitest';
import motionService from '../../services/motionService.js';
import hueClient from '../../services/hueClient.js';

// Mock hueClient
vi.mock('../../services/hueClient.js', () => ({
  default: {
    getResource: vi.fn(),
  },
}));

describe('MotionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseMotionSensors', () => {
    it('should return empty array when behaviorsData is null', () => {
      const result = motionService.parseMotionSensors(null, { data: [] });
      expect(result).toEqual([]);
    });

    it('should return empty array when motionAreasData is null', () => {
      const result = motionService.parseMotionSensors({ data: [] }, null);
      expect(result).toEqual([]);
    });

    it('should return empty array when behaviorsData.data is undefined', () => {
      const result = motionService.parseMotionSensors({}, { data: [] });
      expect(result).toEqual([]);
    });

    it('should return empty array when motionAreasData.data is undefined', () => {
      const result = motionService.parseMotionSensors({ data: [] }, {});
      expect(result).toEqual([]);
    });

    it('should parse motion zones correctly', () => {
      const behaviorsData = {
        data: [
          {
            id: 'behavior-1',
            metadata: { name: 'Hallway MotionAware' },
            enabled: true,
            configuration: {
              motion: {
                motion_service: {
                  rtype: 'convenience_area_motion',
                  rid: 'motion-area-1',
                },
              },
            },
          },
        ],
      };

      const motionAreasData = {
        data: [
          {
            id: 'motion-area-1',
            enabled: true,
            motion: {
              motion: true,
              motion_valid: true,
              motion_report: { changed: '2024-01-15T10:30:00Z' },
            },
          },
        ],
      };

      const result = motionService.parseMotionSensors(behaviorsData, motionAreasData);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'behavior-1',
        name: 'Hallway MotionAware',
        motionDetected: true,
        enabled: true,
        reachable: true,
        lastChanged: '2024-01-15T10:30:00Z',
      });
    });

    it('should filter out non-MotionAware behaviors', () => {
      const behaviorsData = {
        data: [
          {
            id: 'behavior-1',
            metadata: { name: 'Not a MotionAware' },
            configuration: {
              motion: {
                motion_service: {
                  rtype: 'some_other_type',
                  rid: 'some-id',
                },
              },
            },
          },
          {
            id: 'behavior-2',
            metadata: { name: 'Regular Behavior' },
            configuration: {},
          },
        ],
      };

      const result = motionService.parseMotionSensors(behaviorsData, { data: [] });

      expect(result).toHaveLength(0);
    });

    it('should handle missing motion status gracefully', () => {
      const behaviorsData = {
        data: [
          {
            id: 'behavior-1',
            metadata: { name: 'Orphan Zone' },
            enabled: true,
            configuration: {
              motion: {
                motion_service: {
                  rtype: 'convenience_area_motion',
                  rid: 'non-existent-motion-area',
                },
              },
            },
          },
        ],
      };

      const motionAreasData = { data: [] };

      const result = motionService.parseMotionSensors(behaviorsData, motionAreasData);

      expect(result).toHaveLength(1);
      expect(result[0].motionDetected).toBe(false);
      // When status object is empty, status.enabled is undefined
      // behavior.enabled (true) && undefined = undefined (falsy)
      expect(result[0].enabled).toBeFalsy();
    });

    it('should handle missing metadata.name', () => {
      const behaviorsData = {
        data: [
          {
            id: 'behavior-1',
            enabled: true,
            configuration: {
              motion: {
                motion_service: {
                  rtype: 'convenience_area_motion',
                  rid: 'motion-area-1',
                },
              },
            },
          },
        ],
      };

      const motionAreasData = {
        data: [
          {
            id: 'motion-area-1',
            enabled: true,
            motion: { motion: false, motion_valid: true },
          },
        ],
      };

      const result = motionService.parseMotionSensors(behaviorsData, motionAreasData);

      expect(result[0].name).toBe('Unknown Zone');
    });

    it('should handle motion_valid being false', () => {
      const behaviorsData = {
        data: [
          {
            id: 'behavior-1',
            metadata: { name: 'Unreachable Zone' },
            enabled: true,
            configuration: {
              motion: {
                motion_service: {
                  rtype: 'convenience_area_motion',
                  rid: 'motion-area-1',
                },
              },
            },
          },
        ],
      };

      const motionAreasData = {
        data: [
          {
            id: 'motion-area-1',
            enabled: true,
            motion: { motion: false, motion_valid: false },
          },
        ],
      };

      const result = motionService.parseMotionSensors(behaviorsData, motionAreasData);

      expect(result[0].reachable).toBe(false);
    });

    it('should handle disabled motion areas', () => {
      const behaviorsData = {
        data: [
          {
            id: 'behavior-1',
            metadata: { name: 'Disabled Zone' },
            enabled: true,
            configuration: {
              motion: {
                motion_service: {
                  rtype: 'convenience_area_motion',
                  rid: 'motion-area-1',
                },
              },
            },
          },
        ],
      };

      const motionAreasData = {
        data: [
          {
            id: 'motion-area-1',
            enabled: false,
            motion: { motion: true, motion_valid: true },
          },
        ],
      };

      const result = motionService.parseMotionSensors(behaviorsData, motionAreasData);

      expect(result[0].enabled).toBe(false); // behavior enabled but area disabled
    });

    it('should handle disabled behaviors', () => {
      const behaviorsData = {
        data: [
          {
            id: 'behavior-1',
            metadata: { name: 'Disabled Behavior' },
            enabled: false,
            configuration: {
              motion: {
                motion_service: {
                  rtype: 'convenience_area_motion',
                  rid: 'motion-area-1',
                },
              },
            },
          },
        ],
      };

      const motionAreasData = {
        data: [
          {
            id: 'motion-area-1',
            enabled: true,
            motion: { motion: false, motion_valid: true },
          },
        ],
      };

      const result = motionService.parseMotionSensors(behaviorsData, motionAreasData);

      expect(result[0].enabled).toBe(false); // behavior disabled
    });

    it('should sort zones alphabetically by name', () => {
      const behaviorsData = {
        data: [
          {
            id: 'behavior-1',
            metadata: { name: 'Zebra Room' },
            enabled: true,
            configuration: {
              motion: {
                motion_service: { rtype: 'convenience_area_motion', rid: 'area-1' },
              },
            },
          },
          {
            id: 'behavior-2',
            metadata: { name: 'Apple Room' },
            enabled: true,
            configuration: {
              motion: {
                motion_service: { rtype: 'convenience_area_motion', rid: 'area-2' },
              },
            },
          },
          {
            id: 'behavior-3',
            metadata: { name: 'Mango Room' },
            enabled: true,
            configuration: {
              motion: {
                motion_service: { rtype: 'convenience_area_motion', rid: 'area-3' },
              },
            },
          },
        ],
      };

      const motionAreasData = {
        data: [
          { id: 'area-1', enabled: true, motion: { motion: false } },
          { id: 'area-2', enabled: true, motion: { motion: false } },
          { id: 'area-3', enabled: true, motion: { motion: false } },
        ],
      };

      const result = motionService.parseMotionSensors(behaviorsData, motionAreasData);

      expect(result[0].name).toBe('Apple Room');
      expect(result[1].name).toBe('Mango Room');
      expect(result[2].name).toBe('Zebra Room');
    });
  });

  describe('getMotionZones', () => {
    const bridgeIp = '192.168.1.100';
    const username = 'test-user';

    it('should fetch and parse motion zones successfully', async () => {
      const behaviorsData = {
        data: [
          {
            id: 'behavior-1',
            metadata: { name: 'Test Zone' },
            enabled: true,
            configuration: {
              motion: {
                motion_service: { rtype: 'convenience_area_motion', rid: 'area-1' },
              },
            },
          },
        ],
      };

      const motionAreasData = {
        data: [
          {
            id: 'area-1',
            enabled: true,
            motion: { motion: true, motion_valid: true },
          },
        ],
      };

      hueClient.getResource
        .mockResolvedValueOnce(behaviorsData)
        .mockResolvedValueOnce(motionAreasData)
        .mockResolvedValueOnce({ data: [] }); // motion_area_configuration (empty)

      const result = await motionService.getMotionZones(bridgeIp, username);

      expect(hueClient.getResource).toHaveBeenCalledWith(bridgeIp, username, 'behavior_instance');
      expect(hueClient.getResource).toHaveBeenCalledWith(
        bridgeIp,
        username,
        'convenience_area_motion'
      );
      expect(result.zones).toHaveLength(1);
      expect(result.zones[0].name).toBe('Test Zone');
      expect(result.zones[0].motionDetected).toBe(true);
    });

    it('should return empty zones when no motion behaviors exist', async () => {
      hueClient.getResource
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [] }); // motion_area_configuration (empty)

      const result = await motionService.getMotionZones(bridgeIp, username);

      expect(result.zones).toHaveLength(0);
    });

    it('should throw error when hueClient fails', async () => {
      hueClient.getResource.mockRejectedValue(new Error('Network error'));

      await expect(motionService.getMotionZones(bridgeIp, username)).rejects.toThrow(
        'Failed to get motion zones: Network error'
      );
    });

    it('should handle partial failure (behaviors succeeds, motion fails)', async () => {
      hueClient.getResource
        .mockResolvedValueOnce({ data: [] })
        .mockRejectedValueOnce(new Error('Motion fetch failed'));

      await expect(motionService.getMotionZones(bridgeIp, username)).rejects.toThrow(
        'Failed to get motion zones: Motion fetch failed'
      );
    });
  });

  describe('Motion area configuration support', () => {
    const bridgeIp = '192.168.1.100';
    const username = 'test-user';

    it('should include motion zones from motion_area_configuration without MotionAware behavior', async () => {
      // Behavior instances - only Kitchen has MotionAware
      const behaviorsData = {
        data: [
          {
            id: 'behavior-kitchen',
            metadata: { name: 'Kitchen' },
            enabled: true,
            configuration: {
              motion: {
                motion_service: { rtype: 'convenience_area_motion', rid: 'motion-kitchen' },
              },
            },
          },
        ],
      };

      // Convenience area motion - both Kitchen and Living Room have sensors
      const motionAreasData = {
        data: [
          { id: 'motion-kitchen', enabled: true, motion: { motion: false, motion_valid: true } },
          { id: 'motion-living-room', enabled: true, motion: { motion: true, motion_valid: true } },
        ],
      };

      // Motion area configuration - includes Living Room (no MotionAware behavior)
      const motionAreaConfigData = {
        data: [
          {
            id: 'config-living-room',
            name: 'Living Room',
            enabled: true,
            motion_area: { rid: 'motion-living-room', rtype: 'convenience_area_motion' },
          },
        ],
      };

      hueClient.getResource
        .mockResolvedValueOnce(behaviorsData) // behavior_instance
        .mockResolvedValueOnce(motionAreasData) // convenience_area_motion
        .mockResolvedValueOnce(motionAreaConfigData); // motion_area_configuration

      const result = await motionService.getMotionZones(bridgeIp, username);

      // Should include both Kitchen (from behavior) and Living Room (from config)
      expect(result.zones).toHaveLength(2);

      const kitchenZone = result.zones.find((z) => z.name === 'Kitchen');
      const livingRoomZone = result.zones.find((z) => z.name === 'Living Room');

      expect(kitchenZone).toBeDefined();
      expect(livingRoomZone).toBeDefined();
      expect(livingRoomZone.motionDetected).toBe(true);
    });

    it('should not duplicate zones that have both behavior and area config', async () => {
      // Kitchen has both MotionAware behavior AND motion_area_configuration
      const behaviorsData = {
        data: [
          {
            id: 'behavior-kitchen',
            metadata: { name: 'Kitchen MotionAware' },
            enabled: true,
            configuration: {
              motion: {
                motion_service: { rtype: 'convenience_area_motion', rid: 'motion-kitchen' },
              },
            },
          },
        ],
      };

      const motionAreasData = {
        data: [
          { id: 'motion-kitchen', enabled: true, motion: { motion: false, motion_valid: true } },
        ],
      };

      const motionAreaConfigData = {
        data: [
          {
            id: 'config-kitchen',
            name: 'Kitchen',
            enabled: true,
            motion_area: { rid: 'motion-kitchen', rtype: 'convenience_area_motion' },
          },
        ],
      };

      hueClient.getResource
        .mockResolvedValueOnce(behaviorsData)
        .mockResolvedValueOnce(motionAreasData)
        .mockResolvedValueOnce(motionAreaConfigData);

      const result = await motionService.getMotionZones(bridgeIp, username);

      // Should only have one zone (behavior name takes priority)
      expect(result.zones).toHaveLength(1);
      expect(result.zones[0].name).toBe('Kitchen MotionAware');
    });

    it('should prefer behavior name over area config name when both exist', async () => {
      const behaviorsData = {
        data: [
          {
            id: 'behavior-1',
            metadata: { name: 'Kitchen Automation' },
            enabled: true,
            configuration: {
              motion: {
                motion_service: { rtype: 'convenience_area_motion', rid: 'motion-1' },
              },
            },
          },
        ],
      };

      const motionAreasData = {
        data: [{ id: 'motion-1', enabled: true, motion: { motion: false, motion_valid: true } }],
      };

      const motionAreaConfigData = {
        data: [
          {
            id: 'config-1',
            name: 'Kitchen Area',
            enabled: true,
            motion_area: { rid: 'motion-1', rtype: 'convenience_area_motion' },
          },
        ],
      };

      hueClient.getResource
        .mockResolvedValueOnce(behaviorsData)
        .mockResolvedValueOnce(motionAreasData)
        .mockResolvedValueOnce(motionAreaConfigData);

      const result = await motionService.getMotionZones(bridgeIp, username);

      // Should use behavior name, not area config name
      expect(result.zones).toHaveLength(1);
      expect(result.zones[0].name).toBe('Kitchen Automation');
    });

    it('should handle empty motion_area_configuration gracefully', async () => {
      const behaviorsData = {
        data: [
          {
            id: 'behavior-1',
            metadata: { name: 'Kitchen' },
            enabled: true,
            configuration: {
              motion: {
                motion_service: { rtype: 'convenience_area_motion', rid: 'motion-1' },
              },
            },
          },
        ],
      };

      const motionAreasData = {
        data: [{ id: 'motion-1', enabled: true, motion: { motion: false, motion_valid: true } }],
      };

      hueClient.getResource
        .mockResolvedValueOnce(behaviorsData)
        .mockResolvedValueOnce(motionAreasData)
        .mockResolvedValueOnce({ data: [] }); // Empty motion_area_configuration

      const result = await motionService.getMotionZones(bridgeIp, username);

      // Should still return the MotionAware zone
      expect(result.zones).toHaveLength(1);
      expect(result.zones[0].name).toBe('Kitchen');
    });

    it('should handle motion_area_configuration fetch failure gracefully', async () => {
      const behaviorsData = {
        data: [
          {
            id: 'behavior-1',
            metadata: { name: 'Kitchen' },
            enabled: true,
            configuration: {
              motion: {
                motion_service: { rtype: 'convenience_area_motion', rid: 'motion-1' },
              },
            },
          },
        ],
      };

      const motionAreasData = {
        data: [{ id: 'motion-1', enabled: true, motion: { motion: false, motion_valid: true } }],
      };

      hueClient.getResource
        .mockResolvedValueOnce(behaviorsData)
        .mockResolvedValueOnce(motionAreasData)
        .mockRejectedValueOnce(new Error('Resource not found')); // motion_area_configuration fails

      const result = await motionService.getMotionZones(bridgeIp, username);

      // Should still return the MotionAware zone (graceful degradation)
      expect(result.zones).toHaveLength(1);
      expect(result.zones[0].name).toBe('Kitchen');
    });
  });
});
