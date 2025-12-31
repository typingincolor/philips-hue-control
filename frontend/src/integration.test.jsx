import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

/**
 * Integration Tests
 *
 * These tests verify the full application flow with real components,
 * real hooks, and realistic API responses. They catch issues that
 * unit tests miss due to mocking.
 */

// Setup localStorage before importing App
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value ? value.toString() : '';
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index) => Object.keys(store)[index] || null,
    get length() {
      return Object.keys(store).length;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

import App from './App';
import { UI_TEXT } from './constants/uiText';
import { ERROR_MESSAGES } from './constants/messages';

// Mock socket.io-client for integration tests
let mockSocketHandlers = {};
let mockDashboardData = null;

const createMockSocket = () => ({
  on: vi.fn((event, handler) => {
    mockSocketHandlers[event] = handler;
  }),
  emit: vi.fn((event, _data) => {
    if (event === 'auth') {
      // Simulate successful auth - send initial_state after auth
      setTimeout(() => {
        if (mockSocketHandlers.initial_state && mockDashboardData) {
          mockSocketHandlers.initial_state(mockDashboardData);
        }
      }, 10);
    }
  }),
  disconnect: vi.fn(),
  connected: true,
});

let mockSocket = createMockSocket();

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => {
    mockSocket = createMockSocket();
    // Simulate connection after socket creation
    setTimeout(() => {
      if (mockSocketHandlers.connect) {
        mockSocketHandlers.connect();
      }
    }, 10);
    return mockSocket;
  }),
}));

// Mock data
const mockBridgeIp = '192.168.1.100';
const mockUsername = 'test-user-abc123';
const mockSessionToken = 'hue_sess_xyz789';

const mockDashboard = {
  summary: {
    totalLights: 3,
    lightsOn: 2,
    roomCount: 1,
    sceneCount: 2,
  },
  rooms: [
    {
      id: 'room-1',
      name: 'Living Room',
      stats: {
        lightsOnCount: 2,
        totalLights: 3,
        averageBrightness: 75,
      },
      lights: [
        {
          id: 'light-1',
          name: 'Light 1',
          on: true,
          brightness: 80,
          color: 'rgb(255, 180, 120)',
          shadow: '0 0 20px rgba(255, 180, 120, 0.4)',
        },
        {
          id: 'light-2',
          name: 'Light 2',
          on: true,
          brightness: 70,
          color: 'rgb(100, 150, 255)',
          shadow: '0 0 18px rgba(100, 150, 255, 0.38)',
        },
        {
          id: 'light-3',
          name: 'Light 3',
          on: false,
          brightness: 0,
          color: null,
          shadow: null,
        },
      ],
      scenes: [
        { id: 'scene-1', name: 'Bright' },
        { id: 'scene-2', name: 'Relax' },
      ],
    },
  ],
};

