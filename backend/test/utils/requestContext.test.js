import { describe, it, expect } from 'vitest';
import { runWithContext, getContext, isDemoMode } from '../../utils/requestContext.js';

describe('requestContext', () => {
  describe('runWithContext', () => {
    it('should provide context within callback', () => {
      let capturedContext;
      runWithContext({ demoMode: true, userId: '123' }, () => {
        capturedContext = getContext();
      });
      expect(capturedContext).toEqual({ demoMode: true, userId: '123' });
    });

    it('should return undefined outside of context', () => {
      expect(getContext()).toBeUndefined();
    });

    it('should support nested contexts', () => {
      let outerContext, innerContext;
      runWithContext({ level: 'outer' }, () => {
        outerContext = getContext();
        runWithContext({ level: 'inner' }, () => {
          innerContext = getContext();
        });
      });
      expect(outerContext).toEqual({ level: 'outer' });
      expect(innerContext).toEqual({ level: 'inner' });
    });

    it('should return result from callback', () => {
      const result = runWithContext({ demoMode: true }, () => {
        return 'test-result';
      });
      expect(result).toBe('test-result');
    });

    it('should support async callbacks', async () => {
      const result = await runWithContext({ demoMode: true }, async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return isDemoMode();
      });
      expect(result).toBe(true);
    });
  });

  describe('isDemoMode', () => {
    it('should return true when demoMode is true in context', () => {
      runWithContext({ demoMode: true }, () => {
        expect(isDemoMode()).toBe(true);
      });
    });

    it('should return false when demoMode is false in context', () => {
      runWithContext({ demoMode: false }, () => {
        expect(isDemoMode()).toBe(false);
      });
    });

    it('should return false when demoMode is not in context', () => {
      runWithContext({ otherKey: 'value' }, () => {
        expect(isDemoMode()).toBe(false);
      });
    });

    it('should return false outside of context', () => {
      expect(isDemoMode()).toBe(false);
    });
  });
});
