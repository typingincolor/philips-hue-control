import { describe, it, expect, vi } from 'vitest';
import { detectDemoMode } from '../../middleware/demoMode.js';

describe('demoMode middleware', () => {
  const createMockReq = (headers = {}) => ({
    headers: { ...headers },
  });

  const createMockRes = () => ({});

  const createMockNext = () => vi.fn();

  describe('detectDemoMode', () => {
    it('should set demoMode to true when X-Demo-Mode header is "true"', () => {
      const req = createMockReq({ 'x-demo-mode': 'true' });
      const res = createMockRes();
      const next = createMockNext();

      detectDemoMode(req, res, next);

      expect(req.demoMode).toBe(true);
      expect(next).toHaveBeenCalled();
    });

    it('should set demoMode to true when X-Demo-Mode header is "1"', () => {
      const req = createMockReq({ 'x-demo-mode': '1' });
      const res = createMockRes();
      const next = createMockNext();

      detectDemoMode(req, res, next);

      expect(req.demoMode).toBe(true);
      expect(next).toHaveBeenCalled();
    });

    it('should set demoMode to false when X-Demo-Mode header is "false"', () => {
      const req = createMockReq({ 'x-demo-mode': 'false' });
      const res = createMockRes();
      const next = createMockNext();

      detectDemoMode(req, res, next);

      expect(req.demoMode).toBe(false);
      expect(next).toHaveBeenCalled();
    });

    it('should set demoMode to false when X-Demo-Mode header is missing', () => {
      const req = createMockReq({});
      const res = createMockRes();
      const next = createMockNext();

      detectDemoMode(req, res, next);

      expect(req.demoMode).toBe(false);
      expect(next).toHaveBeenCalled();
    });

    it('should set demoMode to false when X-Demo-Mode header is empty', () => {
      const req = createMockReq({ 'x-demo-mode': '' });
      const res = createMockRes();
      const next = createMockNext();

      detectDemoMode(req, res, next);

      expect(req.demoMode).toBe(false);
      expect(next).toHaveBeenCalled();
    });

    it('should handle case-insensitive header value', () => {
      const req = createMockReq({ 'x-demo-mode': 'TRUE' });
      const res = createMockRes();
      const next = createMockNext();

      detectDemoMode(req, res, next);

      expect(req.demoMode).toBe(true);
      expect(next).toHaveBeenCalled();
    });

    it('should always call next()', () => {
      const req = createMockReq({});
      const res = createMockRes();
      const next = createMockNext();

      detectDemoMode(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(); // Called without arguments
    });

    it('should handle invalid header values gracefully', () => {
      const req = createMockReq({ 'x-demo-mode': 'invalid' });
      const res = createMockRes();
      const next = createMockNext();

      detectDemoMode(req, res, next);

      expect(req.demoMode).toBe(false);
      expect(next).toHaveBeenCalled();
    });
  });
});
