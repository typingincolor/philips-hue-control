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

// Mock homeService
const mockHome = {
  rooms: [
    {
      id: 'home-room-1',
      name: 'Living Room',
      devices: [
        {
          id: 'hue:light-1',
          name: 'Floor Lamp',
          type: 'light',
          serviceId: 'hue',
          state: { on: true, brightness: 80 },
        },
      ],
      scenes: [{ id: 'hue:scene-1', name: 'Bright' }],
      stats: { totalDevices: 1, lightsOn: 1, averageBrightness: 80 },
    },
  ],
  devices: [
    {
      id: 'hive:heating',
      name: 'Central Heating',
      type: 'thermostat',
      serviceId: 'hive',
      state: { currentTemperature: 19.5, targetTemperature: 21, isHeating: true },
    },
  ],
  zones: [],
  summary: {
    totalLights: 1,
    lightsOn: 1,
    roomCount: 1,
    sceneCount: 1,
    homeDeviceCount: 1,
  },
};

vi.mock('../../../services/homeService.js', () => ({
  default: {
    getHome: vi.fn(() => Promise.resolve(mockHome)),
    getRoom: vi.fn((roomId) => {
      if (roomId === 'home-room-1') {
        return Promise.resolve(mockHome.rooms[0]);
      }
      return Promise.resolve(null);
    }),
    updateDevice: vi.fn(() => Promise.resolve({ success: true })),
    activateScene: vi.fn(() => Promise.resolve({ success: true, lightsAffected: 3 })),
  },
}));

// Mock auth middleware - handles both auth and demo mode
vi.mock('../../../middleware/auth.js', () => ({
  requireSession: (req, res, next) => {
    // Check demo mode header
    req.demoMode = req.headers['x-demo-mode'] === 'true';
    req.hue = { sessionToken: 'test-token', bridgeIp: '192.168.1.100' };
    next();
  },
}));

import homeRoutes from '../../../routes/v2/home.js';
import homeService from '../../../services/homeService.js';

describe('V2 Home Routes', () => {
  let app;

  beforeEach(() => {
    vi.clearAllMocks();

    app = express();
    app.use(express.json());
    app.use('/api/v2/home', homeRoutes);
  });

  describe('GET /api/v2/home', () => {
    it('should return the full home structure', async () => {
      const response = await request(app).get('/api/v2/home');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('rooms');
      expect(response.body).toHaveProperty('devices');
      expect(response.body).toHaveProperty('summary');
      expect(response.body.rooms).toHaveLength(1);
      expect(response.body.devices).toHaveLength(1);
    });

    it('should pass demo mode to service', async () => {
      await request(app).get('/api/v2/home').set('X-Demo-Mode', 'true');

      expect(homeService.getHome).toHaveBeenCalledWith(true);
    });

    it('should include room stats', async () => {
      const response = await request(app).get('/api/v2/home');

      expect(response.body.rooms[0].stats).toHaveProperty('totalDevices');
      expect(response.body.rooms[0].stats).toHaveProperty('lightsOn');
    });

    it('should include home-level devices', async () => {
      const response = await request(app).get('/api/v2/home');

      expect(response.body.devices[0].type).toBe('thermostat');
      expect(response.body.devices[0].serviceId).toBe('hive');
    });
  });

  describe('GET /api/v2/home/rooms/:id', () => {
    it('should return a single room by ID', async () => {
      const response = await request(app).get('/api/v2/home/rooms/home-room-1');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('home-room-1');
      expect(response.body.name).toBe('Living Room');
    });

    it('should return 404 for unknown room', async () => {
      const response = await request(app).get('/api/v2/home/rooms/unknown');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Room not found');
    });
  });

  describe('PUT /api/v2/home/devices/:id', () => {
    it('should update a device state', async () => {
      const response = await request(app)
        .put('/api/v2/home/devices/hue:light-1')
        .send({ on: false });

      expect(response.status).toBe(200);
      expect(homeService.updateDevice).toHaveBeenCalledWith('hue:light-1', { on: false }, false);
    });

    it('should update thermostat temperature', async () => {
      const response = await request(app)
        .put('/api/v2/home/devices/hive:heating')
        .send({ targetTemperature: 22 });

      expect(response.status).toBe(200);
      expect(homeService.updateDevice).toHaveBeenCalledWith(
        'hive:heating',
        { targetTemperature: 22 },
        false
      );
    });

    it('should handle service errors', async () => {
      homeService.updateDevice.mockRejectedValueOnce(new Error('Device not found'));

      const response = await request(app)
        .put('/api/v2/home/devices/unknown:device')
        .send({ on: true });

      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/v2/home/scenes/:id/activate', () => {
    it('should activate a scene', async () => {
      const response = await request(app).post('/api/v2/home/scenes/hue:scene-1/activate');

      expect(response.status).toBe(200);
      expect(homeService.activateScene).toHaveBeenCalledWith('hue:scene-1', false);
      expect(response.body.success).toBe(true);
      expect(response.body.lightsAffected).toBe(3);
    });
  });

  describe('GET /api/v2/home/devices', () => {
    it('should return all home-level devices', async () => {
      const response = await request(app).get('/api/v2/home/devices');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].type).toBe('thermostat');
    });
  });
});