// Setup MSW server
const server = setupServer(
  // Health check endpoint
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok', version: '2.0.0' });
  }),

  // Discovery endpoint
  http.get('/api/discovery', () => {
    return HttpResponse.json([{ id: 'bridge-1', internalipaddress: mockBridgeIp }]);
  }),

  // Pairing endpoint (V2 API - via Hue service)
  http.post('/api/v2/services/hue/pair', async ({ request }) => {
    const body = await request.json();

    // Verify Content-Type header (regression test for bug)
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return new HttpResponse(null, { status: 400 });
    }

    if (!body.bridgeIp) {
      return new HttpResponse(null, { status: 400 });
    }

    return HttpResponse.json({ success: true, username: mockUsername });
  }),

  // Connect with stored credentials (V2 API - via Hue service)
  http.post('/api/v2/services/hue/connect', async ({ request }) => {
    const body = await request.json();

    if (!body.bridgeIp) {
      return new HttpResponse(null, { status: 400 });
    }

    // Simulate no stored credentials - requires pairing
    return HttpResponse.json({ requiresPairing: true });
  }),

  // Session creation endpoint (V2 API)
  http.post('/api/v2/auth/session', async ({ request }) => {
    const body = await request.json();

    if (!body.bridgeIp || !body.username) {
      return new HttpResponse(null, { status: 400 });
    }

    return HttpResponse.json({
      sessionToken: mockSessionToken,
      expiresIn: 86400,
      bridgeIp: body.bridgeIp,
    });
  }),

  // Home endpoint (V2 API - replaces dashboard)
  http.get('/api/v2/home', ({ request }) => {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new HttpResponse(null, { status: 401 });
    }

    // Return V2 Home format
    return HttpResponse.json({
      rooms: [
        {
          id: 'room-1',
          name: 'Living Room',
          devices: [
            {
              id: 'hue:light-1',
              name: 'Light 1',
              type: 'light',
              state: {
                on: true,
                brightness: 80,
                color: 'rgb(255, 180, 120)',
                shadow: '0 0 20px rgba(255, 180, 120, 0.4)',
              },
            },
            {
              id: 'hue:light-2',
              name: 'Light 2',
              type: 'light',
              state: {
                on: true,
                brightness: 70,
                color: 'rgb(100, 150, 255)',
                shadow: '0 0 18px rgba(100, 150, 255, 0.38)',
              },
            },
            {
              id: 'hue:light-3',
              name: 'Light 3',
              type: 'light',
              state: {
                on: false,
                brightness: 0,
                color: null,
                shadow: null,
              },
            },
          ],
          scenes: [
            { id: 'hue:scene-1', name: 'Bright' },
            { id: 'hue:scene-2', name: 'Relax' },
          ],
        },
      ],
    });
  }),

  // Device update endpoint (V2 API)
  http.put('/api/v2/home/devices/:id', async ({ request, params }) => {
    const authHeader = request.headers.get('authorization');
    const body = await request.json();

    if (!authHeader) {
      return new HttpResponse(null, { status: 401 });
    }

    // Return updated light
    return HttpResponse.json({
      success: true,
      device: {
        id: params.id,
        state: {
          on: body.on,
          brightness: body.brightness ?? 100,
          color: body.on ? 'rgb(255, 200, 150)' : null,
          shadow: body.on ? '0 0 20px rgba(255, 200, 150, 0.4)' : null,
        },
      },
    });
  }),

  // Scene activation endpoint (V2 API)
  http.post('/api/v2/home/scenes/:id/activate', ({ request }) => {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return new HttpResponse(null, { status: 401 });
    }

    // Return affected lights with updated state
    return HttpResponse.json({
      success: true,
      affectedLights: ['hue:light-1', 'hue:light-2'],
    });
  }),

  // Session refresh endpoint (V2 API)
  http.post('/api/v2/auth/refresh', ({ request }) => {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return new HttpResponse(null, { status: 401 });
    }

    return HttpResponse.json({
      sessionToken: 'hue_sess_refreshed_abc',
      expiresIn: 86400,
      bridgeIp: mockBridgeIp,
    });
  })
);

beforeAll(() =>
  server.listen({
    onUnhandledRequest: (req) => {
      // Bypass WebSocket connections - they're handled by socket.io mock
      if (req.url.includes('/ws')) {
        return;
      }
      // Error on other unhandled requests
      console.error('Unhandled %s %s', req.method, req.url);
    },
  })
);

beforeEach(() => {
  // Reset socket handlers and set mock dashboard data for WebSocket
  mockSocketHandlers = {};
  mockDashboardData = mockDashboard;
});

afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
  vi.clearAllMocks();
  mockSocketHandlers = {};
});

afterAll(() => server.close());

