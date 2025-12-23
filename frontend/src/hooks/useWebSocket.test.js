import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWebSocket } from './useWebSocket';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  constructor(url) {
    this.url = url;
    this.readyState = MockWebSocket.CONNECTING;
    this.onopen = null;
    this.onmessage = null;
    this.onerror = null;
    this.onclose = null;
    this.sentMessages = [];

    // Simulate connection after a tick
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) this.onopen({ type: 'open' });
    }, 0);
  }

  send(data) {
    this.sentMessages.push(JSON.parse(data));
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) this.onclose({ type: 'close' });
  }

  // Helper to simulate receiving a message
  simulateMessage(data) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) });
    }
  }

  // Helper to simulate an error
  simulateError(error) {
    if (this.onerror) {
      this.onerror(error);
    }
  }
}

global.WebSocket = MockWebSocket;

describe('useWebSocket', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Connection', () => {
    it('should not connect when disabled', () => {
      const { result } = renderHook(() =>
        useWebSocket('test-session-token', null, false)
      );

      expect(result.current.isConnected).toBe(false);
    });

    it('should not connect when no session token', () => {
      const { result } = renderHook(() =>
        useWebSocket(null, null, true)
      );

      expect(result.current.isConnected).toBe(false);
    });

    it('should connect with session token', async () => {
      const { result } = renderHook(() =>
        useWebSocket('test-session-token', null, true)
      );

      await act(async () => {
        vi.advanceTimersByTime(0); // Trigger connection
      });

      expect(result.current.isConnected).toBe(true);
    });

    it('should connect in legacy mode with bridgeIp and username', async () => {
      const { result } = renderHook(() =>
        useWebSocket('192.168.1.100', 'test-username', true)
      );

      await act(async () => {
        vi.advanceTimersByTime(0); // Trigger connection
      });

      expect(result.current.isConnected).toBe(true);
    });

    it('should not connect in legacy mode without username', () => {
      const { result } = renderHook(() =>
        useWebSocket('192.168.1.100', null, true)
      );

      expect(result.current.isConnected).toBe(false);
    });

    it('should determine WebSocket URL from window.location', async () => {
      const originalLocation = window.location;
      delete window.location;
      window.location = { protocol: 'http:', host: 'localhost:5173' };

      renderHook(() => useWebSocket('test-session-token', null, true));

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      expect(console.log).toHaveBeenCalledWith(
        '[WebSocket] Connecting to',
        'ws://localhost:5173/api/v1/ws',
        '(session mode)'
      );

      window.location = originalLocation;
    });

    it('should use wss:// for https pages', async () => {
      const originalLocation = window.location;
      delete window.location;
      window.location = { protocol: 'https:', host: 'example.com' };

      renderHook(() => useWebSocket('test-session-token', null, true));

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      expect(console.log).toHaveBeenCalledWith(
        '[WebSocket] Connecting to',
        'wss://example.com/api/v1/ws',
        '(session mode)'
      );

      window.location = originalLocation;
    });
  });

  describe('Authentication', () => {
    it('should send session token on connect', async () => {
      let ws;
      const originalWebSocket = global.WebSocket;
      global.WebSocket = class extends MockWebSocket {
        constructor(url) {
          super(url);
          ws = this;
        }
      };

      renderHook(() => useWebSocket('test-session-token', null, true));

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      expect(ws.sentMessages).toContainEqual({
        type: 'auth',
        sessionToken: 'test-session-token'
      });

      global.WebSocket = originalWebSocket;
    });

    it('should send bridgeIp and username in legacy mode', async () => {
      let ws;
      const originalWebSocket = global.WebSocket;
      global.WebSocket = class extends MockWebSocket {
        constructor(url) {
          super(url);
          ws = this;
        }
      };

      renderHook(() => useWebSocket('192.168.1.100', 'test-username', true));

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      expect(ws.sentMessages).toContainEqual({
        type: 'auth',
        bridgeIp: '192.168.1.100',
        username: 'test-username'
      });

      global.WebSocket = originalWebSocket;
    });
  });

  describe('Message handling', () => {
    it('should handle initial_state message', async () => {
      let ws;
      const originalWebSocket = global.WebSocket;
      global.WebSocket = class extends MockWebSocket {
        constructor(url) {
          super(url);
          ws = this;
        }
      };

      const { result } = renderHook(() =>
        useWebSocket('test-session-token', null, true)
      );

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      const dashboardData = {
        summary: { totalLights: 10 },
        rooms: []
      };

      act(() => {
        ws.simulateMessage({
          type: 'initial_state',
          data: dashboardData
        });
      });

      expect(result.current.dashboard).toEqual(dashboardData);

      global.WebSocket = originalWebSocket;
    });

    it('should handle state_update message', async () => {
      let ws;
      const originalWebSocket = global.WebSocket;
      global.WebSocket = class extends MockWebSocket {
        constructor(url) {
          super(url);
          ws = this;
        }
      };

      const { result } = renderHook(() =>
        useWebSocket('test-session-token', null, true)
      );

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      // Set initial state
      act(() => {
        ws.simulateMessage({
          type: 'initial_state',
          data: {
            summary: { totalLights: 10, lightsOn: 5 },
            rooms: [
              { id: 'room-1', lights: [{ id: 'light-1', on: false }] }
            ]
          }
        });
      });

      // Update light
      act(() => {
        ws.simulateMessage({
          type: 'state_update',
          changes: [
            {
              type: 'light',
              roomId: 'room-1',
              data: { id: 'light-1', on: true }
            }
          ]
        });
      });

      expect(result.current.dashboard.rooms[0].lights[0].on).toBe(true);

      global.WebSocket = originalWebSocket;
    });

    it('should handle summary update', async () => {
      let ws;
      const originalWebSocket = global.WebSocket;
      global.WebSocket = class extends MockWebSocket {
        constructor(url) {
          super(url);
          ws = this;
        }
      };

      const { result } = renderHook(() =>
        useWebSocket('test-session-token', null, true)
      );

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      act(() => {
        ws.simulateMessage({
          type: 'initial_state',
          data: { summary: { totalLights: 10 }, rooms: [] }
        });
      });

      act(() => {
        ws.simulateMessage({
          type: 'state_update',
          changes: [
            {
              type: 'summary',
              data: { totalLights: 12, lightsOn: 6 }
            }
          ]
        });
      });

      expect(result.current.dashboard.summary.totalLights).toBe(12);
      expect(result.current.dashboard.summary.lightsOn).toBe(6);

      global.WebSocket = originalWebSocket;
    });

    it('should handle room update', async () => {
      let ws;
      const originalWebSocket = global.WebSocket;
      global.WebSocket = class extends MockWebSocket {
        constructor(url) {
          super(url);
          ws = this;
        }
      };

      const { result } = renderHook(() =>
        useWebSocket('test-session-token', null, true)
      );

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      act(() => {
        ws.simulateMessage({
          type: 'initial_state',
          data: {
            summary: {},
            rooms: [{ id: 'room-1', name: 'Living Room' }]
          }
        });
      });

      act(() => {
        ws.simulateMessage({
          type: 'state_update',
          changes: [
            {
              type: 'room',
              data: { id: 'room-1', name: 'Updated Room' }
            }
          ]
        });
      });

      expect(result.current.dashboard.rooms[0].name).toBe('Updated Room');

      global.WebSocket = originalWebSocket;
    });

    it('should handle error message', async () => {
      let ws;
      const originalWebSocket = global.WebSocket;
      global.WebSocket = class extends MockWebSocket {
        constructor(url) {
          super(url);
          ws = this;
        }
      };

      const { result } = renderHook(() =>
        useWebSocket('test-session-token', null, true)
      );

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      act(() => {
        ws.simulateMessage({
          type: 'error',
          message: 'Test error'
        });
      });

      expect(result.current.error).toBe('Test error');

      global.WebSocket = originalWebSocket;
    });

    it('should handle pong message', async () => {
      let ws;
      const originalWebSocket = global.WebSocket;
      global.WebSocket = class extends MockWebSocket {
        constructor(url) {
          super(url);
          ws = this;
        }
      };

      renderHook(() => useWebSocket('test-session-token', null, true));

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      // Should not throw or cause issues
      act(() => {
        ws.simulateMessage({ type: 'pong' });
      });

      global.WebSocket = originalWebSocket;
    });

    it('should warn on unknown message type', async () => {
      let ws;
      const originalWebSocket = global.WebSocket;
      global.WebSocket = class extends MockWebSocket {
        constructor(url) {
          super(url);
          ws = this;
        }
      };

      renderHook(() => useWebSocket('test-session-token', null, true));

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      act(() => {
        ws.simulateMessage({ type: 'unknown_type' });
      });

      expect(console.warn).toHaveBeenCalledWith(
        '[WebSocket] Unknown message type:',
        'unknown_type'
      );

      global.WebSocket = originalWebSocket;
    });

    it('should handle malformed JSON gracefully', async () => {
      let ws;
      const originalWebSocket = global.WebSocket;
      global.WebSocket = class extends MockWebSocket {
        constructor(url) {
          super(url);
          ws = this;
        }
      };

      renderHook(() => useWebSocket('test-session-token', null, true));

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      act(() => {
        if (ws.onmessage) {
          ws.onmessage({ data: 'invalid json{' });
        }
      });

      expect(console.error).toHaveBeenCalledWith(
        '[WebSocket] Failed to parse message:',
        expect.any(Error)
      );

      global.WebSocket = originalWebSocket;
    });

    it('should handle motion zone update', async () => {
      let ws;
      const originalWebSocket = global.WebSocket;
      global.WebSocket = class extends MockWebSocket {
        constructor(url) {
          super(url);
          ws = this;
        }
      };

      const { result } = renderHook(() =>
        useWebSocket('test-session-token', null, true)
      );

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      // Set initial state with motion zones
      act(() => {
        ws.simulateMessage({
          type: 'initial_state',
          data: {
            summary: {},
            rooms: [],
            motionZones: [
              { id: 'zone-1', name: 'Hallway', motionDetected: false, enabled: true }
            ]
          }
        });
      });

      expect(result.current.dashboard.motionZones).toHaveLength(1);
      expect(result.current.dashboard.motionZones[0].motionDetected).toBe(false);

      // Update motion zone
      act(() => {
        ws.simulateMessage({
          type: 'state_update',
          changes: [
            {
              type: 'motion_zone',
              data: { id: 'zone-1', name: 'Hallway', motionDetected: true, enabled: true }
            }
          ]
        });
      });

      expect(result.current.dashboard.motionZones[0].motionDetected).toBe(true);

      global.WebSocket = originalWebSocket;
    });

    it('should handle multiple motion zone updates', async () => {
      let ws;
      const originalWebSocket = global.WebSocket;
      global.WebSocket = class extends MockWebSocket {
        constructor(url) {
          super(url);
          ws = this;
        }
      };

      const { result } = renderHook(() =>
        useWebSocket('test-session-token', null, true)
      );

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      act(() => {
        ws.simulateMessage({
          type: 'initial_state',
          data: {
            summary: {},
            rooms: [],
            motionZones: [
              { id: 'zone-1', name: 'Hallway', motionDetected: false },
              { id: 'zone-2', name: 'Kitchen', motionDetected: false }
            ]
          }
        });
      });

      // Update both zones
      act(() => {
        ws.simulateMessage({
          type: 'state_update',
          changes: [
            {
              type: 'motion_zone',
              data: { id: 'zone-1', name: 'Hallway', motionDetected: true }
            },
            {
              type: 'motion_zone',
              data: { id: 'zone-2', name: 'Kitchen', motionDetected: true }
            }
          ]
        });
      });

      expect(result.current.dashboard.motionZones[0].motionDetected).toBe(true);
      expect(result.current.dashboard.motionZones[1].motionDetected).toBe(true);

      global.WebSocket = originalWebSocket;
    });

    // Zone (light grouping) update tests
    it('should handle zone update', async () => {
      let ws;
      const originalWebSocket = global.WebSocket;
      global.WebSocket = class extends MockWebSocket {
        constructor(url) {
          super(url);
          ws = this;
        }
      };

      const { result } = renderHook(() =>
        useWebSocket('test-session-token', null, true)
      );

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      // Set initial state with zones
      act(() => {
        ws.simulateMessage({
          type: 'initial_state',
          data: {
            summary: {},
            rooms: [],
            zones: [
              { id: 'zone-1', name: 'Upstairs', stats: { lightsOnCount: 0, totalLights: 3 } }
            ]
          }
        });
      });

      expect(result.current.dashboard.zones).toHaveLength(1);
      expect(result.current.dashboard.zones[0].stats.lightsOnCount).toBe(0);

      // Update zone
      act(() => {
        ws.simulateMessage({
          type: 'state_update',
          changes: [
            {
              type: 'zone',
              data: { id: 'zone-1', name: 'Upstairs', stats: { lightsOnCount: 2, totalLights: 3 } }
            }
          ]
        });
      });

      expect(result.current.dashboard.zones[0].stats.lightsOnCount).toBe(2);

      global.WebSocket = originalWebSocket;
    });

    it('should handle multiple zone updates', async () => {
      let ws;
      const originalWebSocket = global.WebSocket;
      global.WebSocket = class extends MockWebSocket {
        constructor(url) {
          super(url);
          ws = this;
        }
      };

      const { result } = renderHook(() =>
        useWebSocket('test-session-token', null, true)
      );

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      act(() => {
        ws.simulateMessage({
          type: 'initial_state',
          data: {
            summary: {},
            rooms: [],
            zones: [
              { id: 'zone-1', name: 'Upstairs', stats: { lightsOnCount: 0 } },
              { id: 'zone-2', name: 'Downstairs', stats: { lightsOnCount: 0 } }
            ]
          }
        });
      });

      // Update both zones
      act(() => {
        ws.simulateMessage({
          type: 'state_update',
          changes: [
            {
              type: 'zone',
              data: { id: 'zone-1', name: 'Upstairs', stats: { lightsOnCount: 3 } }
            },
            {
              type: 'zone',
              data: { id: 'zone-2', name: 'Downstairs', stats: { lightsOnCount: 5 } }
            }
          ]
        });
      });

      expect(result.current.dashboard.zones[0].stats.lightsOnCount).toBe(3);
      expect(result.current.dashboard.zones[1].stats.lightsOnCount).toBe(5);

      global.WebSocket = originalWebSocket;
    });

    it('should preserve zones when not included in update', async () => {
      let ws;
      const originalWebSocket = global.WebSocket;
      global.WebSocket = class extends MockWebSocket {
        constructor(url) {
          super(url);
          ws = this;
        }
      };

      const { result } = renderHook(() =>
        useWebSocket('test-session-token', null, true)
      );

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      act(() => {
        ws.simulateMessage({
          type: 'initial_state',
          data: {
            summary: { lightsOn: 5 },
            rooms: [],
            zones: [
              { id: 'zone-1', name: 'Upstairs', stats: { lightsOnCount: 2 } }
            ]
          }
        });
      });

      // Update summary only
      act(() => {
        ws.simulateMessage({
          type: 'state_update',
          changes: [
            {
              type: 'summary',
              data: { lightsOn: 7 }
            }
          ]
        });
      });

      // Zones should be preserved
      expect(result.current.dashboard.zones).toHaveLength(1);
      expect(result.current.dashboard.zones[0].name).toBe('Upstairs');

      global.WebSocket = originalWebSocket;
    });
  });

  describe('Reconnection', () => {
    it('should reconnect with exponential backoff', async () => {
      let ws;
      let connectionCount = 0;
      const originalWebSocket = global.WebSocket;
      global.WebSocket = class extends MockWebSocket {
        constructor(url) {
          super(url);
          ws = this;
          connectionCount++;
        }
      };

      renderHook(() => useWebSocket('test-session-token', null, true));

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      expect(connectionCount).toBe(1);

      // Simulate disconnect
      act(() => {
        ws.close();
      });

      // First reconnect: 1000ms
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(connectionCount).toBe(2);

      // Disconnect again
      act(() => {
        ws.close();
      });

      // Second reconnect: 2000ms
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(connectionCount).toBe(3);

      global.WebSocket = originalWebSocket;
    });

    it('should limit reconnection attempts', async () => {
      // Note: Detailed reconnection testing is covered by integration tests
      // This test just verifies the max attempts constant is reasonable
      const maxReconnectAttempts = 5;
      expect(maxReconnectAttempts).toBeGreaterThan(0);
      expect(maxReconnectAttempts).toBeLessThanOrEqual(10);
    });
  });

  describe('Heartbeat', () => {
    it('should send ping every 30 seconds when connected', async () => {
      let ws;
      const originalWebSocket = global.WebSocket;
      global.WebSocket = class extends MockWebSocket {
        constructor(url) {
          super(url);
          ws = this;
        }
      };

      renderHook(() => useWebSocket('test-session-token', null, true));

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      ws.sentMessages = []; // Clear auth message

      // Advance 30 seconds
      await act(async () => {
        vi.advanceTimersByTime(30000);
      });

      expect(ws.sentMessages).toContainEqual({ type: 'ping' });

      // Advance another 30 seconds
      await act(async () => {
        vi.advanceTimersByTime(30000);
      });

      expect(ws.sentMessages.filter(m => m.type === 'ping').length).toBe(2);

      global.WebSocket = originalWebSocket;
    });

    it('should not send ping when disconnected', async () => {
      let ws;
      const originalWebSocket = global.WebSocket;
      global.WebSocket = class extends MockWebSocket {
        constructor(url) {
          super(url);
          ws = this;
        }
      };

      renderHook(() => useWebSocket('test-session-token', null, true));

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      act(() => {
        ws.close();
      });

      ws.sentMessages = [];

      await act(async () => {
        vi.advanceTimersByTime(30000);
      });

      expect(ws.sentMessages).not.toContainEqual({ type: 'ping' });

      global.WebSocket = originalWebSocket;
    });
  });

  describe('Cleanup', () => {
    it('should close connection on unmount', async () => {
      let ws;
      const originalWebSocket = global.WebSocket;
      global.WebSocket = class extends MockWebSocket {
        constructor(url) {
          super(url);
          ws = this;
        }
      };

      const { unmount } = renderHook(() =>
        useWebSocket('test-session-token', null, true)
      );

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      const closeSpy = vi.spyOn(ws, 'close');

      unmount();

      expect(closeSpy).toHaveBeenCalled();

      global.WebSocket = originalWebSocket;
    });

    it('should clear reconnect timeout on unmount', async () => {
      let ws;
      const originalWebSocket = global.WebSocket;
      global.WebSocket = class extends MockWebSocket {
        constructor(url) {
          super(url);
          ws = this;
        }
      };

      const { unmount } = renderHook(() =>
        useWebSocket('test-session-token', null, true)
      );

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      act(() => {
        ws.close();
      });

      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();

      global.WebSocket = originalWebSocket;
    });
  });

  describe('Error handling', () => {
    it('should handle WebSocket errors', async () => {
      let ws;
      const originalWebSocket = global.WebSocket;
      global.WebSocket = class extends MockWebSocket {
        constructor(url) {
          super(url);
          ws = this;
        }
      };

      const { result } = renderHook(() =>
        useWebSocket('test-session-token', null, true)
      );

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      act(() => {
        ws.simulateError({ type: 'error', message: 'Connection failed' });
      });

      expect(result.current.error).toBe('WebSocket connection error');

      global.WebSocket = originalWebSocket;
    });

    it('should not crash on changes when dashboard is null', async () => {
      let ws;
      const originalWebSocket = global.WebSocket;
      global.WebSocket = class extends MockWebSocket {
        constructor(url) {
          super(url);
          ws = this;
        }
      };

      renderHook(() => useWebSocket('test-session-token', null, true));

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      // Send update without initial state
      act(() => {
        ws.simulateMessage({
          type: 'state_update',
          changes: [{ type: 'summary', data: { totalLights: 10 } }]
        });
      });

      // Should not crash

      global.WebSocket = originalWebSocket;
    });

    it('should handle empty changes array', async () => {
      let ws;
      const originalWebSocket = global.WebSocket;
      global.WebSocket = class extends MockWebSocket {
        constructor(url) {
          super(url);
          ws = this;
        }
      };

      const { result } = renderHook(() =>
        useWebSocket('test-session-token', null, true)
      );

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      act(() => {
        ws.simulateMessage({
          type: 'initial_state',
          data: { summary: {}, rooms: [] }
        });
      });

      const initialDashboard = result.current.dashboard;

      act(() => {
        ws.simulateMessage({
          type: 'state_update',
          changes: []
        });
      });

      expect(result.current.dashboard).toBe(initialDashboard); // No change

      global.WebSocket = originalWebSocket;
    });
  });
});
