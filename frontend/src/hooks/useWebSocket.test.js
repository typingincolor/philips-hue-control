import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from './useWebSocket';
import { io } from 'socket.io-client';

// Mock socket.io-client
const mockSocket = {
  on: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  connected: false,
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

// Helper to mock demo mode via URL
const mockDemoModeURL = (isDemoMode) => {
  Object.defineProperty(window, 'location', {
    value: {
      search: isDemoMode ? '?demo=true' : '',
      protocol: 'http:',
      host: 'localhost:5173',
    },
    writable: true,
  });
};

// Helper to trigger socket events
const triggerSocketEvent = (event, data) => {
  const callback = mockSocket.on.mock.calls.find((call) => call[0] === event)?.[1];
  if (callback) {
    act(() => callback(data));
  }
};

describe('useWebSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDemoModeURL(false);
    mockSocket.connected = false;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Connection', () => {
    it('should not connect when disabled', () => {
      renderHook(() => useWebSocket('test-token', false));

      expect(io).not.toHaveBeenCalled();
    });

    it('should not connect when no session token', () => {
      renderHook(() => useWebSocket(null, true));

      expect(io).not.toHaveBeenCalled();
    });

    it('should connect with session token', async () => {
      renderHook(() => useWebSocket('test-token', true));

      expect(io).toHaveBeenCalledWith({
        path: '/api/v2/ws',
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 16000,
      });
    });

    it('should connect in demo mode without token', () => {
      mockDemoModeURL(true);

      renderHook(() => useWebSocket(null, true));

      expect(io).toHaveBeenCalled();
    });
  });

  describe('Authentication', () => {
    it('should send session auth on connect', () => {
      renderHook(() => useWebSocket('test-token', true));

      triggerSocketEvent('connect');

      expect(mockSocket.emit).toHaveBeenCalledWith('auth', { sessionToken: 'test-token' });
    });

    it('should send demo auth on connect in demo mode', () => {
      mockDemoModeURL(true);

      renderHook(() => useWebSocket(null, true));

      triggerSocketEvent('connect');

      expect(mockSocket.emit).toHaveBeenCalledWith('auth', { demoMode: true });
    });
  });

  describe('Connection state', () => {
    it('should update isConnected on connect', () => {
      const { result } = renderHook(() => useWebSocket('test-token', true));

      expect(result.current.isConnected).toBe(false);

      triggerSocketEvent('connect');

      expect(result.current.isConnected).toBe(true);
    });

    it('should update isConnected on disconnect', () => {
      const { result } = renderHook(() => useWebSocket('test-token', true));

      triggerSocketEvent('connect');
      expect(result.current.isConnected).toBe(true);

      triggerSocketEvent('disconnect');
      expect(result.current.isConnected).toBe(false);
    });

    it('should set isReconnecting on connect_error after first connection', () => {
      const { result } = renderHook(() => useWebSocket('test-token', true));

      triggerSocketEvent('connect');
      triggerSocketEvent('disconnect');
      triggerSocketEvent('connect_error');

      expect(result.current.isReconnecting).toBe(true);
    });
  });

  describe('Message handling', () => {
    it('should set dashboard on initial_state', () => {
      const { result } = renderHook(() => useWebSocket('test-token', true));

      const mockDashboard = { summary: { totalLights: 5 }, rooms: [] };
      triggerSocketEvent('initial_state', mockDashboard);

      expect(result.current.dashboard).toEqual(mockDashboard);
    });

    it('should update summary on state_update', () => {
      const { result } = renderHook(() => useWebSocket('test-token', true));

      // Set initial state
      const initialDashboard = { summary: { totalLights: 5 }, rooms: [] };
      triggerSocketEvent('initial_state', initialDashboard);

      // Update summary
      triggerSocketEvent('state_update', {
        changes: [{ type: 'summary', data: { totalLights: 10 } }],
      });

      expect(result.current.dashboard.summary.totalLights).toBe(10);
    });

    it('should update room on state_update', () => {
      const { result } = renderHook(() => useWebSocket('test-token', true));

      const initialDashboard = {
        summary: {},
        rooms: [{ id: 'room-1', name: 'Living Room', lights: [] }],
      };
      triggerSocketEvent('initial_state', initialDashboard);

      triggerSocketEvent('state_update', {
        changes: [{ type: 'room', data: { id: 'room-1', name: 'Updated Room', lights: [] } }],
      });

      expect(result.current.dashboard.rooms[0].name).toBe('Updated Room');
    });

    it('should update light on state_update', () => {
      const { result } = renderHook(() => useWebSocket('test-token', true));

      const initialDashboard = {
        summary: {},
        rooms: [{ id: 'room-1', lights: [{ id: 'light-1', on: false }] }],
      };
      triggerSocketEvent('initial_state', initialDashboard);

      triggerSocketEvent('state_update', {
        changes: [{ type: 'light', data: { id: 'light-1', on: true }, roomId: 'room-1' }],
      });

      expect(result.current.dashboard.rooms[0].lights[0].on).toBe(true);
    });

    it('should update motion_zone on state_update', () => {
      const { result } = renderHook(() => useWebSocket('test-token', true));

      const initialDashboard = {
        summary: {},
        rooms: [],
        motionZones: [{ id: 'zone-1', motion: false }],
      };
      triggerSocketEvent('initial_state', initialDashboard);

      triggerSocketEvent('state_update', {
        changes: [{ type: 'motion_zone', data: { id: 'zone-1', motion: true } }],
      });

      expect(result.current.dashboard.motionZones[0].motion).toBe(true);
    });

    it('should update zone on state_update', () => {
      const { result } = renderHook(() => useWebSocket('test-token', true));

      const initialDashboard = {
        summary: {},
        rooms: [],
        zones: [{ id: 'zone-1', name: 'All Lights' }],
      };
      triggerSocketEvent('initial_state', initialDashboard);

      triggerSocketEvent('state_update', {
        changes: [{ type: 'zone', data: { id: 'zone-1', name: 'Updated Zone' } }],
      });

      expect(result.current.dashboard.zones[0].name).toBe('Updated Zone');
    });
  });

  describe('Error handling', () => {
    it('should set error on error event', () => {
      const { result } = renderHook(() => useWebSocket('test-token', true));

      triggerSocketEvent('error', { message: 'Connection failed' });

      expect(result.current.error).toBe('Connection failed');
    });

    it('should not crash on changes when dashboard is null', () => {
      const { result } = renderHook(() => useWebSocket('test-token', true));

      // Don't set initial state, dashboard is null
      triggerSocketEvent('state_update', {
        changes: [{ type: 'summary', data: { totalLights: 5 } }],
      });

      expect(result.current.dashboard).toBe(null);
    });

    it('should handle empty changes array', () => {
      const { result } = renderHook(() => useWebSocket('test-token', true));

      const initialDashboard = { summary: { totalLights: 5 }, rooms: [] };
      triggerSocketEvent('initial_state', initialDashboard);

      triggerSocketEvent('state_update', { changes: [] });

      expect(result.current.dashboard.summary.totalLights).toBe(5);
    });
  });

  describe('Cleanup', () => {
    it('should disconnect on unmount', () => {
      const { unmount } = renderHook(() => useWebSocket('test-token', true));

      unmount();

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });
});
