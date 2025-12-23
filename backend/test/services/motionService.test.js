import { describe, it, expect } from 'vitest';
import motionService from '../../services/motionService.js';

describe('MotionService', () => {
  describe('parseMotionSensors', () => {
    it('should return empty array when no behaviors data', () => {
      const result = motionService.parseMotionSensors(null, { data: [] });
      expect(result).toEqual([]);
    });

    it('should return empty array when no motion areas data', () => {
      const result = motionService.parseMotionSensors({ data: [] }, null);
      expect(result).toEqual([]);
    });

    it('should return empty array when both are null', () => {
      const result = motionService.parseMotionSensors(null, null);
      expect(result).toEqual([]);
    });

    it('should parse MotionAware zones correctly', () => {
      const behaviors = {
        data: [
          {
            id: 'behavior-1',
            metadata: { name: 'Living Room Motion' },
            enabled: true,
            configuration: {
              motion: {
                motion_service: { rid: 'motion-1', rtype: 'convenience_area_motion' }
              }
            }
          }
        ]
      };
      const motionAreas = {
        data: [
          {
            id: 'motion-1',
            enabled: true,
            motion: {
              motion: true,
              motion_valid: true,
              motion_report: { changed: '2024-01-01T12:00:00Z' }
            }
          }
        ]
      };

      const result = motionService.parseMotionSensors(behaviors, motionAreas);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('behavior-1');
      expect(result[0].name).toBe('Living Room Motion');
      expect(result[0].motionDetected).toBe(true);
      expect(result[0].enabled).toBe(true);
      expect(result[0].reachable).toBe(true);
      expect(result[0].lastChanged).toBe('2024-01-01T12:00:00Z');
    });

    it('should filter out non-MotionAware behaviors', () => {
      const behaviors = {
        data: [
          {
            id: 'behavior-1',
            metadata: { name: 'MotionAware Zone' },
            configuration: {
              motion: {
                motion_service: { rid: 'motion-1', rtype: 'convenience_area_motion' }
              }
            }
          },
          {
            id: 'behavior-2',
            metadata: { name: 'Other Behavior' },
            configuration: {
              motion: {
                motion_service: { rid: 'sensor-1', rtype: 'motion_sensor' } // Different type
              }
            }
          },
          {
            id: 'behavior-3',
            metadata: { name: 'No Motion Config' },
            configuration: {}
          }
        ]
      };
      const motionAreas = {
        data: [
          {
            id: 'motion-1',
            enabled: true,
            motion: { motion: false, motion_valid: true }
          }
        ]
      };

      const result = motionService.parseMotionSensors(behaviors, motionAreas);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('MotionAware Zone');
    });

    it('should handle missing motion status data', () => {
      const behaviors = {
        data: [
          {
            id: 'behavior-1',
            metadata: { name: 'Zone 1' },
            enabled: true,
            configuration: {
              motion: {
                motion_service: { rid: 'motion-999', rtype: 'convenience_area_motion' }
              }
            }
          }
        ]
      };
      const motionAreas = { data: [] };

      const result = motionService.parseMotionSensors(behaviors, motionAreas);
      expect(result).toHaveLength(1);
      expect(result[0].motionDetected).toBe(false);
      expect(result[0].enabled).toBeUndefined(); // status.enabled is undefined, so true && undefined = undefined
      expect(result[0].reachable).toBe(true); // status.motionValid is undefined, so undefined !== false = true
    });

    it('should handle missing behavior metadata name', () => {
      const behaviors = {
        data: [
          {
            id: 'behavior-1',
            metadata: {},
            enabled: true,
            configuration: {
              motion: {
                motion_service: { rid: 'motion-1', rtype: 'convenience_area_motion' }
              }
            }
          }
        ]
      };
      const motionAreas = {
        data: [
          {
            id: 'motion-1',
            motion: { motion: false, motion_valid: true }
          }
        ]
      };

      const result = motionService.parseMotionSensors(behaviors, motionAreas);
      expect(result[0].name).toBe('Unknown Zone');
    });

    it('should combine enabled states from behavior and motion area', () => {
      const behaviors = {
        data: [
          {
            id: 'behavior-1',
            metadata: { name: 'Zone 1' },
            enabled: true,
            configuration: {
              motion: {
                motion_service: { rid: 'motion-1', rtype: 'convenience_area_motion' }
              }
            }
          },
          {
            id: 'behavior-2',
            metadata: { name: 'Zone 2' },
            enabled: false,
            configuration: {
              motion: {
                motion_service: { rid: 'motion-2', rtype: 'convenience_area_motion' }
              }
            }
          }
        ]
      };
      const motionAreas = {
        data: [
          {
            id: 'motion-1',
            enabled: true,
            motion: { motion: false, motion_valid: true }
          },
          {
            id: 'motion-2',
            enabled: true,
            motion: { motion: false, motion_valid: true }
          }
        ]
      };

      const result = motionService.parseMotionSensors(behaviors, motionAreas);
      expect(result[0].enabled).toBe(true); // Both enabled
      expect(result[1].enabled).toBe(false); // Behavior disabled
    });

    it('should sort zones alphabetically by name', () => {
      const behaviors = {
        data: [
          {
            id: 'behavior-1',
            metadata: { name: 'Zzz Garage' },
            configuration: {
              motion: {
                motion_service: { rid: 'motion-1', rtype: 'convenience_area_motion' }
              }
            }
          },
          {
            id: 'behavior-2',
            metadata: { name: 'Aaa Entrance' },
            configuration: {
              motion: {
                motion_service: { rid: 'motion-2', rtype: 'convenience_area_motion' }
              }
            }
          },
          {
            id: 'behavior-3',
            metadata: { name: 'Mmm Kitchen' },
            configuration: {
              motion: {
                motion_service: { rid: 'motion-3', rtype: 'convenience_area_motion' }
              }
            }
          }
        ]
      };
      const motionAreas = {
        data: [
          { id: 'motion-1', motion: { motion: false, motion_valid: true } },
          { id: 'motion-2', motion: { motion: false, motion_valid: true } },
          { id: 'motion-3', motion: { motion: false, motion_valid: true } }
        ]
      };

      const result = motionService.parseMotionSensors(behaviors, motionAreas);
      expect(result[0].name).toBe('Aaa Entrance');
      expect(result[1].name).toBe('Mmm Kitchen');
      expect(result[2].name).toBe('Zzz Garage');
    });

    it('should handle motion_valid being false', () => {
      const behaviors = {
        data: [
          {
            id: 'behavior-1',
            metadata: { name: 'Zone 1' },
            enabled: true,
            configuration: {
              motion: {
                motion_service: { rid: 'motion-1', rtype: 'convenience_area_motion' }
              }
            }
          }
        ]
      };
      const motionAreas = {
        data: [
          {
            id: 'motion-1',
            motion: { motion: true, motion_valid: false }
          }
        ]
      };

      const result = motionService.parseMotionSensors(behaviors, motionAreas);
      expect(result[0].reachable).toBe(false);
    });

    it('should handle missing motion_valid (defaults to true)', () => {
      const behaviors = {
        data: [
          {
            id: 'behavior-1',
            metadata: { name: 'Zone 1' },
            enabled: true,
            configuration: {
              motion: {
                motion_service: { rid: 'motion-1', rtype: 'convenience_area_motion' }
              }
            }
          }
        ]
      };
      const motionAreas = {
        data: [
          {
            id: 'motion-1',
            motion: { motion: false }
          }
        ]
      };

      const result = motionService.parseMotionSensors(behaviors, motionAreas);
      expect(result[0].reachable).toBe(true);
    });

    it('should default motion detected to false when missing', () => {
      const behaviors = {
        data: [
          {
            id: 'behavior-1',
            metadata: { name: 'Zone 1' },
            enabled: true,
            configuration: {
              motion: {
                motion_service: { rid: 'motion-1', rtype: 'convenience_area_motion' }
              }
            }
          }
        ]
      };
      const motionAreas = {
        data: [
          {
            id: 'motion-1',
            motion: {}
          }
        ]
      };

      const result = motionService.parseMotionSensors(behaviors, motionAreas);
      expect(result[0].motionDetected).toBe(false);
    });

    it('should handle area enabled being false', () => {
      const behaviors = {
        data: [
          {
            id: 'behavior-1',
            metadata: { name: 'Zone 1' },
            enabled: true,
            configuration: {
              motion: {
                motion_service: { rid: 'motion-1', rtype: 'convenience_area_motion' }
              }
            }
          }
        ]
      };
      const motionAreas = {
        data: [
          {
            id: 'motion-1',
            enabled: false,
            motion: { motion: false, motion_valid: true }
          }
        ]
      };

      const result = motionService.parseMotionSensors(behaviors, motionAreas);
      expect(result[0].enabled).toBe(false);
    });
  });
});
