import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

// Mock axios
vi.mock('axios');

// Mock logger to suppress output
vi.mock('../../utils/logger.js', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  })
}));

describe('HueClient', () => {
  let hueClient;
  const bridgeIp = '192.168.1.100';
  const username = 'test-user';

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    // Import fresh instance for each test
    const module = await import('../../services/hueClient.js');
    hueClient = module.default;

    // Clear any cached data
    hueClient.clearCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('_request', () => {
    it('should make GET request to bridge', async () => {
      const mockResponse = { status: 200, data: { data: [{ id: 'light-1' }] } };
      axios.mockResolvedValue(mockResponse);

      const result = await hueClient._request('GET', bridgeIp, '/clip/v2/resource/light', username);

      expect(axios).toHaveBeenCalledWith(expect.objectContaining({
        method: 'GET',
        url: `https://${bridgeIp}/clip/v2/resource/light`,
        headers: expect.objectContaining({
          'hue-application-key': username
        })
      }));
      expect(result).toEqual(mockResponse.data);
    });

    it('should make PUT request with data', async () => {
      const mockResponse = { status: 200, data: { success: true } };
      axios.mockResolvedValue(mockResponse);
      const bodyData = { on: { on: true } };

      await hueClient._request('PUT', bridgeIp, '/clip/v2/resource/light/123', username, bodyData);

      expect(axios).toHaveBeenCalledWith(expect.objectContaining({
        method: 'PUT',
        data: bodyData
      }));
    });

    it('should not include data for GET requests', async () => {
      const mockResponse = { status: 200, data: {} };
      axios.mockResolvedValue(mockResponse);

      await hueClient._request('GET', bridgeIp, '/clip/v2/resource/light', username, { someData: true });

      expect(axios).toHaveBeenCalledWith(expect.not.objectContaining({
        data: expect.anything()
      }));
    });

    it('should throw on HTTP 4xx errors', async () => {
      const mockResponse = { status: 401, data: { message: 'Unauthorized' } };
      axios.mockResolvedValue(mockResponse);

      await expect(hueClient._request('GET', bridgeIp, '/path', username))
        .rejects.toThrow('Bridge returned 401');
    });

    it('should throw on HTTP 5xx errors', async () => {
      const mockResponse = { status: 500, data: { message: 'Server error' } };
      axios.mockResolvedValue(mockResponse);

      await expect(hueClient._request('GET', bridgeIp, '/path', username))
        .rejects.toThrow('Bridge returned 500');
    });

    it('should throw on Hue API v2 errors', async () => {
      const mockResponse = {
        status: 200,
        data: { errors: [{ description: 'Resource not found' }], data: [] }
      };
      axios.mockResolvedValue(mockResponse);

      await expect(hueClient._request('GET', bridgeIp, '/path', username))
        .rejects.toThrow('Hue API error: Resource not found');
    });

    it('should handle Hue API v2 errors without description', async () => {
      const mockResponse = {
        status: 200,
        data: { errors: [{ type: 'unknown_error' }], data: [] }
      };
      axios.mockResolvedValue(mockResponse);

      await expect(hueClient._request('GET', bridgeIp, '/path', username))
        .rejects.toThrow('Hue API error:');
    });

    it('should handle ECONNREFUSED error', async () => {
      const error = new Error('Connection refused');
      error.code = 'ECONNREFUSED';
      axios.mockRejectedValue(error);

      await expect(hueClient._request('GET', bridgeIp, '/path', username))
        .rejects.toThrow(`Cannot connect to bridge at ${bridgeIp}`);
    });

    it('should handle ETIMEDOUT error', async () => {
      const error = new Error('Timeout');
      error.code = 'ETIMEDOUT';
      axios.mockRejectedValue(error);

      await expect(hueClient._request('GET', bridgeIp, '/path', username))
        .rejects.toThrow(`Bridge at ${bridgeIp} timed out`);
    });

    it('should propagate other errors', async () => {
      const error = new Error('Unknown error');
      axios.mockRejectedValue(error);

      await expect(hueClient._request('GET', bridgeIp, '/path', username))
        .rejects.toThrow('Unknown error');
    });
  });

  describe('caching', () => {
    beforeEach(() => {
      axios.mockResolvedValue({ status: 200, data: { data: [] } });
    });

    it('should cache rooms data', async () => {
      const mockData = { data: [{ id: 'room-1' }] };
      axios.mockResolvedValue({ status: 200, data: mockData });

      // First call - should fetch from API
      const result1 = await hueClient.getRooms(bridgeIp, username);
      expect(axios).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const result2 = await hueClient.getRooms(bridgeIp, username);
      expect(axios).toHaveBeenCalledTimes(1); // Still 1, no new call

      expect(result1).toEqual(mockData);
      expect(result2).toEqual(mockData);
    });

    it('should cache devices data', async () => {
      const mockData = { data: [{ id: 'device-1' }] };
      axios.mockResolvedValue({ status: 200, data: mockData });

      await hueClient.getDevices(bridgeIp, username);
      await hueClient.getDevices(bridgeIp, username);

      expect(axios).toHaveBeenCalledTimes(1);
    });

    it('should cache scenes data', async () => {
      const mockData = { data: [{ id: 'scene-1' }] };
      axios.mockResolvedValue({ status: 200, data: mockData });

      await hueClient.getScenes(bridgeIp, username);
      await hueClient.getScenes(bridgeIp, username);

      expect(axios).toHaveBeenCalledTimes(1);
    });

    it('should cache zones data', async () => {
      const mockData = { data: [{ id: 'zone-1' }] };
      axios.mockResolvedValue({ status: 200, data: mockData });

      await hueClient.getZones(bridgeIp, username);
      await hueClient.getZones(bridgeIp, username);

      expect(axios).toHaveBeenCalledTimes(1);
    });

    it('should NOT cache lights data', async () => {
      const mockData = { data: [{ id: 'light-1' }] };
      axios.mockResolvedValue({ status: 200, data: mockData });

      await hueClient.getLights(bridgeIp, username);
      await hueClient.getLights(bridgeIp, username);

      expect(axios).toHaveBeenCalledTimes(2);
    });

    it('should use separate cache keys per bridge', async () => {
      const mockData = { data: [] };
      axios.mockResolvedValue({ status: 200, data: mockData });

      await hueClient.getRooms('192.168.1.100', username);
      await hueClient.getRooms('192.168.1.101', username);

      expect(axios).toHaveBeenCalledTimes(2);
    });

    it('should clear cache for specific bridge', async () => {
      const mockData = { data: [] };
      axios.mockResolvedValue({ status: 200, data: mockData });

      // Cache data for two bridges
      await hueClient.getRooms('192.168.1.100', username);
      await hueClient.getRooms('192.168.1.101', username);
      expect(axios).toHaveBeenCalledTimes(2);

      // Clear cache for first bridge only
      hueClient.clearCache('192.168.1.100');

      // First bridge should refetch
      await hueClient.getRooms('192.168.1.100', username);
      expect(axios).toHaveBeenCalledTimes(3);

      // Second bridge should still use cache
      await hueClient.getRooms('192.168.1.101', username);
      expect(axios).toHaveBeenCalledTimes(3);
    });

    it('should clear all cache when no bridge specified', async () => {
      const mockData = { data: [] };
      axios.mockResolvedValue({ status: 200, data: mockData });

      // Cache data for two bridges
      await hueClient.getRooms('192.168.1.100', username);
      await hueClient.getRooms('192.168.1.101', username);
      expect(axios).toHaveBeenCalledTimes(2);

      // Clear all cache
      hueClient.clearCache();

      // Both should refetch
      await hueClient.getRooms('192.168.1.100', username);
      await hueClient.getRooms('192.168.1.101', username);
      expect(axios).toHaveBeenCalledTimes(4);
    });

    it('should expire cache after TTL', async () => {
      const mockData = { data: [] };
      axios.mockResolvedValue({ status: 200, data: mockData });

      // First call - will be cached
      await hueClient.getRooms(bridgeIp, username);
      expect(axios).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      await hueClient.getRooms(bridgeIp, username);
      expect(axios).toHaveBeenCalledTimes(1);

      // Force expire the cache entry by manipulating it directly
      const cacheKey = `${bridgeIp}:rooms`;
      const cached = hueClient.cache.get(cacheKey);
      if (cached) {
        cached.expiresAt = Date.now() - 1000; // Set to past
      }

      // Third call - cache expired, should refetch
      await hueClient.getRooms(bridgeIp, username);
      expect(axios).toHaveBeenCalledTimes(2);
    });
  });

  describe('getResource', () => {
    it('should cache behavior_instance resource', async () => {
      const mockData = { data: [{ id: 'behavior-1' }] };
      axios.mockResolvedValue({ status: 200, data: mockData });

      await hueClient.getResource(bridgeIp, username, 'behavior_instance');
      await hueClient.getResource(bridgeIp, username, 'behavior_instance');

      expect(axios).toHaveBeenCalledTimes(1);
    });

    it('should NOT cache convenience_area_motion resource', async () => {
      const mockData = { data: [{ id: 'motion-1' }] };
      axios.mockResolvedValue({ status: 200, data: mockData });

      await hueClient.getResource(bridgeIp, username, 'convenience_area_motion');
      await hueClient.getResource(bridgeIp, username, 'convenience_area_motion');

      expect(axios).toHaveBeenCalledTimes(2);
    });

    it('should NOT cache other dynamic resources', async () => {
      const mockData = { data: [] };
      axios.mockResolvedValue({ status: 200, data: mockData });

      await hueClient.getResource(bridgeIp, username, 'some_dynamic_resource');
      await hueClient.getResource(bridgeIp, username, 'some_dynamic_resource');

      expect(axios).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateLight', () => {
    it('should send PUT request with light state', async () => {
      const mockResponse = { status: 200, data: { success: true } };
      axios.mockResolvedValue(mockResponse);

      const state = { on: { on: true }, dimming: { brightness: 50 } };
      await hueClient.updateLight(bridgeIp, username, 'light-123', state);

      expect(axios).toHaveBeenCalledWith(expect.objectContaining({
        method: 'PUT',
        url: `https://${bridgeIp}/clip/v2/resource/light/light-123`,
        data: state
      }));
    });
  });

  describe('updateLights', () => {
    it('should update multiple lights in parallel', async () => {
      const mockResponse = { status: 200, data: { success: true } };
      axios.mockResolvedValue(mockResponse);

      const updates = [
        { lightId: 'light-1', state: { on: { on: true } } },
        { lightId: 'light-2', state: { on: { on: false } } },
        { lightId: 'light-3', state: { on: { on: true } } }
      ];

      await hueClient.updateLights(bridgeIp, username, updates);

      expect(axios).toHaveBeenCalledTimes(3);
    });

    it('should propagate errors from any light update', async () => {
      axios.mockResolvedValueOnce({ status: 200, data: {} });
      axios.mockRejectedValueOnce(new Error('Update failed'));
      axios.mockResolvedValueOnce({ status: 200, data: {} });

      const updates = [
        { lightId: 'light-1', state: {} },
        { lightId: 'light-2', state: {} },
        { lightId: 'light-3', state: {} }
      ];

      await expect(hueClient.updateLights(bridgeIp, username, updates))
        .rejects.toThrow('Update failed');
    });
  });

  describe('activateScene', () => {
    it('should send recall action to scene endpoint', async () => {
      const mockResponse = { status: 200, data: { success: true } };
      axios.mockResolvedValue(mockResponse);

      await hueClient.activateScene(bridgeIp, username, 'scene-123');

      expect(axios).toHaveBeenCalledWith(expect.objectContaining({
        method: 'PUT',
        url: `https://${bridgeIp}/clip/v2/resource/scene/scene-123`,
        data: { recall: { action: 'active' } }
      }));
    });
  });

  describe('getLights', () => {
    it('should request lights resource', async () => {
      const mockData = { data: [{ id: 'light-1', on: { on: true } }] };
      axios.mockResolvedValue({ status: 200, data: mockData });

      const result = await hueClient.getLights(bridgeIp, username);

      expect(axios).toHaveBeenCalledWith(expect.objectContaining({
        url: `https://${bridgeIp}/clip/v2/resource/light`
      }));
      expect(result).toEqual(mockData);
    });
  });

  describe('getHierarchyData', () => {
    it('should fetch lights, rooms, and devices in parallel', async () => {
      const mockLights = { data: [{ id: 'light-1' }] };
      const mockRooms = { data: [{ id: 'room-1' }] };
      const mockDevices = { data: [{ id: 'device-1' }] };

      vi.spyOn(hueClient, 'getLights').mockResolvedValue(mockLights);
      vi.spyOn(hueClient, 'getRooms').mockResolvedValue(mockRooms);
      vi.spyOn(hueClient, 'getDevices').mockResolvedValue(mockDevices);

      const result = await hueClient.getHierarchyData(bridgeIp, username);

      expect(hueClient.getLights).toHaveBeenCalledWith(bridgeIp, username);
      expect(hueClient.getRooms).toHaveBeenCalledWith(bridgeIp, username);
      expect(hueClient.getDevices).toHaveBeenCalledWith(bridgeIp, username);

      expect(result).toEqual({
        lightsData: mockLights,
        roomsData: mockRooms,
        devicesData: mockDevices
      });
    });

    it('should propagate errors from getLights', async () => {
      vi.spyOn(hueClient, 'getLights').mockRejectedValue(new Error('Connection failed'));
      vi.spyOn(hueClient, 'getRooms').mockResolvedValue({ data: [] });
      vi.spyOn(hueClient, 'getDevices').mockResolvedValue({ data: [] });

      await expect(hueClient.getHierarchyData(bridgeIp, username))
        .rejects.toThrow('Connection failed');
    });
  });

  describe('getZoneHierarchyData', () => {
    it('should fetch lights, zones, and devices in parallel', async () => {
      const mockLights = { data: [{ id: 'light-1' }] };
      const mockZones = { data: [{ id: 'zone-1' }] };
      const mockDevices = { data: [{ id: 'device-1' }] };

      vi.spyOn(hueClient, 'getLights').mockResolvedValue(mockLights);
      vi.spyOn(hueClient, 'getZones').mockResolvedValue(mockZones);
      vi.spyOn(hueClient, 'getDevices').mockResolvedValue(mockDevices);

      const result = await hueClient.getZoneHierarchyData(bridgeIp, username);

      expect(hueClient.getLights).toHaveBeenCalledWith(bridgeIp, username);
      expect(hueClient.getZones).toHaveBeenCalledWith(bridgeIp, username);
      expect(hueClient.getDevices).toHaveBeenCalledWith(bridgeIp, username);

      expect(result).toEqual({
        lightsData: mockLights,
        zonesData: mockZones,
        devicesData: mockDevices
      });
    });
  });

  describe('getDashboardData', () => {
    it('should fetch lights, rooms, devices, and scenes in parallel', async () => {
      const mockLights = { data: [{ id: 'light-1' }] };
      const mockRooms = { data: [{ id: 'room-1' }] };
      const mockDevices = { data: [{ id: 'device-1' }] };
      const mockScenes = { data: [{ id: 'scene-1' }] };

      vi.spyOn(hueClient, 'getLights').mockResolvedValue(mockLights);
      vi.spyOn(hueClient, 'getRooms').mockResolvedValue(mockRooms);
      vi.spyOn(hueClient, 'getDevices').mockResolvedValue(mockDevices);
      vi.spyOn(hueClient, 'getScenes').mockResolvedValue(mockScenes);

      const result = await hueClient.getDashboardData(bridgeIp, username);

      expect(result).toEqual({
        lightsData: mockLights,
        roomsData: mockRooms,
        devicesData: mockDevices,
        scenesData: mockScenes
      });
    });
  });
});
