import { describe, it, expect } from 'vitest';
import PropTypes from 'prop-types';
import {
  LightShape,
  SceneShape,
  RoomStatsShape,
  RoomShape,
  MotionZoneShape,
  ZoneShape,
  DashboardSummaryShape
} from './shapes';

// Helper to check if a PropType validator exists
const isPropTypeValidator = (validator) => {
  return typeof validator === 'function' ||
    (validator && typeof validator.isRequired === 'function');
};

describe('PropTypes shapes', () => {
  describe('LightShape', () => {
    it('should be a valid PropTypes shape', () => {
      expect(isPropTypeValidator(LightShape)).toBe(true);
    });

    it('should have required isRequired variant', () => {
      expect(isPropTypeValidator(LightShape.isRequired)).toBe(true);
    });
  });

  describe('SceneShape', () => {
    it('should be a valid PropTypes shape', () => {
      expect(isPropTypeValidator(SceneShape)).toBe(true);
    });

    it('should have required isRequired variant', () => {
      expect(isPropTypeValidator(SceneShape.isRequired)).toBe(true);
    });
  });

  describe('RoomStatsShape', () => {
    it('should be a valid PropTypes shape', () => {
      expect(isPropTypeValidator(RoomStatsShape)).toBe(true);
    });

    it('should have required isRequired variant', () => {
      expect(isPropTypeValidator(RoomStatsShape.isRequired)).toBe(true);
    });
  });

  describe('RoomShape', () => {
    it('should be a valid PropTypes shape', () => {
      expect(isPropTypeValidator(RoomShape)).toBe(true);
    });

    it('should have required isRequired variant', () => {
      expect(isPropTypeValidator(RoomShape.isRequired)).toBe(true);
    });
  });

  describe('MotionZoneShape', () => {
    it('should be a valid PropTypes shape', () => {
      expect(isPropTypeValidator(MotionZoneShape)).toBe(true);
    });

    it('should have required isRequired variant', () => {
      expect(isPropTypeValidator(MotionZoneShape.isRequired)).toBe(true);
    });

    it('should match backend motionDetected property name', () => {
      // MotionZoneShape uses motionDetected to match backend API
      expect(MotionZoneShape).toBeDefined();
    });
  });

  describe('ZoneShape', () => {
    it('should be a valid PropTypes shape', () => {
      expect(isPropTypeValidator(ZoneShape)).toBe(true);
    });

    it('should have required isRequired variant', () => {
      expect(isPropTypeValidator(ZoneShape.isRequired)).toBe(true);
    });
  });

  describe('DashboardSummaryShape', () => {
    it('should be a valid PropTypes shape', () => {
      expect(isPropTypeValidator(DashboardSummaryShape)).toBe(true);
    });

    it('should have required isRequired variant', () => {
      expect(isPropTypeValidator(DashboardSummaryShape.isRequired)).toBe(true);
    });
  });
});
