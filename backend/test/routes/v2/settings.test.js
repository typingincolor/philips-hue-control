/**
 * Tests for V2 Settings API routes
 * These tests verify the V2 settings endpoints that replace V1 settings functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import settingsRouter from '../../../routes/v2/settings.js';
import settingsService from '../../../services/settingsService.js';

// Mock services
vi.mock('../../../services/settingsService.js', () => ({
  default: {
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
    updateLocation: vi.fn(),
    clearLocation: vi.fn(),
  },
}));

// Mock auth middleware
vi.mock('../../../middleware/auth.js', () => ({
  requireSession: (req, res, next) => {
    if (req.headers.authorization) {
      req.hue = {
        bridgeIp: '192.168.1.100',
        sessionToken: 'valid-token',
        username: 'test-user',
      };
      next();
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  },
  optionalSession: (req, res, next) => {
    if (req.headers.authorization) {
      req.hue = {
        bridgeIp: '192.168.1.100',
        sessionToken: 'valid-token',
        username: 'test-user',
      };
    } else {
      req.hue = null;
    }
    next();
  },
}));

describe('V2 Settings Routes', () => {
  let app;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/v2/settings', settingsRouter);
  });

  describe('GET /api/v2/settings', () => {
    it('should return current settings', async () => {
      const mockSettings = {
        location: { lat: 51.5074, lon: -0.1278, name: 'London' },
        units: 'celsius',
        services: { hue: { enabled: true }, hive: { enabled: false } },
      };
      settingsService.getSettings.mockReturnValue(mockSettings);

      const response = await request(app)
        .get('/api/v2/settings')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockSettings);
    });

    it('should return settings without auth (for initial setup)', async () => {
      const mockSettings = {
        location: null,
        units: 'celsius',
        services: { hue: { enabled: false }, hive: { enabled: false } },
      };
      settingsService.getSettings.mockReturnValue(mockSettings);

      const response = await request(app).get('/api/v2/settings');

      expect(response.status).toBe(200);
      expect(settingsService.getSettings).toHaveBeenCalledWith(null, false);
    });
  });

  describe('PUT /api/v2/settings', () => {
    it('should update settings', async () => {
      const newSettings = { units: 'fahrenheit' };
      const updatedSettings = {
        location: { lat: 51.5074, lon: -0.1278, name: 'London' },
        units: 'fahrenheit',
        services: { hue: { enabled: true }, hive: { enabled: false } },
      };
      settingsService.updateSettings.mockReturnValue(updatedSettings);

      const response = await request(app)
        .put('/api/v2/settings')
        .set('Authorization', 'Bearer valid-token')
        .send(newSettings);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedSettings);
      expect(settingsService.updateSettings).toHaveBeenCalledWith('valid-token', newSettings);
    });
  });

  describe('PUT /api/v2/settings/location', () => {
    it('should update location', async () => {
      const location = { lat: 40.7128, lon: -74.006, name: 'New York' };
      settingsService.updateLocation.mockReturnValue({ ...location });

      const response = await request(app)
        .put('/api/v2/settings/location')
        .set('Authorization', 'Bearer valid-token')
        .send(location);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(location);
      expect(settingsService.updateLocation).toHaveBeenCalledWith('valid-token', location);
    });

    it('should return 400 for invalid location', async () => {
      const response = await request(app)
        .put('/api/v2/settings/location')
        .set('Authorization', 'Bearer valid-token')
        .send({ invalid: 'data' });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/v2/settings/location', () => {
    it('should clear location', async () => {
      settingsService.clearLocation.mockReturnValue(true);

      const response = await request(app)
        .delete('/api/v2/settings/location')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(settingsService.clearLocation).toHaveBeenCalled();
    });
  });
});
