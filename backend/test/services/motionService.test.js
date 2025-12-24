import { describe, it, expect, vi, beforeEach } from 'vitest';
import motionService from '../../services/motionService.js';
import hueClient from '../../services/hueClient.js';

// Mock hueClient
vi.mock('../../services/hueClient.js', () => ({
  default: {
    getResource: vi.fn()
  }
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
                  rid: 'motion-area-1'
                }
              }
            }
          }
        ]
      };

      const motionAreasData = {
        data: [
          {
            id: 'motion-area-1',
            enabled: true,
            motion: {
              motion: true,
              motion_valid: true,
              motion_report: { changed: '2024-01-15T10:30:00Z' }
            }
          }
        ]
      };

      const result = motionService.parseMotionSensors(behaviorsData, motionAreasData);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'behavior-1',
        name: 'Hallway MotionAware',
        motionDetected: true,
        enabled: true,
        reachable: true,
        lastChanged: '2024-01-15T10:30:00Z'
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
                  rid: 'some-id'
                }
              }
            }
          },
          {
            id: 'behavior-2',
            metadata: { name: 'Regular Behavior' },
            configuration: {}
          }
        ]
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
                  rid: 'non-existent-motion-area'
                }
              }
            }
          }
        ]
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
                  rid: 'motion-area-1'
                }
              }
            }
          }
        ]
      };

      const motionAreasData = {
        data: [
          {
            id: 'motion-area-1',
            enabled: true,
            motion: { motion: false, motion_valid: true }
          }
        ]
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
                  rid: 'motion-area-1'
                }
              }
            }
          }
        ]
      };

      const motionAreasData = {
        data: [
          {
            id: 'motion-area-1',
            enabled: true,
            motion: { motion: false, motion_valid: false }
          }
        ]
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
                  rid: 'motion-area-1'
                }
              }
            }
          }
        ]
      };

      const motionAreasData = {
        data: [
          {
            id: 'motion-area-1',
            enabled: false,
            motion: { motion: true, motion_valid: true }
          }
        ]
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
                  rid: 'motion-area-1'
                }
              }
            }
          }
        ]
      };

      const motionAreasData = {
        data: [
          {
            id: 'motion-area-1',
            enabled: true,
            motion: { motion: false, motion_valid: true }
          }
        ]
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
                motion_service: { rtype: 'convenience_area_motion', rid: 'area-1' }
              }
            }
          },
          {
            id: 'behavior-2',
            metadata: { name: 'Apple Room' },
            enabled: true,
            configuration: {
              motion: {
                motion_service: { rtype: 'convenience_area_motion', rid: 'area-2' }
              }
            }
          },
          {
            id: 'behavior-3',
            metadata: { name: 'Mango Room' },
            enabled: true,
            configuration: {
              motion: {
                motion_service: { rtype: 'convenience_area_motion', rid: 'area-3' }
              }
            }
          }
        ]
      };

      const motionAreasData = {
        data: [
          { id: 'area-1', enabled: true, motion: { motion: false } },
          { id: 'area-2', enabled: true, motion: { motion: false } },
          { id: 'area-3', enabled: true, motion: { motion: false } }
        ]
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
                motion_service: { rtype: 'convenience_area_motion', rid: 'area-1' }
              }
            }
          }
        ]
      };

      const motionAreasData = {
        data: [
          {
            id: 'area-1',
            enabled: true,
            motion: { motion: true, motion_valid: true }
          }
        ]
      };

      hueClient.getResource
        .mockResolvedValueOnce(behaviorsData)
        .mockResolvedValueOnce(motionAreasData);

      const result = await motionService.getMotionZones(bridgeIp, username);

      expect(hueClient.getResource).toHaveBeenCalledWith(bridgeIp, username, 'behavior_instance');
      expect(hueClient.getResource).toHaveBeenCalledWith(bridgeIp, username, 'convenience_area_motion');
      expect(result.zones).toHaveLength(1);
      expect(result.zones[0].name).toBe('Test Zone');
      expect(result.zones[0].motionDetected).toBe(true);
    });

    it('should return empty zones when no motion behaviors exist', async () => {
      hueClient.getResource
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [] });

      const result = await motionService.getMotionZones(bridgeIp, username);

      expect(result.zones).toHaveLength(0);
    });

    it('should throw error when hueClient fails', async () => {
      hueClient.getResource.mockRejectedValue(new Error('Network error'));

      await expect(motionService.getMotionZones(bridgeIp, username))
        .rejects.toThrow('Failed to get motion zones: Network error');
    });

    it('should handle partial failure (behaviors succeeds, motion fails)', async () => {
      hueClient.getResource
        .mockResolvedValueOnce({ data: [] })
        .mockRejectedValueOnce(new Error('Motion fetch failed'));

      await expect(motionService.getMotionZones(bridgeIp, username))
        .rejects.toThrow('Failed to get motion zones: Motion fetch failed');
    });
  });
});
