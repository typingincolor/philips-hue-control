/**
 * Tests for V2 Automations API client
 * Replaces hueApi automations methods with V2 endpoints
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as automationsApi from './automationsApi';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock authApi for session token (apiUtils imports from authApi)
vi.mock('./authApi', () => ({
  getSessionToken: vi.fn(() => 'test-token'),
}));

describe('automationsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('getAutomations', () => {
    it('should get automations with auth header', async () => {
      const mockAutomations = [
        { id: 'auto-1', name: 'Movie Time', description: 'Dim lights' },
        { id: 'auto-2', name: 'Goodnight', description: 'Turn off all' },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAutomations),
      });

      const result = await automationsApi.getAutomations();

      expect(mockFetch).toHaveBeenCalledWith('/api/v2/automations', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
      });
      expect(result).toEqual(mockAutomations);
    });

    it('should pass demo mode header when enabled', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await automationsApi.getAutomations(true);

      expect(mockFetch).toHaveBeenCalledWith('/api/v2/automations', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
          'X-Demo-Mode': 'true',
        },
      });
    });
  });

  describe('triggerAutomation', () => {
    it('should trigger automation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, affectedLights: 5 }),
      });

      const result = await automationsApi.triggerAutomation('auto-1');

      expect(mockFetch).toHaveBeenCalledWith('/api/v2/automations/auto-1/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
      });
      expect(result.success).toBe(true);
      expect(result.affectedLights).toBe(5);
    });

    it('should throw on 404 for non-existent automation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Automation not found' }),
      });

      await expect(automationsApi.triggerAutomation('non-existent')).rejects.toThrow('not found');
    });
  });
});
