import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import websocketService from '../../services/websocketService.js';
import { DEMO_BRIDGE_IP, DEMO_USERNAME } from '../../services/mockData.js';

// Mock dependencies
vi.mock('../../utils/logger.js', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

vi.mock('../../services/dashboardService.js', () => ({
  default: {
    getDashboard: vi.fn(),
  },
}));

vi.mock('../../services/sessionManager.js', () => ({
  default: {
    getSession: vi.fn(),
  },
}));

import dashboardService from '../../services/dashboardService.js';
import sessionManager from '../../services/sessionManager.js';

describe('WebSocketService', () => {
  beforeEach(() => {
    // Reset state before each test
    websocketService.connections.clear();
    websocketService.pollingIntervals.clear();
    websocketService.stateCache.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getStats', () => {
    it('should return zero stats when no connections', () => {
      const stats = websocketService.getStats();

      expect(stats.totalClients).toBe(0);
      expect(stats.pollingIntervals).toBe(0);
      expect(stats.stateCaches).toBe(0);
      expect(Object.keys(stats.bridges)).toHaveLength(0);
    });

    it('should return correct bridge stats', () => {
      // Simulate connections
      const mockWs1 = { readyState: 1 };
      const mockWs2 = { readyState: 1 };
      const bridgeIp = '192.168.1.100';

      websocketService.connections.set(bridgeIp, new Set([mockWs1, mockWs2]));
      websocketService.pollingIntervals.set(bridgeIp, 123);
      websocketService.stateCache.set(bridgeIp, { some: 'data' });

      const stats = websocketService.getStats();

      expect(stats.pollingIntervals).toBe(1);
      expect(stats.stateCaches).toBe(1);
      expect(stats.bridges[bridgeIp]).toBeDefined();
      expect(stats.bridges[bridgeIp].connections).toBe(2);
      expect(stats.bridges[bridgeIp].hasPolling).toBe(true);
      expect(stats.bridges[bridgeIp].hasCache).toBe(true);
    });

    it('should report multiple bridges', () => {
      websocketService.connections.set('192.168.1.100', new Set([{ readyState: 1 }]));
      websocketService.connections.set(
        '192.168.1.101',
        new Set([{ readyState: 1 }, { readyState: 1 }])
      );

      const stats = websocketService.getStats();

      expect(Object.keys(stats.bridges)).toHaveLength(2);
      expect(stats.bridges['192.168.1.100'].connections).toBe(1);
      expect(stats.bridges['192.168.1.101'].connections).toBe(2);
    });
  });

  describe('stopPolling', () => {
    it('should clear interval when polling exists', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      const bridgeIp = '192.168.1.100';
      const mockIntervalId = 12345;

      websocketService.pollingIntervals.set(bridgeIp, mockIntervalId);

      websocketService.stopPolling(bridgeIp);

      expect(clearIntervalSpy).toHaveBeenCalledWith(mockIntervalId);
      expect(websocketService.pollingIntervals.has(bridgeIp)).toBe(false);
    });

    it('should do nothing when no polling exists', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      websocketService.stopPolling('192.168.1.100');

      expect(clearIntervalSpy).not.toHaveBeenCalled();
    });
  });

  describe('broadcast', () => {
    it('should send message to all connected clients', () => {
      const bridgeIp = '192.168.1.100';
      const mockWs1 = { readyState: 1, send: vi.fn() };
      const mockWs2 = { readyState: 1, send: vi.fn() };

      websocketService.connections.set(bridgeIp, new Set([mockWs1, mockWs2]));

      const message = { type: 'test', data: 'hello' };
      websocketService.broadcast(bridgeIp, message);

      expect(mockWs1.send).toHaveBeenCalledWith(JSON.stringify(message));
      expect(mockWs2.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it('should not send to clients with non-OPEN readyState', () => {
      const bridgeIp = '192.168.1.100';
      const mockWsOpen = { readyState: 1, send: vi.fn() };
      const mockWsClosed = { readyState: 3, send: vi.fn() };

      websocketService.connections.set(bridgeIp, new Set([mockWsOpen, mockWsClosed]));

      websocketService.broadcast(bridgeIp, { type: 'test' });

      expect(mockWsOpen.send).toHaveBeenCalled();
      expect(mockWsClosed.send).not.toHaveBeenCalled();
    });

    it('should do nothing when no connections for bridge', () => {
      // Should not throw
      expect(() => {
        websocketService.broadcast('192.168.1.100', { type: 'test' });
      }).not.toThrow();
    });
  });

  describe('shutdown', () => {
    it('should stop all polling intervals', () => {
      const stopPollingSpy = vi.spyOn(websocketService, 'stopPolling');
      websocketService.pollingIntervals.set('192.168.1.100', 123);
      websocketService.pollingIntervals.set('192.168.1.101', 456);

      websocketService.shutdown();

      expect(stopPollingSpy).toHaveBeenCalledTimes(2);
    });

    it('should clear heartbeat interval', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      websocketService.heartbeatInterval = 789;

      websocketService.shutdown();

      expect(clearIntervalSpy).toHaveBeenCalledWith(789);
      expect(websocketService.heartbeatInterval).toBeNull();
    });

    it('should clear cleanup interval', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      websocketService.cleanupInterval = 101;

      websocketService.shutdown();

      expect(clearIntervalSpy).toHaveBeenCalledWith(101);
      expect(websocketService.cleanupInterval).toBeNull();
    });

    it('should clear all maps', () => {
      websocketService.connections.set('192.168.1.100', new Set());
      websocketService.stateCache.set('192.168.1.100', {});

      websocketService.shutdown();

      expect(websocketService.connections.size).toBe(0);
      expect(websocketService.stateCache.size).toBe(0);
    });

    it('should close WebSocket server if initialized', () => {
      const mockClose = vi.fn();
      websocketService.wss = { close: mockClose };

      websocketService.shutdown();

      expect(mockClose).toHaveBeenCalled();
    });

    it('should not throw if wss is null', () => {
      websocketService.wss = null;

      expect(() => websocketService.shutdown()).not.toThrow();
    });
  });

  describe('cleanupOrphanedResources', () => {
    it('should remove polling intervals without active connections', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      const bridgeIp = '192.168.1.100';

      websocketService.pollingIntervals.set(bridgeIp, 123);
      websocketService.connections.set(bridgeIp, new Set()); // Empty connections

      websocketService.cleanupOrphanedResources();

      expect(clearIntervalSpy).toHaveBeenCalledWith(123);
      expect(websocketService.pollingIntervals.has(bridgeIp)).toBe(false);
    });

    it('should remove stale connections', () => {
      const bridgeIp = '192.168.1.100';
      const staleWs = { readyState: 3, bridgeIp }; // CLOSED state
      const activeWs = { readyState: 1, bridgeIp }; // OPEN state

      websocketService.connections.set(bridgeIp, new Set([staleWs, activeWs]));

      websocketService.cleanupOrphanedResources();

      const connections = websocketService.connections.get(bridgeIp);
      expect(connections.has(staleWs)).toBe(false);
      expect(connections.has(activeWs)).toBe(true);
    });

    it('should stop polling when all connections removed', () => {
      const stopPollingSpy = vi.spyOn(websocketService, 'stopPolling');
      const bridgeIp = '192.168.1.100';
      const staleWs = { readyState: 3, bridgeIp };

      websocketService.connections.set(bridgeIp, new Set([staleWs]));
      websocketService.pollingIntervals.set(bridgeIp, 123);

      websocketService.cleanupOrphanedResources();

      expect(stopPollingSpy).toHaveBeenCalledWith(bridgeIp);
    });
  });

  describe('handleDisconnect', () => {
    it('should remove connection from connections set', () => {
      const bridgeIp = '192.168.1.100';
      const mockWs = { bridgeIp, readyState: 1 };

      websocketService.connections.set(bridgeIp, new Set([mockWs]));
      websocketService.pollingIntervals.set(bridgeIp, 123);
      websocketService.stateCache.set(bridgeIp, {});

      websocketService.handleDisconnect(mockWs);

      expect(websocketService.connections.has(bridgeIp)).toBe(false);
      expect(websocketService.pollingIntervals.has(bridgeIp)).toBe(false);
      expect(websocketService.stateCache.has(bridgeIp)).toBe(false);
    });

    it('should keep other connections when one disconnects', () => {
      const bridgeIp = '192.168.1.100';
      const mockWs1 = { bridgeIp, readyState: 1 };
      const mockWs2 = { bridgeIp, readyState: 1 };

      websocketService.connections.set(bridgeIp, new Set([mockWs1, mockWs2]));

      websocketService.handleDisconnect(mockWs1);

      const connections = websocketService.connections.get(bridgeIp);
      expect(connections).toBeDefined();
      expect(connections.has(mockWs1)).toBe(false);
      expect(connections.has(mockWs2)).toBe(true);
    });

    it('should handle disconnect when bridgeIp is not set', () => {
      const mockWs = { readyState: 1 }; // No bridgeIp

      expect(() => websocketService.handleDisconnect(mockWs)).not.toThrow();
    });
  });

  describe('detectChanges', () => {
    it('should detect motion zone changes when motion is detected', () => {
      const previous = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [],
        motionZones: [
          {
            id: 'zone-1',
            name: 'Hallway MotionAware',
            motionDetected: false,
            enabled: true,
            reachable: true,
          },
        ],
      };

      const current = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [],
        motionZones: [
          {
            id: 'zone-1',
            name: 'Hallway MotionAware',
            motionDetected: true, // Changed to true
            enabled: true,
            reachable: true,
          },
        ],
      };

      const changes = websocketService.detectChanges(previous, current);

      expect(changes).toContainEqual({
        type: 'motion_zone',
        data: current.motionZones[0],
      });
    });

    it('should detect motion zone changes when motion stops', () => {
      const previous = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [],
        motionZones: [
          {
            id: 'zone-1',
            name: 'Hallway MotionAware',
            motionDetected: true,
            enabled: true,
            reachable: true,
          },
        ],
      };

      const current = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [],
        motionZones: [
          {
            id: 'zone-1',
            name: 'Hallway MotionAware',
            motionDetected: false, // Changed to false
            enabled: true,
            reachable: true,
          },
        ],
      };

      const changes = websocketService.detectChanges(previous, current);

      expect(changes).toContainEqual({
        type: 'motion_zone',
        data: current.motionZones[0],
      });
    });

    it('should detect motion zone reachability changes', () => {
      const previous = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [],
        motionZones: [
          {
            id: 'zone-1',
            name: 'Hallway MotionAware',
            motionDetected: false,
            enabled: true,
            reachable: true,
          },
        ],
      };

      const current = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [],
        motionZones: [
          {
            id: 'zone-1',
            name: 'Hallway MotionAware',
            motionDetected: false,
            enabled: true,
            reachable: false, // Changed to false
          },
        ],
      };

      const changes = websocketService.detectChanges(previous, current);

      expect(changes).toContainEqual({
        type: 'motion_zone',
        data: current.motionZones[0],
      });
    });

    it('should not detect changes when motion zones are identical', () => {
      const previous = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [],
        motionZones: [
          {
            id: 'zone-1',
            name: 'Hallway MotionAware',
            motionDetected: false,
            enabled: true,
            reachable: true,
          },
        ],
      };

      const current = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [],
        motionZones: [
          {
            id: 'zone-1',
            name: 'Hallway MotionAware',
            motionDetected: false,
            enabled: true,
            reachable: true,
          },
        ],
      };

      const changes = websocketService.detectChanges(previous, current);

      // Should not include any motion_zone changes
      const motionZoneChanges = changes.filter((c) => c.type === 'motion_zone');
      expect(motionZoneChanges).toHaveLength(0);
    });

    it('should detect changes to multiple motion zones', () => {
      const previous = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [],
        motionZones: [
          {
            id: 'zone-1',
            name: 'Hallway MotionAware',
            motionDetected: false,
            enabled: true,
            reachable: true,
          },
          {
            id: 'zone-2',
            name: 'Living Room MotionAware',
            motionDetected: false,
            enabled: true,
            reachable: true,
          },
        ],
      };

      const current = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [],
        motionZones: [
          {
            id: 'zone-1',
            name: 'Hallway MotionAware',
            motionDetected: true, // Changed
            enabled: true,
            reachable: true,
          },
          {
            id: 'zone-2',
            name: 'Living Room MotionAware',
            motionDetected: true, // Changed
            enabled: true,
            reachable: true,
          },
        ],
      };

      const changes = websocketService.detectChanges(previous, current);

      const motionZoneChanges = changes.filter((c) => c.type === 'motion_zone');
      expect(motionZoneChanges).toHaveLength(2);
      expect(motionZoneChanges[0].data.id).toBe('zone-1');
      expect(motionZoneChanges[1].data.id).toBe('zone-2');
    });

    it('should handle missing motionZones array gracefully', () => {
      const previous = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [],
        // No motionZones property
      };

      const current = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [],
        motionZones: [
          {
            id: 'zone-1',
            name: 'Hallway MotionAware',
            motionDetected: true,
            enabled: true,
            reachable: true,
          },
        ],
      };

      const changes = websocketService.detectChanges(previous, current);

      // Should detect the new motion zone as a change
      expect(changes).toContainEqual({
        type: 'motion_zone',
        data: current.motionZones[0],
      });
    });

    it('should handle empty motionZones array', () => {
      const previous = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [],
        motionZones: [],
      };

      const current = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [],
        motionZones: [],
      };

      const changes = websocketService.detectChanges(previous, current);

      const motionZoneChanges = changes.filter((c) => c.type === 'motion_zone');
      expect(motionZoneChanges).toHaveLength(0);
    });

    // Zone (light grouping) change detection tests
    it('should detect zone changes when light state changes', () => {
      const previous = {
        summary: { lightsOn: 1, totalLights: 2, roomCount: 1, sceneCount: 1 },
        rooms: [],
        zones: [
          {
            id: 'zone-1',
            name: 'Upstairs',
            stats: { lightsOnCount: 1, totalLights: 2, averageBrightness: 80 },
            lights: [
              { id: 'light-1', on: { on: true } },
              { id: 'light-2', on: { on: false } },
            ],
          },
        ],
      };

      const current = {
        summary: { lightsOn: 2, totalLights: 2, roomCount: 1, sceneCount: 1 },
        rooms: [],
        zones: [
          {
            id: 'zone-1',
            name: 'Upstairs',
            stats: { lightsOnCount: 2, totalLights: 2, averageBrightness: 90 },
            lights: [
              { id: 'light-1', on: { on: true } },
              { id: 'light-2', on: { on: true } }, // Changed to on
            ],
          },
        ],
      };

      const changes = websocketService.detectChanges(previous, current);

      expect(changes).toContainEqual({
        type: 'zone',
        data: current.zones[0],
      });
    });

    it('should detect zone stats changes', () => {
      const previous = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [],
        zones: [
          {
            id: 'zone-1',
            name: 'Downstairs',
            stats: { lightsOnCount: 1, totalLights: 1, averageBrightness: 50 },
            lights: [],
          },
        ],
      };

      const current = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [],
        zones: [
          {
            id: 'zone-1',
            name: 'Downstairs',
            stats: { lightsOnCount: 1, totalLights: 1, averageBrightness: 100 }, // Changed
            lights: [],
          },
        ],
      };

      const changes = websocketService.detectChanges(previous, current);

      expect(changes).toContainEqual({
        type: 'zone',
        data: current.zones[0],
      });
    });

    it('should not detect changes when zones are identical', () => {
      const zoneData = {
        id: 'zone-1',
        name: 'Upstairs',
        stats: { lightsOnCount: 1, totalLights: 1, averageBrightness: 80 },
        lights: [{ id: 'light-1', on: { on: true } }],
      };

      const previous = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [],
        zones: [zoneData],
      };

      const current = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [],
        zones: [{ ...zoneData }],
      };

      const changes = websocketService.detectChanges(previous, current);

      const zoneChanges = changes.filter((c) => c.type === 'zone');
      expect(zoneChanges).toHaveLength(0);
    });

    it('should detect changes to multiple zones', () => {
      const previous = {
        summary: { lightsOn: 2, totalLights: 2, roomCount: 1, sceneCount: 1 },
        rooms: [],
        zones: [
          { id: 'zone-1', name: 'Upstairs', stats: { lightsOnCount: 1 } },
          { id: 'zone-2', name: 'Downstairs', stats: { lightsOnCount: 1 } },
        ],
      };

      const current = {
        summary: { lightsOn: 0, totalLights: 2, roomCount: 1, sceneCount: 1 },
        rooms: [],
        zones: [
          { id: 'zone-1', name: 'Upstairs', stats: { lightsOnCount: 0 } }, // Changed
          { id: 'zone-2', name: 'Downstairs', stats: { lightsOnCount: 0 } }, // Changed
        ],
      };

      const changes = websocketService.detectChanges(previous, current);

      const zoneChanges = changes.filter((c) => c.type === 'zone');
      expect(zoneChanges).toHaveLength(2);
      expect(zoneChanges[0].data.id).toBe('zone-1');
      expect(zoneChanges[1].data.id).toBe('zone-2');
    });

    it('should handle missing zones array gracefully', () => {
      const previous = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [],
        // No zones property
      };

      const current = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [],
        zones: [{ id: 'zone-1', name: 'Upstairs', stats: { lightsOnCount: 1 } }],
      };

      const changes = websocketService.detectChanges(previous, current);

      expect(changes).toContainEqual({
        type: 'zone',
        data: current.zones[0],
      });
    });

    it('should handle empty zones array', () => {
      const previous = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [],
        zones: [],
      };

      const current = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [],
        zones: [],
      };

      const changes = websocketService.detectChanges(previous, current);

      const zoneChanges = changes.filter((c) => c.type === 'zone');
      expect(zoneChanges).toHaveLength(0);
    });

    it('should detect summary changes', () => {
      const previous = {
        summary: { lightsOn: 1, totalLights: 3, roomCount: 2, sceneCount: 5 },
        rooms: [],
      };

      const current = {
        summary: { lightsOn: 2, totalLights: 3, roomCount: 2, sceneCount: 5 },
        rooms: [],
      };

      const changes = websocketService.detectChanges(previous, current);

      expect(changes).toContainEqual({
        type: 'summary',
        data: current.summary,
      });
    });

    it('should not detect changes when summary is identical', () => {
      const summary = { lightsOn: 1, totalLights: 3, roomCount: 2, sceneCount: 5 };
      const previous = { summary, rooms: [] };
      const current = { summary: { ...summary }, rooms: [] };

      const changes = websocketService.detectChanges(previous, current);

      const summaryChanges = changes.filter((c) => c.type === 'summary');
      expect(summaryChanges).toHaveLength(0);
    });

    it('should detect room changes', () => {
      const previous = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [{ id: 'room-1', name: 'Living Room', stats: { lightsOnCount: 0 }, lights: [] }],
      };

      const current = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [{ id: 'room-1', name: 'Living Room', stats: { lightsOnCount: 1 }, lights: [] }],
      };

      const changes = websocketService.detectChanges(previous, current);

      expect(changes).toContainEqual({
        type: 'room',
        data: current.rooms[0],
      });
    });

    it('should detect new room', () => {
      const previous = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [],
      };

      const current = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [{ id: 'room-1', name: 'New Room', stats: { lightsOnCount: 1 }, lights: [] }],
      };

      const changes = websocketService.detectChanges(previous, current);

      expect(changes).toContainEqual({
        type: 'room',
        data: current.rooms[0],
      });
    });

    it('should detect light changes within rooms', () => {
      const previous = {
        summary: { lightsOn: 0, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [
          {
            id: 'room-1',
            name: 'Living Room',
            stats: { lightsOnCount: 0 },
            lights: [
              { id: 'light-1', name: 'Lamp', on: { on: false }, dimming: { brightness: 50 } },
            ],
          },
        ],
      };

      const current = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [
          {
            id: 'room-1',
            name: 'Living Room',
            stats: { lightsOnCount: 1 },
            lights: [
              { id: 'light-1', name: 'Lamp', on: { on: true }, dimming: { brightness: 100 } },
            ],
          },
        ],
      };

      const changes = websocketService.detectChanges(previous, current);

      expect(changes).toContainEqual({
        type: 'light',
        data: current.rooms[0].lights[0],
        roomId: 'room-1',
      });
    });

    it('should not detect light changes when lights are identical', () => {
      const light = { id: 'light-1', name: 'Lamp', on: { on: true }, dimming: { brightness: 100 } };
      const room = {
        id: 'room-1',
        name: 'Living Room',
        stats: { lightsOnCount: 1 },
        lights: [light],
      };

      const previous = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [room],
      };

      const current = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [{ ...room, lights: [{ ...light }] }],
      };

      const changes = websocketService.detectChanges(previous, current);

      const lightChanges = changes.filter((c) => c.type === 'light');
      expect(lightChanges).toHaveLength(0);
    });

    it('should skip light comparison for new rooms', () => {
      const previous = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 1, sceneCount: 1 },
        rooms: [{ id: 'room-1', name: 'Old Room', stats: {}, lights: [] }],
      };

      const current = {
        summary: { lightsOn: 1, totalLights: 1, roomCount: 2, sceneCount: 1 },
        rooms: [
          { id: 'room-1', name: 'Old Room', stats: {}, lights: [] },
          { id: 'room-2', name: 'New Room', stats: {}, lights: [{ id: 'light-1' }] },
        ],
      };

      const changes = websocketService.detectChanges(previous, current);

      // Should not have light changes for new room (room wasn't in previous)
      const lightChanges = changes.filter((c) => c.type === 'light' && c.roomId === 'room-2');
      expect(lightChanges).toHaveLength(0);
    });
  });

  describe('handleMessage', () => {
    it('should respond to ping with pong', async () => {
      const mockWs = { send: vi.fn() };
      const message = JSON.stringify({ type: 'ping' });

      await websocketService.handleMessage(mockWs, message);

      expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify({ type: 'pong' }));
    });

    it('should delegate auth messages to handleAuth', async () => {
      const handleAuthSpy = vi.spyOn(websocketService, 'handleAuth').mockResolvedValue();
      const mockWs = { send: vi.fn() };
      const authData = { type: 'auth', sessionToken: 'test-token' };
      const message = JSON.stringify(authData);

      await websocketService.handleMessage(mockWs, message);

      expect(handleAuthSpy).toHaveBeenCalledWith(mockWs, authData);
    });

    it('should send error for invalid JSON', async () => {
      const mockWs = { send: vi.fn() };

      await websocketService.handleMessage(mockWs, 'invalid json');

      const sentMessage = JSON.parse(mockWs.send.mock.calls[0][0]);
      expect(sentMessage.type).toBe('error');
      expect(sentMessage.message).toBeDefined();
    });

    it('should ignore unknown message types', async () => {
      const mockWs = { send: vi.fn() };
      const message = JSON.stringify({ type: 'unknown' });

      await websocketService.handleMessage(mockWs, message);

      expect(mockWs.send).not.toHaveBeenCalled();
    });
  });

  describe('handleAuth', () => {
    const mockDashboard = {
      summary: { lightsOn: 1, totalLights: 2, roomCount: 1, sceneCount: 3 },
      rooms: [],
    };

    beforeEach(() => {
      dashboardService.getDashboard.mockResolvedValue(mockDashboard);
    });

    it('should authenticate with session token', async () => {
      const mockWs = { send: vi.fn() };
      sessionManager.getSession.mockReturnValue({
        bridgeIp: '192.168.1.100',
        username: 'test-user',
      });

      await websocketService.handleAuth(mockWs, { sessionToken: 'valid-token' });

      expect(mockWs.bridgeIp).toBe('192.168.1.100');
      expect(mockWs.username).toBe('test-user');
      expect(mockWs.authMethod).toBe('session');
      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'initial_state',
          data: mockDashboard,
        })
      );
    });

    it('should reject invalid session token', async () => {
      const mockWs = { send: vi.fn() };
      sessionManager.getSession.mockReturnValue(null);

      await websocketService.handleAuth(mockWs, { sessionToken: 'invalid-token' });

      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'error',
          message: 'Invalid or expired session token',
        })
      );
    });

    it('should reject missing authentication', async () => {
      const mockWs = { send: vi.fn() };

      await websocketService.handleAuth(mockWs, {});

      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'error',
          message: 'Missing authentication: provide demoMode or sessionToken',
        })
      );
    });

    it('should authenticate with demo mode', async () => {
      const mockWs = { send: vi.fn() };

      await websocketService.handleAuth(mockWs, { demoMode: true });

      expect(mockWs.bridgeIp).toBe(DEMO_BRIDGE_IP);
      expect(mockWs.username).toBe(DEMO_USERNAME);
      expect(mockWs.authMethod).toBe('demo');
      expect(mockWs.demoMode).toBe(true);
    });

    it('should add demo connection to connections map', async () => {
      const mockWs = { send: vi.fn() };

      await websocketService.handleAuth(mockWs, { demoMode: true });

      expect(websocketService.connections.has(DEMO_BRIDGE_IP)).toBe(true);
      expect(websocketService.connections.get(DEMO_BRIDGE_IP).has(mockWs)).toBe(true);
    });

    it('should send initial state for demo mode', async () => {
      const mockWs = { send: vi.fn() };

      await websocketService.handleAuth(mockWs, { demoMode: true });

      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'initial_state',
          data: mockDashboard,
        })
      );
    });

    it('should not authenticate demo mode when demoMode is false', async () => {
      const mockWs = { send: vi.fn() };

      // Without other credentials, this should fail
      await websocketService.handleAuth(mockWs, { demoMode: false });

      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'error',
          message: 'Missing authentication: provide demoMode or sessionToken',
        })
      );
    });

    it('should add connection to map for new bridge', async () => {
      const mockWs = { send: vi.fn() };
      const bridgeIp = '192.168.1.200';
      sessionManager.getSession.mockReturnValue({
        bridgeIp,
        username: 'test-user',
      });

      await websocketService.handleAuth(mockWs, { sessionToken: 'new-session-token' });

      expect(websocketService.connections.has(bridgeIp)).toBe(true);
      expect(websocketService.connections.get(bridgeIp).has(mockWs)).toBe(true);
    });

    it('should add connection to existing bridge set', async () => {
      const bridgeIp = '192.168.1.100';
      const existingWs = { send: vi.fn() };
      websocketService.connections.set(bridgeIp, new Set([existingWs]));
      sessionManager.getSession.mockReturnValue({
        bridgeIp,
        username: 'test-user',
      });

      const newWs = { send: vi.fn() };
      await websocketService.handleAuth(newWs, { sessionToken: 'another-session-token' });

      const connections = websocketService.connections.get(bridgeIp);
      expect(connections.size).toBe(2);
      expect(connections.has(existingWs)).toBe(true);
      expect(connections.has(newWs)).toBe(true);
    });

    it('should start polling for new bridge', async () => {
      const startPollingSpy = vi.spyOn(websocketService, 'startPolling').mockResolvedValue();
      const mockWs = { send: vi.fn() };
      const bridgeIp = '192.168.1.150';
      sessionManager.getSession.mockReturnValue({
        bridgeIp,
        username: 'test-user',
      });

      await websocketService.handleAuth(mockWs, { sessionToken: 'test-session' });

      expect(startPollingSpy).toHaveBeenCalledWith(bridgeIp, 'test-user');
    });

    it('should send error when dashboard fetch fails', async () => {
      const mockWs = { send: vi.fn() };
      sessionManager.getSession.mockReturnValue({
        bridgeIp: '192.168.1.100',
        username: 'test-user',
      });
      dashboardService.getDashboard.mockRejectedValue(new Error('Network error'));

      await websocketService.handleAuth(mockWs, { sessionToken: 'fail-session' });

      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'error',
          message: 'Failed to fetch initial state',
        })
      );
    });
  });

  describe('startPolling', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
      // Stop any polling that was started
      for (const bridgeIp of websocketService.pollingIntervals.keys()) {
        websocketService.stopPolling(bridgeIp);
      }
    });

    it('should fetch initial dashboard state', async () => {
      const bridgeIp = '192.168.1.100';
      const username = 'test-user';
      dashboardService.getDashboard.mockResolvedValue({
        summary: {},
        rooms: [],
      });

      await websocketService.startPolling(bridgeIp, username);

      expect(dashboardService.getDashboard).toHaveBeenCalledWith(bridgeIp, username);
    });

    it('should store polling interval', async () => {
      const bridgeIp = '192.168.1.100';
      dashboardService.getDashboard.mockResolvedValue({ summary: {}, rooms: [] });

      await websocketService.startPolling(bridgeIp, 'test-user');

      expect(websocketService.pollingIntervals.has(bridgeIp)).toBe(true);
    });

    it('should cache initial state', async () => {
      const bridgeIp = '192.168.1.100';
      const dashboard = { summary: { lightsOn: 1 }, rooms: [] };
      dashboardService.getDashboard.mockResolvedValue(dashboard);

      await websocketService.startPolling(bridgeIp, 'test-user');

      expect(websocketService.stateCache.get(bridgeIp)).toEqual(dashboard);
    });

    it('should broadcast changes when state differs', async () => {
      const bridgeIp = '192.168.1.100';
      const broadcastSpy = vi.spyOn(websocketService, 'broadcast');

      // Set up initial state
      const initialState = { summary: { lightsOn: 0 }, rooms: [] };
      const updatedState = { summary: { lightsOn: 1 }, rooms: [] };

      dashboardService.getDashboard
        .mockResolvedValueOnce(initialState)
        .mockResolvedValueOnce(updatedState);

      await websocketService.startPolling(bridgeIp, 'test-user');

      // Advance timers to trigger next poll
      await vi.advanceTimersByTimeAsync(websocketService.pollInterval);

      expect(broadcastSpy).toHaveBeenCalledWith(bridgeIp, {
        type: 'state_update',
        changes: expect.arrayContaining([{ type: 'summary', data: updatedState.summary }]),
      });
    });

    it('should not broadcast when state is identical', async () => {
      const bridgeIp = '192.168.1.100';
      const broadcastSpy = vi.spyOn(websocketService, 'broadcast');

      const state = { summary: { lightsOn: 1 }, rooms: [] };
      dashboardService.getDashboard.mockResolvedValue(state);

      await websocketService.startPolling(bridgeIp, 'test-user');
      broadcastSpy.mockClear();

      // Advance timers to trigger next poll
      await vi.advanceTimersByTimeAsync(websocketService.pollInterval);

      expect(broadcastSpy).not.toHaveBeenCalled();
    });

    it('should handle polling errors gracefully', async () => {
      const bridgeIp = '192.168.1.100';
      dashboardService.getDashboard
        .mockResolvedValueOnce({ summary: {}, rooms: [] })
        .mockRejectedValueOnce(new Error('Network error'));

      await websocketService.startPolling(bridgeIp, 'test-user');

      // Should not throw when poll fails
      await expect(
        vi.advanceTimersByTimeAsync(websocketService.pollInterval)
      ).resolves.not.toThrow();
    });
  });

  describe('logStats', () => {
    it('should call getStats internally', () => {
      const getStatsSpy = vi.spyOn(websocketService, 'getStats');

      websocketService.logStats('test context');

      expect(getStatsSpy).toHaveBeenCalled();
    });
  });
});
