import { describe, it, expect, vi } from 'vitest';
import { getHueClient, getHueClientForBridge } from '../../services/hueClientFactory.js';
import hueClient from '../../services/hueClient.js';
import mockHueClient from '../../services/mockHueClient.js';
import { DEMO_BRIDGE_IP } from '../../services/mockData.js';

// Mock logger to suppress output
vi.mock('../../utils/logger.js', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe('hueClientFactory', () => {
  describe('getHueClient', () => {
    it('should return mockHueClient when req.demoMode is true', () => {
      const req = { demoMode: true };

      const result = getHueClient(req);

      expect(result).toBe(mockHueClient);
    });

    it('should return real hueClient when req.demoMode is false', () => {
      const req = { demoMode: false };

      const result = getHueClient(req);

      expect(result).toBe(hueClient);
    });

    it('should return real hueClient when req.demoMode is undefined', () => {
      const req = {};

      const result = getHueClient(req);

      expect(result).toBe(hueClient);
    });

    it('should return real hueClient when req.demoMode is null', () => {
      const req = { demoMode: null };

      const result = getHueClient(req);

      expect(result).toBe(hueClient);
    });

    it('should return real hueClient when req.demoMode is falsy string', () => {
      const req = { demoMode: '' };

      const result = getHueClient(req);

      expect(result).toBe(hueClient);
    });

    it('should return mockHueClient for truthy demoMode', () => {
      // Any truthy value should work
      const req = { demoMode: 'yes' };

      const result = getHueClient(req);

      expect(result).toBe(mockHueClient);
    });

    it('returned client should have same interface', () => {
      const realClient = getHueClient({ demoMode: false });
      const mockClient = getHueClient({ demoMode: true });

      // Both should have the same methods
      const expectedMethods = [
        'getLights',
        'getRooms',
        'getDevices',
        'getScenes',
        'getZones',
        'getResource',
        'updateLight',
        'updateLights',
        'activateScene',
        'getHierarchyData',
        'getZoneHierarchyData',
        'getDashboardData',
        'clearCache',
      ];

      for (const method of expectedMethods) {
        expect(typeof realClient[method]).toBe('function');
        expect(typeof mockClient[method]).toBe('function');
      }
    });
  });

  describe('getHueClientForBridge', () => {
    it('should return mockHueClient for DEMO_BRIDGE_IP', () => {
      const result = getHueClientForBridge(DEMO_BRIDGE_IP);

      expect(result).toBe(mockHueClient);
    });

    it('should return real hueClient for real bridge IP', () => {
      const result = getHueClientForBridge('192.168.1.100');

      expect(result).toBe(hueClient);
    });

    it('should return real hueClient for empty string', () => {
      const result = getHueClientForBridge('');

      expect(result).toBe(hueClient);
    });

    it('should return real hueClient for undefined', () => {
      const result = getHueClientForBridge(undefined);

      expect(result).toBe(hueClient);
    });

    it('should return real hueClient for null', () => {
      const result = getHueClientForBridge(null);

      expect(result).toBe(hueClient);
    });

    it('returned client should have same interface as getHueClient', () => {
      const clientFromReq = getHueClient({ demoMode: true });
      const clientFromBridge = getHueClientForBridge(DEMO_BRIDGE_IP);

      expect(clientFromReq).toBe(clientFromBridge);
    });
  });
});
