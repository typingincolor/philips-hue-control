import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

// Mock logger
vi.mock('../../../utils/logger.js', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

// Mock ServiceRegistry
vi.mock('../../../services/ServiceRegistry.js', () => {
  const mockHuePlugin = {
    constructor: {
      id: 'hue',
      displayName: 'Philips Hue',
      description: 'Control Philips Hue lights',
      authType: 'pairing',
    },
    getMetadata: () => ({
      id: 'hue',
      displayName: 'Philips Hue',
      description: 'Control Philips Hue lights',
      authType: 'pairing',
    }),
    connect: vi.fn(),
    disconnect: vi.fn(),
    isConnected: vi.fn(),
    getConnectionStatus: vi.fn(),
    getStatus: vi.fn(),
    getRouter: vi.fn(() => {
      const router = express.Router();
      router.get('/dashboard', (req, res) => res.json({ rooms: [] }));
      return router;
    }),
  };

  const mockHivePlugin = {
    constructor: {
      id: 'hive',
      displayName: 'Hive Heating',
      description: 'Control Hive heating system',
      authType: '2fa',
    },
    getMetadata: () => ({
      id: 'hive',
      displayName: 'Hive Heating',
      description: 'Control Hive heating system',
      authType: '2fa',
    }),
    connect: vi.fn(),
    disconnect: vi.fn(),
    isConnected: vi.fn(),
    getConnectionStatus: vi.fn(),
    getStatus: vi.fn(),
    getRouter: vi.fn(() => {
      const router = express.Router();
      router.post('/verify-2fa', (req, res) => res.json({ success: true }));
      return router;
    }),
  };

  // Demo mode plugins (same shape but separate instances for testing)
  const mockHueDemoPlugin = {
    constructor: {
      id: 'hue',
      displayName: 'Philips Hue',
      description: 'Control Philips Hue lights (Demo)',
      authType: 'pairing',
    },
    getMetadata: () => ({
      id: 'hue',
      displayName: 'Philips Hue',
      description: 'Control Philips Hue lights (Demo)',
      authType: 'pairing',
    }),
    connect: vi.fn(),
    disconnect: vi.fn(),
    isConnected: vi.fn(() => true),
    getConnectionStatus: vi.fn(() => ({ connected: true })),
    getStatus: vi.fn(),
    getRouter: vi.fn(() => {
      const router = express.Router();
      router.get('/dashboard', (req, res) => res.json({ rooms: [] }));
      return router;
    }),
  };

  return {
    default: {
      getAll: vi.fn(() => [mockHuePlugin, mockHivePlugin]),
      get: vi.fn((id, demoMode = false) => {
        if (demoMode) {
          if (id === 'hue') return mockHueDemoPlugin;
          // For now, return null for hive demo in tests
          return null;
        }
        if (id === 'hue') return mockHuePlugin;
        if (id === 'hive') return mockHivePlugin;
        return null;
      }),
      getIds: vi.fn(() => ['hue', 'hive']),
      has: vi.fn((id) => ['hue', 'hive'].includes(id)),
      getAllMetadata: vi.fn(() => [mockHuePlugin.getMetadata(), mockHivePlugin.getMetadata()]),
    },
  };
});

// Mock auth middleware
vi.mock('../../../middleware/auth.js', () => ({
  requireSession: (req, res, next) => {
    req.hue = { sessionToken: 'test-token', bridgeIp: '192.168.1.100' };
    next();
  },
  extractCredentials: (req, res, next) => {
    req.hue = { bridgeIp: '192.168.1.100', username: 'test-user' };
    next();
  },
}));

// Mock demo mode middleware
vi.mock('../../../middleware/demoMode.js', () => ({
  detectDemoMode: (req, res, next) => {
    req.demoMode = req.headers['x-demo-mode'] === 'true';
    next();
  },
}));

describe('V2 Services Routes', () => {
  let app;
  let ServiceRegistry;

  beforeEach(async () => {
    vi.clearAllMocks();

    const registryMod = await import('../../../services/ServiceRegistry.js');
    ServiceRegistry = registryMod.default;

    // Create fresh Express app for each test
    app = express();
    app.use(express.json());

    // Import and mount routes
    const { default: servicesRouter } = await import('../../../routes/v2/services.js');
    app.use('/api/v2/services', servicesRouter);
  });

  describe('GET /api/v2/services', () => {
    it('should list all available services', async () => {
      const response = await request(app).get('/api/v2/services');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('services');
      expect(response.body.services).toHaveLength(2);
    });

    it('should include service metadata', async () => {
      const response = await request(app).get('/api/v2/services');

      const hue = response.body.services.find((s) => s.id === 'hue');
      expect(hue).toHaveProperty('displayName', 'Philips Hue');
      expect(hue).toHaveProperty('authType', 'pairing');
    });
  });

  describe('GET /api/v2/services/:id', () => {
    it('should return service info and connection status', async () => {
      ServiceRegistry.get('hue').getConnectionStatus.mockReturnValue({
        connected: true,
        bridgeIp: '192.168.1.100',
      });

      const response = await request(app).get('/api/v2/services/hue');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'hue');
      expect(response.body).toHaveProperty('displayName');
      expect(response.body).toHaveProperty('connected', true);
    });

    it('should return 404 for unknown service', async () => {
      const response = await request(app).get('/api/v2/services/unknown');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/v2/services/:id/connect', () => {
    it('should connect to Hue service', async () => {
      ServiceRegistry.get('hue').connect.mockResolvedValue({
        success: true,
        sessionToken: 'new-token',
      });

      const response = await request(app)
        .post('/api/v2/services/hue/connect')
        .send({ bridgeIp: '192.168.1.100' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it('should return 2FA challenge for Hive', async () => {
      ServiceRegistry.get('hive').connect.mockResolvedValue({
        requires2fa: true,
        session: 'cognito-session',
      });

      const response = await request(app)
        .post('/api/v2/services/hive/connect')
        .send({ username: 'user@example.com', password: 'password' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('requires2fa', true);
      expect(response.body).toHaveProperty('session');
    });

    it('should return 401 for invalid credentials', async () => {
      ServiceRegistry.get('hive').connect.mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });

      const response = await request(app)
        .post('/api/v2/services/hive/connect')
        .send({ username: 'bad@example.com', password: 'wrong' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for unknown service', async () => {
      const response = await request(app).post('/api/v2/services/unknown/connect').send({});

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/v2/services/:id/disconnect', () => {
    it('should disconnect from service', async () => {
      ServiceRegistry.get('hue').disconnect.mockResolvedValue();

      const response = await request(app).post('/api/v2/services/hue/disconnect');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(ServiceRegistry.get('hue').disconnect).toHaveBeenCalled();
    });

    it('should return 404 for unknown service', async () => {
      const response = await request(app).post('/api/v2/services/unknown/disconnect');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/v2/services/:id/status', () => {
    it('should return Hue dashboard status', async () => {
      ServiceRegistry.get('hue').isConnected.mockReturnValue(true);
      ServiceRegistry.get('hue').getStatus.mockResolvedValue({
        summary: { lightsOn: 3, totalLights: 5 },
        rooms: [],
      });

      const response = await request(app).get('/api/v2/services/hue/status');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('summary');
    });

    it('should return Hive thermostat status', async () => {
      ServiceRegistry.get('hive').isConnected.mockReturnValue(true);
      ServiceRegistry.get('hive').getStatus.mockResolvedValue({
        heating: { currentTemperature: 20 },
        hotWater: { isOn: true },
      });

      const response = await request(app).get('/api/v2/services/hive/status');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('heating');
      expect(response.body).toHaveProperty('hotWater');
    });

    it('should return 404 for unknown service', async () => {
      const response = await request(app).get('/api/v2/services/unknown/status');

      expect(response.status).toBe(404);
    });

    it('should return 401 when not connected', async () => {
      ServiceRegistry.get('hue').isConnected.mockReturnValue(false);
      ServiceRegistry.get('hue').getStatus.mockRejectedValue(new Error('Not connected'));

      const response = await request(app).get('/api/v2/services/hue/status');

      expect(response.status).toBe(401);
    });
  });

  describe('Service-specific routes', () => {
    it('should mount Hue plugin routes', async () => {
      const response = await request(app).get('/api/v2/services/hue/dashboard');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('rooms');
    });

    it('should mount Hive plugin routes', async () => {
      const response = await request(app)
        .post('/api/v2/services/hive/verify-2fa')
        .send({ code: '123456', session: 'token', username: 'user@test.com' });

      expect(response.status).toBe(200);
    });
  });

  describe('Demo mode', () => {
    it('should use demo plugin when demo mode is enabled', async () => {
      // Get the demo plugin and mock its connect method
      const demoPlugin = ServiceRegistry.get('hue', true);
      demoPlugin.connect.mockResolvedValue({
        success: true,
        demoMode: true,
      });

      const response = await request(app)
        .post('/api/v2/services/hue/connect')
        .set('X-Demo-Mode', 'true')
        .send({ bridgeIp: 'demo-bridge' });

      expect(response.status).toBe(200);
      // Verify demo plugin's connect is called without demoMode parameter
      expect(demoPlugin.connect).toHaveBeenCalledWith(
        expect.objectContaining({ bridgeIp: 'demo-bridge' })
      );
      // Verify ServiceRegistry.get was called with demoMode = true
      expect(ServiceRegistry.get).toHaveBeenCalledWith('hue', true);
    });
  });
});