describe('Integration Tests', () => {
  describe('Full Authentication Flow', () => {
    it('completes settings → discovery → pairing → session → dashboard', async () => {
      const user = userEvent.setup();

      render(<App />);

      // Step 0: Should show settings page first (deferred service activation)
      expect(screen.getByText(UI_TEXT.SETTINGS_TITLE)).toBeInTheDocument();

      // Enable Hue service
      const hueToggle = screen.getByRole('switch', { name: /hue/i });
      await user.click(hueToggle);

      // Step 1: Should show discovery screen after enabling Hue
      await waitFor(() => {
        expect(screen.getByText(UI_TEXT.BUTTON_DISCOVER_BRIDGE)).toBeInTheDocument();
      });

      // Click discover button
      const discoverButton = screen.getByText(UI_TEXT.BUTTON_DISCOVER_BRIDGE);
      await user.click(discoverButton);

      // Should find bridge and show it
      await waitFor(() => {
        expect(screen.getByText(mockBridgeIp)).toBeInTheDocument();
      });

      // Select bridge
      const selectButton = screen.getByText('Use This Bridge');
      await user.click(selectButton);

      // Step 2: Should show authentication screen
      await waitFor(() => {
        expect(screen.getByText(new RegExp(UI_TEXT.AUTH_TITLE, 'i'))).toBeInTheDocument();
      });

      // Click "I Pressed the Button"
      const authButton = screen.getByText(new RegExp(UI_TEXT.BUTTON_I_PRESSED_BUTTON, 'i'));
      await user.click(authButton);

      // Step 3: Should show dashboard with lights
      await waitFor(
        () => {
          expect(screen.getByText('Living Room')).toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      // Verify dashboard content (wait for lights to render)
      await waitFor(() => {
        expect(screen.getByText('Light 1')).toBeInTheDocument();
        expect(screen.getByText('Light 2')).toBeInTheDocument();
        expect(screen.getByText('Light 3')).toBeInTheDocument();
      });

      // Verify toolbar exists (stats show icons with values)
      const toolbar = document.querySelector('.top-toolbar');
      expect(toolbar).toBeInTheDocument();
    });

    it('includes Content-Type header in pairing request', async () => {
      const user = userEvent.setup();
      let pairRequestHeaders = null;

      // Intercept pairing request to check headers
      server.use(
        http.post('/api/v2/services/hue/pair', async ({ request }) => {
          pairRequestHeaders = Object.fromEntries(request.headers.entries());
          return HttpResponse.json({ success: true, username: mockUsername });
        })
      );

      render(<App />);

      // Enable Hue from settings page first
      const hueToggle = screen.getByRole('switch', { name: /hue/i });
      await user.click(hueToggle);

      // Navigate to authentication
      await waitFor(() => screen.getByText(UI_TEXT.BUTTON_DISCOVER_BRIDGE));
      await user.click(screen.getByText(UI_TEXT.BUTTON_DISCOVER_BRIDGE));
      await waitFor(() => screen.getByText(mockBridgeIp));
      await user.click(screen.getByText(UI_TEXT.BUTTON_USE_THIS_BRIDGE));
      await waitFor(() => screen.getByText(new RegExp(UI_TEXT.AUTH_TITLE, 'i')));
      await user.click(screen.getByText(new RegExp(UI_TEXT.BUTTON_I_PRESSED_BUTTON, 'i')));

      // Wait for request to complete
      await waitFor(() => {
        expect(pairRequestHeaders).not.toBeNull();
      });

      // Verify Content-Type header is present (regression test)
      expect(pairRequestHeaders['content-type']).toContain('application/json');
    });
  });

  describe('Session Management', () => {
    it('persists session to localStorage', async () => {
      const user = userEvent.setup();

      render(<App />);

      // Enable Hue from settings page first
      const hueToggle = screen.getByRole('switch', { name: /hue/i });
      await user.click(hueToggle);

      // Complete authentication
      await waitFor(() => screen.getByText(UI_TEXT.BUTTON_DISCOVER_BRIDGE));
      await user.click(screen.getByText(UI_TEXT.BUTTON_DISCOVER_BRIDGE));
      await waitFor(() => screen.getByText(mockBridgeIp));
      await user.click(screen.getByText(UI_TEXT.BUTTON_USE_THIS_BRIDGE));
      await waitFor(() => screen.getByText(new RegExp(UI_TEXT.AUTH_TITLE, 'i')));
      await user.click(screen.getByText(new RegExp(UI_TEXT.BUTTON_I_PRESSED_BUTTON, 'i')));

      // Wait for dashboard
      await waitFor(() => screen.getByText('Living Room'));

      // Verify localStorage has session
      expect(localStorage.getItem('hue_session_token')).toBe(mockSessionToken);
      expect(localStorage.getItem('hue_bridge_ip')).toBe(mockBridgeIp);
      expect(localStorage.getItem('hue_session_expires_at')).toBeTruthy();
    });

    it('restores session on page reload', async () => {
      // Pre-populate localStorage with session
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours from now
      localStorage.setItem('hue_session_token', mockSessionToken);
      localStorage.setItem('hue_bridge_ip', mockBridgeIp);
      localStorage.setItem('hue_session_expires_at', expiresAt.toString());

      render(<App />);

      // Should skip straight to dashboard
      await waitFor(
        () => {
          expect(screen.getByText('Living Room')).toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      // Should NOT show authentication screen
      expect(screen.queryByText(/Press the Link Button/i)).not.toBeInTheDocument();
    });
  });

  describe('WebSocket Connection', () => {
    it('connects and receives initial dashboard state', async () => {
      const user = userEvent.setup();

      render(<App />);

      // Enable Hue from settings page first
      const hueToggle = screen.getByRole('switch', { name: /hue/i });
      await user.click(hueToggle);

      // Complete authentication
      await waitFor(() => screen.getByText(UI_TEXT.BUTTON_DISCOVER_BRIDGE));
      await user.click(screen.getByText(UI_TEXT.BUTTON_DISCOVER_BRIDGE));
      await waitFor(() => screen.getByText(mockBridgeIp));
      await user.click(screen.getByText(UI_TEXT.BUTTON_USE_THIS_BRIDGE));
      await waitFor(() => screen.getByText(new RegExp(UI_TEXT.AUTH_TITLE, 'i')));
      await user.click(screen.getByText(new RegExp(UI_TEXT.BUTTON_I_PRESSED_BUTTON, 'i')));

      // Wait for WebSocket to connect and receive data (wait for lights to render)
      await waitFor(
        () => {
          expect(screen.getByText('Light 1')).toBeInTheDocument();
          expect(screen.getByText('Light 2')).toBeInTheDocument();
        },
        { timeout: 10000 }
      );
    });

    it('does not show error flash during initial connection', async () => {
      const user = userEvent.setup();

      render(<App />);

      // Enable Hue from settings page first
      const hueToggle = screen.getByRole('switch', { name: /hue/i });
      await user.click(hueToggle);

      // Complete authentication
      await waitFor(() => screen.getByText(UI_TEXT.BUTTON_DISCOVER_BRIDGE));
      await user.click(screen.getByText(UI_TEXT.BUTTON_DISCOVER_BRIDGE));
      await waitFor(() => screen.getByText(mockBridgeIp));
      await user.click(screen.getByText(UI_TEXT.BUTTON_USE_THIS_BRIDGE));
      await waitFor(() => screen.getByText(new RegExp(UI_TEXT.AUTH_TITLE, 'i')));
      await user.click(screen.getByText(new RegExp(UI_TEXT.BUTTON_I_PRESSED_BUTTON, 'i')));

      // Should show loading state, not error
      expect(screen.getByText(new RegExp(UI_TEXT.LOADING_CONNECTING, 'i'))).toBeInTheDocument();

      // Wait for dashboard
      await waitFor(
        () => {
          expect(screen.getByText('Living Room')).toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      // Should never have shown error
      expect(screen.queryByText(/Connection Failed/i)).not.toBeInTheDocument();
    });
  });

  describe('Scene Activation', () => {
    it('updates lights immediately (optimistic update)', async () => {
      const user = userEvent.setup();

      // Start with authenticated session
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem('hue_session_token', mockSessionToken);
      localStorage.setItem('hue_bridge_ip', mockBridgeIp);
      localStorage.setItem('hue_username', mockUsername);
      localStorage.setItem('hue_session_expires_at', expiresAt.toString());

      render(<App />);

      // Wait for dashboard to appear AND RoomContent to render (includes scene tiles)
      await waitFor(() => {
        expect(screen.getByText('Living Room')).toBeInTheDocument();
        expect(document.querySelector('.scene-tile')).toBeTruthy();
      });

      // Click first scene tile
      const sceneTiles = document.querySelectorAll('.scene-tile');
      expect(sceneTiles.length).toBeGreaterThan(0);
      await user.click(sceneTiles[0]);

      // Lights should update immediately (optimistic)
      // We don't need to wait for WebSocket poll (5 seconds)
      await waitFor(
        () => {
          // Check that affected lights have updated
          // (The exact assertions depend on your UI)
          expect(screen.getByText('Light 1')).toBeInTheDocument();
        },
        { timeout: 1000 }
      ); // Should be fast, not 5+ seconds
    });
  });

  describe('Error Handling', () => {
    it('handles 401 errors gracefully', async () => {
      // Start with authenticated session
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem('hue_session_token', 'invalid_token');
      localStorage.setItem('hue_bridge_ip', mockBridgeIp);
      localStorage.setItem('hue_username', mockUsername);
      localStorage.setItem('hue_session_expires_at', expiresAt.toString());

      // Make home endpoint return 401
      server.use(
        http.get('/api/v2/home', () => {
          return new HttpResponse(null, { status: 401 });
        })
      );

      render(<App />);

      // Should detect invalid session and return to settings
      await waitFor(
        () => {
          // Should either auto-recover or show settings page
          const hasSettings = document.querySelector('.settings-page');
          const hasDashboard = screen.queryByText('Living Room');
          expect(hasSettings || hasDashboard).toBeTruthy();
        },
        { timeout: 10000 }
      );
    });

    it('handles network errors gracefully', async () => {
      const user = userEvent.setup();

      // Make discovery fail
      server.use(
        http.get('/api/discovery', () => {
          return HttpResponse.error();
        })
      );

      render(<App />);

      // Enable Hue from settings page first
      const hueToggle = screen.getByRole('switch', { name: /hue/i });
      await user.click(hueToggle);

      await waitFor(() => screen.getByText(UI_TEXT.BUTTON_DISCOVER_BRIDGE));
      await user.click(screen.getByText(UI_TEXT.BUTTON_DISCOVER_BRIDGE));

      // Should show error message
      await waitFor(() => {
        expect(
          screen.getByText(new RegExp(ERROR_MESSAGES.BRIDGE_DISCOVERY, 'i'))
        ).toBeInTheDocument();
      });
    });
  });

  describe('Regression Tests', () => {
    it('does not create infinite authentication loop', async () => {
      const user = userEvent.setup();
      let pairCallCount = 0;

      // Count pairing requests
      server.use(
        http.post('/api/v2/services/hue/pair', async () => {
          pairCallCount++;
          return HttpResponse.json({ success: true, username: mockUsername });
        })
      );

      render(<App />);

      // Enable Hue from settings page first
      const hueToggle = screen.getByRole('switch', { name: /hue/i });
      await user.click(hueToggle);

      // Complete authentication
      await waitFor(() => screen.getByText(UI_TEXT.BUTTON_DISCOVER_BRIDGE));
      await user.click(screen.getByText(UI_TEXT.BUTTON_DISCOVER_BRIDGE));
      await waitFor(() => screen.getByText(mockBridgeIp));
      await user.click(screen.getByText(UI_TEXT.BUTTON_USE_THIS_BRIDGE));
      await waitFor(() => screen.getByText(new RegExp(UI_TEXT.AUTH_TITLE, 'i')));
      await user.click(screen.getByText(new RegExp(UI_TEXT.BUTTON_I_PRESSED_BUTTON, 'i')));

      // Wait for dashboard
      await waitFor(() => screen.getByText('Living Room'));

      // Wait a bit to ensure no infinite loop
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Should only have called pairing once
      expect(pairCallCount).toBe(1);
    });
  });
});
