import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock logger
vi.mock('../../../utils/logger.js', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

// Mock sessionManager
vi.mock('../../../services/sessionManager.js', () => ({
  default: {
    getBridgeCredentials: vi.fn(),
    hasBridgeCredentials: vi.fn(),
    storeBridgeCredentials: vi.fn(),
    clearBridgeCredentials: vi.fn(),
    createSession: vi.fn(),
    getSession: vi.fn(),
    revokeSession: vi.fn(),
  },
}));

// Mock hueClientFactory
vi.mock('../../../services/hueClientFactory.js', () => ({
  getHueClient: vi.fn(),
  getHueClientForBridge: vi.fn(),
}));

// Mock dashboardService
vi.mock('../../../services/dashboardService.js', () => ({
  default: {
    getDashboard: vi.fn(),
    transformRoomToHomeFormat: vi.fn((room) => ({
      id: room.id,
      name: room.name,
      devices: (room.lights || []).map((light) => ({
        id: `hue:${light.id}`,
        name: light.name,
        type: 'light',
        serviceId: 'hue',
        state: { on: light.on, brightness: light.brightness },
        capabilities: ['on', 'dimming', 'color'],
      })),
      scenes: (room.scenes || []).map((scene) => ({
        id: `hue:${scene.id}`,
        name: scene.name,
        serviceId: 'hue',
      })),
    })),
  },
}));

// Mock mockData
vi.mock('../../../services/mockData.js', () => ({
  DEMO_BRIDGE_IP: 'demo-bridge',
  DEMO_USERNAME: 'demo-user',
}));

describe('HuePlugin', () => {
  let HuePlugin;
  let sessionManager;
  let dashboardService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const sessionMod = await import('../../../services/sessionManager.js');
    sessionManager = sessionMod.default;

    const dashMod = await import('../../../services/dashboardService.js');
    dashboardService = dashMod.default;

    const pluginMod = await import('../../../services/plugins/HuePlugin.js');
    HuePlugin = pluginMod.default;
  });

  describe('static properties', () => {
    it('should have id "hue"', () => {
      expect(HuePlugin.constructor.id).toBe('hue');
    });

    it('should have displayName "Philips Hue"', () => {
      expect(HuePlugin.constructor.displayName).toBe('Philips Hue');
    });

    it('should have authType "pairing"', () => {
      expect(HuePlugin.constructor.authType).toBe('pairing');
    });
  });

  describe('connect', () => {
    it('should connect with stored credentials', async () => {
      sessionManager.hasBridgeCredentials.mockReturnValue(true);
      sessionManager.getBridgeCredentials.mockReturnValue('test-username');
      sessionManager.createSession.mockReturnValue({
        sessionToken: 'test-token',
        expiresIn: 86400,
        bridgeIp: '192.168.1.100',
      });

      const result = await HuePlugin.connect({ bridgeIp: '192.168.1.100' }, false);

      expect(result.success).toBe(true);
      expect(result.sessionToken).toBe('test-token');
    });

    it('should require pairing when no credentials exist', async () => {
      sessionManager.hasBridgeCredentials.mockReturnValue(false);

      const result = await HuePlugin.connect({ bridgeIp: '192.168.1.100' }, false);

      expect(result.requiresPairing).toBe(true);
    });

    it('should return demo session in demo mode', async () => {
      const result = await HuePlugin.connect({ bridgeIp: 'demo-bridge' }, true);

      expect(result.success).toBe(true);
      expect(result.demoMode).toBe(true);
    });

    it('should require bridgeIp in request body', async () => {
      const result = await HuePlugin.connect({}, false);

      expect(result.success).toBe(false);
      expect(result.error).toContain('bridgeIp');
    });
  });

  describe('disconnect', () => {
    it('should clear credentials for bridge', async () => {
      HuePlugin.setBridgeIp('192.168.1.100');

      await HuePlugin.disconnect();

      expect(sessionManager.clearBridgeCredentials).toHaveBeenCalledWith('192.168.1.100');
    });
  });

  describe('isConnected', () => {
    it('should return true when credentials exist for bridge', () => {
      HuePlugin.setBridgeIp('192.168.1.100');
      sessionManager.hasBridgeCredentials.mockReturnValue(true);

      expect(HuePlugin.isConnected(false)).toBe(true);
    });

    it('should return false when no credentials exist', () => {
      HuePlugin.setBridgeIp('192.168.1.100');
      sessionManager.hasBridgeCredentials.mockReturnValue(false);

      expect(HuePlugin.isConnected(false)).toBe(false);
    });

    it('should return true in demo mode', () => {
      expect(HuePlugin.isConnected(true)).toBe(true);
    });
  });

  describe('getConnectionStatus', () => {
    it('should return connection status object', () => {
      HuePlugin.setBridgeIp('192.168.1.100');
      sessionManager.hasBridgeCredentials.mockReturnValue(true);

      const status = HuePlugin.getConnectionStatus(false);

      expect(status).toHaveProperty('connected', true);
      expect(status).toHaveProperty('bridgeIp', '192.168.1.100');
    });
  });

  describe('getStatus', () => {
    it('should return dashboard data', async () => {
      HuePlugin.setBridgeIp('192.168.1.100');
      sessionManager.getBridgeCredentials.mockReturnValue('test-username');
      dashboardService.getDashboard.mockResolvedValue({
        summary: { lightsOn: 3, totalLights: 5 },
        rooms: [],
        zones: [],
      });

      const status = await HuePlugin.getStatus(false);

      expect(status).toHaveProperty('summary');
      expect(dashboardService.getDashboard).toHaveBeenCalledWith('192.168.1.100', 'test-username');
    });

    it('should return demo dashboard in demo mode', async () => {
      dashboardService.getDashboard.mockResolvedValue({
        summary: { lightsOn: 2, totalLights: 4 },
        rooms: [],
        zones: [],
      });

      const status = await HuePlugin.getStatus(true);

      expect(status).toHaveProperty('summary');
      expect(dashboardService.getDashboard).toHaveBeenCalledWith('demo-bridge', 'demo-user');
    });
  });

  describe('hasCredentials', () => {
    it('should delegate to sessionManager', () => {
      HuePlugin.setBridgeIp('192.168.1.100');
      sessionManager.hasBridgeCredentials.mockReturnValue(true);

      expect(HuePlugin.hasCredentials()).toBe(true);
      expect(sessionManager.hasBridgeCredentials).toHaveBeenCalledWith('192.168.1.100');
    });
  });

  describe('clearCredentials', () => {
    it('should delegate to sessionManager', async () => {
      HuePlugin.setBridgeIp('192.168.1.100');

      await HuePlugin.clearCredentials();

      expect(sessionManager.clearBridgeCredentials).toHaveBeenCalledWith('192.168.1.100');
    });
  });

  describe('getDemoCredentials', () => {
    it('should return demo bridge IP and username', () => {
      const creds = HuePlugin.getDemoCredentials();

      expect(creds).toHaveProperty('bridgeIp', 'demo-bridge');
      expect(creds).toHaveProperty('username', 'demo-user');
    });
  });

  describe('getRouter', () => {
    it('should return Express router', () => {
      const router = HuePlugin.getRouter();

      expect(router).toBeDefined();
      expect(typeof router).toBe('function'); // Express router is a function
    });

    it('should have route for /pair', () => {
      const router = HuePlugin.getRouter();
      const routes = router.stack.filter((layer) => layer.route);
      const pairRoute = routes.find((r) => r.route.path === '/pair');

      expect(pairRoute).toBeDefined();
    });

    it('should have route for /dashboard', () => {
      const router = HuePlugin.getRouter();
      const routes = router.stack.filter((layer) => layer.route);
      const dashboardRoute = routes.find((r) => r.route.path === '/dashboard');

      expect(dashboardRoute).toBeDefined();
    });

    it('should have route for /lights/:id', () => {
      const router = HuePlugin.getRouter();
      const routes = router.stack.filter((layer) => layer.route);
      const lightsRoute = routes.find((r) => r.route.path === '/lights/:id');

      expect(lightsRoute).toBeDefined();
    });
  });

  describe('detectChanges', () => {
    it('should detect room changes', () => {
      const previous = {
        rooms: [{ id: 'room-1', name: 'Living Room', stats: { lightsOnCount: 0 } }],
      };
      const current = {
        rooms: [{ id: 'room-1', name: 'Living Room', stats: { lightsOnCount: 2 } }],
      };

      const changes = HuePlugin.detectChanges(previous, current);

      expect(changes).toContainEqual(expect.objectContaining({ type: 'room' }));
    });

    it('should return null when no changes', () => {
      const state = {
        rooms: [{ id: 'room-1', name: 'Living Room' }],
      };

      const changes = HuePlugin.detectChanges(state, state);

      expect(changes).toBeNull();
    });
  });

  describe('pair', () => {
    it('should pair with bridge and store credentials', async () => {
      const { getHueClient } = await import('../../../services/hueClientFactory.js');
      getHueClient.mockReturnValue({
        createUser: vi.fn().mockResolvedValue('new-username'),
      });

      const result = await HuePlugin.pair({ bridgeIp: '192.168.1.100' });

      expect(result.success).toBe(true);
      expect(result.username).toBe('new-username');
      expect(sessionManager.storeBridgeCredentials).toHaveBeenCalledWith(
        '192.168.1.100',
        'new-username'
      );
    });
  });

  describe('getRooms (Home abstraction)', () => {
    it('should return rooms with normalized devices', async () => {
      HuePlugin.setBridgeIp('192.168.1.100');
      sessionManager.getBridgeCredentials.mockReturnValue('test-username');
      dashboardService.getDashboard.mockResolvedValue({
        summary: {},
        rooms: [
          {
            id: 'room-1',
            name: 'Living Room',
            lights: [
              {
                id: 'light-1',
                name: 'Floor Lamp',
                on: true,
                brightness: 80,
                color: '#ff8800',
              },
            ],
            scenes: [{ id: 'scene-1', name: 'Bright' }],
          },
        ],
        zones: [],
      });

      const rooms = await HuePlugin.getRooms(false);

      expect(rooms).toHaveLength(1);
      expect(rooms[0].id).toBe('room-1');
      expect(rooms[0].name).toBe('Living Room');
      expect(rooms[0].devices).toHaveLength(1);
      expect(rooms[0].devices[0].id).toBe('hue:light-1');
      expect(rooms[0].devices[0].type).toBe('light');
      expect(rooms[0].devices[0].serviceId).toBe('hue');
    });

    it('should include scenes in room response', async () => {
      HuePlugin.setBridgeIp('192.168.1.100');
      sessionManager.getBridgeCredentials.mockReturnValue('test-username');
      dashboardService.getDashboard.mockResolvedValue({
        summary: {},
        rooms: [
          {
            id: 'room-1',
            name: 'Living Room',
            lights: [],
            scenes: [
              { id: 'scene-1', name: 'Bright' },
              { id: 'scene-2', name: 'Relax' },
            ],
          },
        ],
        zones: [],
      });

      const rooms = await HuePlugin.getRooms(false);

      expect(rooms[0].scenes).toHaveLength(2);
      expect(rooms[0].scenes[0].id).toBe('hue:scene-1');
      expect(rooms[0].scenes[0].serviceId).toBe('hue');
    });
  });

  describe('getDevices (Home abstraction)', () => {
    it('should return empty array (Hue has no home-level devices)', async () => {
      const devices = await HuePlugin.getDevices(false);

      expect(devices).toEqual([]);
    });
  });

  describe('updateDevice', () => {
    it('should update light state via Hue API', async () => {
      const { getHueClientForBridge } = await import('../../../services/hueClientFactory.js');
      const mockClient = {
        updateLight: vi.fn().mockResolvedValue({ success: true }),
      };
      getHueClientForBridge.mockReturnValue(mockClient);
      HuePlugin.setBridgeIp('192.168.1.100');
      sessionManager.getBridgeCredentials.mockReturnValue('test-username');

      const result = await HuePlugin.updateDevice('light-1', { on: false, brightness: 50 });

      // State should be converted to V2 format
      expect(mockClient.updateLight).toHaveBeenCalledWith(
        '192.168.1.100',
        'test-username',
        'light-1',
        { on: { on: false }, dimming: { brightness: 50 } }
      );
      expect(result.success).toBe(true);
    });
  });

  describe('activateScene', () => {
    it('should activate scene via Hue API', async () => {
      const { getHueClientForBridge } = await import('../../../services/hueClientFactory.js');
      const mockClient = {
        activateScene: vi.fn().mockResolvedValue({ success: true, lightsAffected: 3 }),
      };
      getHueClientForBridge.mockReturnValue(mockClient);
      HuePlugin.setBridgeIp('192.168.1.100');
      sessionManager.getBridgeCredentials.mockReturnValue('test-username');

      const result = await HuePlugin.activateScene('scene-1');

      expect(mockClient.activateScene).toHaveBeenCalledWith(
        '192.168.1.100',
        'test-username',
        'scene-1'
      );
      expect(result.success).toBe(true);
    });
  });
});
