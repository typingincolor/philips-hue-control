import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockApi } from './mockApi';

describe('mockApi', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getDashboard', () => {
    it('should return dashboard data with summary and rooms', async () => {
      const promise = mockApi.getDashboard();
      await vi.advanceTimersByTimeAsync(300);
      const result = await promise;

      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('rooms');
      expect(result).toHaveProperty('zones');
      expect(result).toHaveProperty('motionZones');
      expect(result.summary).toHaveProperty('totalLights');
      expect(result.summary).toHaveProperty('lightsOn');
      expect(result.summary).toHaveProperty('roomCount');
      expect(result.summary).toHaveProperty('sceneCount');
    });

    it('should return rooms with lights and scenes', async () => {
      const promise = mockApi.getDashboard();
      await vi.advanceTimersByTimeAsync(300);
      const result = await promise;

      expect(result.rooms.length).toBeGreaterThan(0);
      const room = result.rooms[0];
      expect(room).toHaveProperty('id');
      expect(room).toHaveProperty('name');
      expect(room).toHaveProperty('lights');
      expect(room).toHaveProperty('scenes');
      expect(room).toHaveProperty('stats');
    });
  });

  describe('getMotionZones', () => {
    it('should return motion zones data', async () => {
      const promise = mockApi.getMotionZones();
      await vi.advanceTimersByTimeAsync(200);
      const result = await promise;

      expect(result).toHaveProperty('zones');
      expect(result.zones.length).toBeGreaterThan(0);
      expect(result.zones[0]).toHaveProperty('id');
      expect(result.zones[0]).toHaveProperty('name');
      expect(result.zones[0]).toHaveProperty('motionDetected');
    });
  });

  describe('updateLight', () => {
    it('should update light state and return updated light', async () => {
      const promise = mockApi.updateLight('token', 'light-1', { on: false });
      await vi.advanceTimersByTimeAsync(150);
      const result = await promise;

      expect(result).toHaveProperty('light');
      expect(result.light.id).toBe('light-1');
    });

    it('should update brightness when provided', async () => {
      const promise = mockApi.updateLight('token', 'light-1', { brightness: 50 });
      await vi.advanceTimersByTimeAsync(150);
      const result = await promise;

      expect(result.light.brightness).toBe(50);
    });
  });

  describe('updateRoomLights', () => {
    it('should update all lights in a room', async () => {
      const promise = mockApi.updateRoomLights('token', 'room-1', { on: true });
      await vi.advanceTimersByTimeAsync(200);
      const result = await promise;

      expect(result).toHaveProperty('updatedLights');
      expect(Array.isArray(result.updatedLights)).toBe(true);
    });

    it('should return empty array for non-existent room', async () => {
      const promise = mockApi.updateRoomLights('token', 'room-999', { on: true });
      await vi.advanceTimersByTimeAsync(200);
      const result = await promise;

      expect(result.updatedLights).toEqual([]);
    });
  });

  describe('updateZoneLights', () => {
    it('should update all lights in a zone', async () => {
      const promise = mockApi.updateZoneLights('token', 'zone-1', { on: true });
      await vi.advanceTimersByTimeAsync(200);
      const result = await promise;

      expect(result).toHaveProperty('updatedLights');
      expect(Array.isArray(result.updatedLights)).toBe(true);
    });

    it('should return empty array for non-existent zone', async () => {
      const promise = mockApi.updateZoneLights('token', 'zone-999', { on: true });
      await vi.advanceTimersByTimeAsync(200);
      const result = await promise;

      expect(result.updatedLights).toEqual([]);
    });
  });

  describe('activateSceneV1', () => {
    it('should activate a scene and return result', async () => {
      const promise = mockApi.activateSceneV1('token', 'scene-1');
      await vi.advanceTimersByTimeAsync(200);
      const result = await promise;

      expect(result).toHaveProperty('affectedLights');
    });
  });

  describe('createSession', () => {
    it('should create a demo session', async () => {
      const promise = mockApi.createSession('192.168.1.1', 'test-user');
      await vi.advanceTimersByTimeAsync(100);
      const result = await promise;

      expect(result).toHaveProperty('sessionToken');
      expect(result.sessionToken).toBe('demo-session-token');
      expect(result).toHaveProperty('expiresIn');
      expect(result).toHaveProperty('bridgeIp');
    });
  });

  describe('refreshSession', () => {
    it('should refresh the demo session', async () => {
      const promise = mockApi.refreshSession('old-token');
      await vi.advanceTimersByTimeAsync(100);
      const result = await promise;

      expect(result).toHaveProperty('sessionToken');
      expect(result).toHaveProperty('expiresIn');
      expect(result).toHaveProperty('bridgeIp');
    });
  });

  describe('subscribeToMotion', () => {
    it('should return unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = mockApi.subscribeToMotion(callback);

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });

    it('should call callback when motion is triggered', async () => {
      const callback = vi.fn();
      const unsubscribe = mockApi.subscribeToMotion(callback);

      // Advance past initial delay and trigger random motion
      await vi.advanceTimersByTimeAsync(15000);

      // Callback should have been called at least once
      expect(callback).toHaveBeenCalled();

      unsubscribe();
    });

    it('should stop calling callback after unsubscribe', async () => {
      const callback = vi.fn();
      const unsubscribe = mockApi.subscribeToMotion(callback);

      // Advance past initial delay
      await vi.advanceTimersByTimeAsync(15000);
      const callCount = callback.mock.calls.length;

      unsubscribe();

      // Advance more time
      await vi.advanceTimersByTimeAsync(60000);

      // Call count should not have increased significantly after unsubscribe
      // (may have 1 pending call)
      expect(callback.mock.calls.length).toBeLessThanOrEqual(callCount + 1);
    });
  });

  describe('legacy V2 API methods', () => {
    it('getLights should return mock lights data', async () => {
      const promise = mockApi.getLights();
      await vi.advanceTimersByTimeAsync(300);
      const result = await promise;

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('errors');
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('getRooms should return mock rooms data', async () => {
      const promise = mockApi.getRooms();
      await vi.advanceTimersByTimeAsync(200);
      const result = await promise;

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('errors');
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('getScenes should return mock scenes data', async () => {
      const promise = mockApi.getScenes();
      await vi.advanceTimersByTimeAsync(200);
      const result = await promise;

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('errors');
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('getResource should return mock devices for device type', async () => {
      const promise = mockApi.getResource('ip', 'user', 'device');
      await vi.advanceTimersByTimeAsync(200);
      const result = await promise;

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('setLightState should update light and return response', async () => {
      const promise = mockApi.setLightState('ip', 'user', 'light-1', { on: { on: true } });
      await vi.advanceTimersByTimeAsync(150);
      const result = await promise;

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('errors');
    });

    it('activateScene should return response', async () => {
      const promise = mockApi.activateScene('ip', 'user', 'scene-1');
      await vi.advanceTimersByTimeAsync(200);
      const result = await promise;

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('errors');
    });
  });
});
