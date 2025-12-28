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
    websocketService.pollingIntervals.clear();
    websocketService.stateCache.clear();
    websocketService.io = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getStats', () => {
    it('should return zero stats when no connections', () => {
      const stats = websocketService.getStats();
      expect(stats.totalClients).toBe(0);
      expect(stats.pollingIntervals).toBe(0);
    });

    it('should report polling intervals', () => {
      websocketService.pollingIntervals.set('192.168.1.100', 123);
      websocketService.stateCache.set('192.168.1.100', { some: 'data' });
      websocketService.io = {
        sockets: {
          sockets: new Map(),
          adapter: { rooms: new Map() },
        },
      };

      const stats = websocketService.getStats();

      expect(stats.pollingIntervals).toBe(1);
      expect(stats.bridges['192.168.1.100']).toBeDefined();
      expect(stats.bridges['192.168.1.100'].hasPolling).toBe(true);
      expect(stats.bridges['192.168.1.100'].hasCache).toBe(true);
    });
  });

  describe('stopPolling', () => {
    it('should clear interval when polling exists', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      websocketService.pollingIntervals.set('192.168.1.100', 12345);

      websocketService.stopPolling('192.168.1.100');

      expect(clearIntervalSpy).toHaveBeenCalledWith(12345);
      expect(websocketService.pollingIntervals.has('192.168.1.100')).toBe(false);
    });

    it('should do nothing when no polling exists', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      websocketService.stopPolling('192.168.1.100');

      expect(clearIntervalSpy).not.toHaveBeenCalled();
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

    it('should clear state cache', () => {
      websocketService.stateCache.set('192.168.1.100', {});

      websocketService.shutdown();

      expect(websocketService.stateCache.size).toBe(0);
    });

    it('should close Socket.IO server if initialized', () => {
      const mockClose = vi.fn();
      websocketService.io = { close: mockClose };

      websocketService.shutdown();

      expect(mockClose).toHaveBeenCalled();
    });
  });

  describe('detectChanges', () => {
    it('should detect summary changes', () => {
      const previous = {
        summary: { lightsOn: 1, totalLights: 3 },
        rooms: [],
      };
      const current = {
        summary: { lightsOn: 2, totalLights: 3 },
        rooms: [],
      };

      const changes = websocketService.detectChanges(previous, current);

      expect(changes).toContainEqual({ type: 'summary', data: current.summary });
    });

    it('should detect room changes', () => {
      const previous = {
        summary: {},
        rooms: [{ id: 'room-1', name: 'Living Room', stats: { lightsOnCount: 0 }, lights: [] }],
      };
      const current = {
        summary: {},
        rooms: [{ id: 'room-1', name: 'Living Room', stats: { lightsOnCount: 1 }, lights: [] }],
      };

      const changes = websocketService.detectChanges(previous, current);

      expect(changes).toContainEqual({ type: 'room', data: current.rooms[0] });
    });

    it('should detect light changes within rooms', () => {
      const previous = {
        summary: {},
        rooms: [
          {
            id: 'room-1',
            name: 'Living Room',
            lights: [{ id: 'light-1', on: { on: false } }],
          },
        ],
      };
      const current = {
        summary: {},
        rooms: [
          {
            id: 'room-1',
            name: 'Living Room',
            lights: [{ id: 'light-1', on: { on: true } }],
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

    it('should detect motion zone changes', () => {
      const previous = {
        summary: {},
        rooms: [],
        motionZones: [{ id: 'zone-1', motionDetected: false }],
      };
      const current = {
        summary: {},
        rooms: [],
        motionZones: [{ id: 'zone-1', motionDetected: true }],
      };

      const changes = websocketService.detectChanges(previous, current);

      expect(changes).toContainEqual({ type: 'motion_zone', data: current.motionZones[0] });
    });

    it('should detect zone changes', () => {
      const previous = {
        summary: {},
        rooms: [],
        zones: [{ id: 'zone-1', stats: { lightsOnCount: 0 } }],
      };
      const current = {
        summary: {},
        rooms: [],
        zones: [{ id: 'zone-1', stats: { lightsOnCount: 1 } }],
      };

      const changes = websocketService.detectChanges(previous, current);

      expect(changes).toContainEqual({ type: 'zone', data: current.zones[0] });
    });

    it('should handle missing arrays gracefully', () => {
      const previous = { summary: {}, rooms: [] };
      const current = {
        summary: {},
        rooms: [],
        motionZones: [{ id: 'zone-1' }],
        zones: [{ id: 'zone-2' }],
      };

      const changes = websocketService.detectChanges(previous, current);

      expect(changes).toContainEqual({ type: 'motion_zone', data: current.motionZones[0] });
      expect(changes).toContainEqual({ type: 'zone', data: current.zones[0] });
    });

    it('should not detect changes when state is identical', () => {
      const state = {
        summary: { lightsOn: 1 },
        rooms: [{ id: 'room-1', lights: [{ id: 'light-1' }] }],
        motionZones: [{ id: 'mz-1' }],
        zones: [{ id: 'z-1' }],
      };

      const changes = websocketService.detectChanges(state, JSON.parse(JSON.stringify(state)));

      expect(changes).toHaveLength(0);
    });
  });

  describe('handleAuth', () => {
    const mockDashboard = { summary: { lightsOn: 1 }, rooms: [] };

    beforeEach(() => {
      dashboardService.getDashboard.mockResolvedValue(mockDashboard);
    });

    it('should authenticate with session token', async () => {
      const mockSocket = { data: {}, join: vi.fn(), emit: vi.fn() };
      websocketService.io = {
        sockets: { adapter: { rooms: new Map() } },
      };
      sessionManager.getSession.mockReturnValue({
        bridgeIp: '192.168.1.100',
        username: 'test-user',
      });

      await websocketService.handleAuth(mockSocket, { sessionToken: 'valid-token' });

      expect(mockSocket.data.bridgeIp).toBe('192.168.1.100');
      expect(mockSocket.data.username).toBe('test-user');
      expect(mockSocket.data.authMethod).toBe('session');
      expect(mockSocket.join).toHaveBeenCalledWith('bridge:192.168.1.100');
      expect(mockSocket.emit).toHaveBeenCalledWith('initial_state', mockDashboard);
    });

    it('should authenticate with demo mode', async () => {
      const mockSocket = { data: {}, join: vi.fn(), emit: vi.fn() };
      websocketService.io = {
        sockets: { adapter: { rooms: new Map() } },
      };

      await websocketService.handleAuth(mockSocket, { demoMode: true });

      expect(mockSocket.data.bridgeIp).toBe(DEMO_BRIDGE_IP);
      expect(mockSocket.data.username).toBe(DEMO_USERNAME);
      expect(mockSocket.data.authMethod).toBe('demo');
      expect(mockSocket.data.demoMode).toBe(true);
    });

    it('should reject invalid session token', async () => {
      const mockSocket = { data: {}, emit: vi.fn() };
      sessionManager.getSession.mockReturnValue(null);

      await websocketService.handleAuth(mockSocket, { sessionToken: 'invalid-token' });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Invalid or expired session token',
      });
    });

    it('should reject missing authentication', async () => {
      const mockSocket = { data: {}, emit: vi.fn() };

      await websocketService.handleAuth(mockSocket, {});

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Missing authentication: provide demoMode or sessionToken',
      });
    });

    it('should send error when dashboard fetch fails', async () => {
      const mockSocket = { data: {}, join: vi.fn(), emit: vi.fn() };
      websocketService.io = {
        sockets: { adapter: { rooms: new Map() } },
      };
      sessionManager.getSession.mockReturnValue({
        bridgeIp: '192.168.1.100',
        username: 'test-user',
      });
      dashboardService.getDashboard.mockRejectedValue(new Error('Network error'));

      await websocketService.handleAuth(mockSocket, { sessionToken: 'token' });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Failed to fetch initial state',
      });
    });
  });

  describe('handleDisconnect', () => {
    it('should stop polling when no connections remain', () => {
      const stopPollingSpy = vi.spyOn(websocketService, 'stopPolling');
      websocketService.pollingIntervals.set('192.168.1.100', 123);
      websocketService.stateCache.set('192.168.1.100', {});
      websocketService.io = {
        sockets: { adapter: { rooms: new Map() } }, // Empty rooms = no connections
      };

      const mockSocket = { data: { bridgeIp: '192.168.1.100' } };
      websocketService.handleDisconnect(mockSocket);

      expect(stopPollingSpy).toHaveBeenCalledWith('192.168.1.100');
      expect(websocketService.stateCache.has('192.168.1.100')).toBe(false);
    });

    it('should keep polling when connections remain', () => {
      const stopPollingSpy = vi.spyOn(websocketService, 'stopPolling');
      websocketService.pollingIntervals.set('192.168.1.100', 123);

      // Simulate room with remaining connection
      const rooms = new Map();
      rooms.set('bridge:192.168.1.100', { size: 1 });
      websocketService.io = { sockets: { adapter: { rooms } } };

      const mockSocket = { data: { bridgeIp: '192.168.1.100' } };
      websocketService.handleDisconnect(mockSocket);

      expect(stopPollingSpy).not.toHaveBeenCalled();
    });

    it('should handle disconnect when bridgeIp is not set', () => {
      const mockSocket = { data: {} };

      expect(() => websocketService.handleDisconnect(mockSocket)).not.toThrow();
    });
  });

  describe('Hive Integration', () => {
    it('should emit hive_status event when Hive data changes', async () => {
      const mockSocket = { data: {}, join: vi.fn(), emit: vi.fn() };
      const rooms = new Map();
      rooms.set('bridge:192.168.1.100', { size: 1 });

      websocketService.io = {
        sockets: { adapter: { rooms }, sockets: new Map([[1, mockSocket]]) },
        to: vi.fn().mockReturnThis(),
        emit: vi.fn(),
      };

      const hiveStatus = {
        connected: true,
        temperature: { current: 20.5, target: 21 },
        heating: { isOn: true },
      };

      websocketService.broadcastHiveStatus('192.168.1.100', hiveStatus);

      expect(websocketService.io.to).toHaveBeenCalledWith('bridge:192.168.1.100');
      expect(websocketService.io.emit).toHaveBeenCalledWith('hive_status', hiveStatus);
    });

    it('should detect Hive status changes in detectChanges', () => {
      const previous = {
        summary: {},
        rooms: [],
        services: { hive: { temperature: { current: 20.0 } } },
      };
      const current = {
        summary: {},
        rooms: [],
        services: { hive: { temperature: { current: 21.0 } } },
      };

      const changes = websocketService.detectChanges(previous, current);

      expect(changes).toContainEqual({
        type: 'service',
        serviceId: 'hive',
        data: current.services.hive,
      });
    });

    it('should not detect Hive changes when identical', () => {
      const state = {
        summary: {},
        rooms: [],
        services: { hive: { temperature: { current: 20.0 } } },
      };

      const changes = websocketService.detectChanges(state, JSON.parse(JSON.stringify(state)));

      expect(changes.filter((c) => c.type === 'service' && c.serviceId === 'hive')).toHaveLength(0);
    });

    it('should handle Hive polling when enabled in settings', async () => {
      const mockSocket = { data: {}, join: vi.fn(), emit: vi.fn() };
      websocketService.io = {
        sockets: { adapter: { rooms: new Map() } },
      };
      sessionManager.getSession.mockReturnValue({
        bridgeIp: '192.168.1.100',
        username: 'test-user',
      });

      // Mock settings with Hive enabled
      const mockDashboard = {
        summary: {},
        rooms: [],
        services: { hive: { connected: true, temperature: { current: 20 } } },
      };
      dashboardService.getDashboard.mockResolvedValue(mockDashboard);

      await websocketService.handleAuth(mockSocket, { sessionToken: 'token' });

      expect(mockSocket.emit).toHaveBeenCalledWith('initial_state', mockDashboard);
    });

    it('should include Hive status in initial state when connected', async () => {
      const mockSocket = { data: {}, join: vi.fn(), emit: vi.fn() };
      websocketService.io = {
        sockets: { adapter: { rooms: new Map() } },
      };
      sessionManager.getSession.mockReturnValue({
        bridgeIp: '192.168.1.100',
        username: 'test-user',
      });

      const mockDashboard = {
        summary: {},
        rooms: [],
        services: {
          hive: {
            connected: true,
            temperature: { current: 20.5, target: 21.0 },
            heating: { isOn: true },
          },
        },
      };
      dashboardService.getDashboard.mockResolvedValue(mockDashboard);

      await websocketService.handleAuth(mockSocket, { sessionToken: 'token' });

      const emittedState = mockSocket.emit.mock.calls.find((c) => c[0] === 'initial_state');
      expect(emittedState[1]).toHaveProperty('services.hive');
      expect(emittedState[1].services.hive.connected).toBe(true);
    });
  });

  describe('startPolling', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
      for (const bridgeIp of websocketService.pollingIntervals.keys()) {
        websocketService.stopPolling(bridgeIp);
      }
    });

    it('should fetch initial dashboard state', async () => {
      dashboardService.getDashboard.mockResolvedValue({ summary: {}, rooms: [] });

      await websocketService.startPolling('192.168.1.100', 'test-user');

      expect(dashboardService.getDashboard).toHaveBeenCalledWith('192.168.1.100', 'test-user');
    });

    it('should store polling interval', async () => {
      dashboardService.getDashboard.mockResolvedValue({ summary: {}, rooms: [] });

      await websocketService.startPolling('192.168.1.100', 'test-user');

      expect(websocketService.pollingIntervals.has('192.168.1.100')).toBe(true);
    });

    it('should cache initial state', async () => {
      const dashboard = { summary: { lightsOn: 1 }, rooms: [] };
      dashboardService.getDashboard.mockResolvedValue(dashboard);

      await websocketService.startPolling('192.168.1.100', 'test-user');

      expect(websocketService.stateCache.get('192.168.1.100')).toEqual(dashboard);
    });

    it('should handle polling errors gracefully', async () => {
      dashboardService.getDashboard
        .mockResolvedValueOnce({ summary: {}, rooms: [] })
        .mockRejectedValueOnce(new Error('Network error'));

      await websocketService.startPolling('192.168.1.100', 'test-user');

      await expect(
        vi.advanceTimersByTimeAsync(websocketService.pollInterval)
      ).resolves.not.toThrow();
    });
  });
});
