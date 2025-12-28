/**
 * Tests for V2 Weather API routes
 * These tests verify the V2 weather endpoints that replace V1 weather functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import weatherRouter from '../../../routes/v2/weather.js';
import weatherService from '../../../services/weatherService.js';
import settingsService from '../../../services/settingsService.js';

// Mock services
vi.mock('../../../services/weatherService.js', () => ({
  default: {
    getWeather: vi.fn(),
  },
}));

vi.mock('../../../services/settingsService.js', () => ({
  default: {
    getSettings: vi.fn(),
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
}));

describe('V2 Weather Routes', () => {
  let app;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/v2/weather', weatherRouter);
  });

  describe('GET /api/v2/weather', () => {
    it('should return weather data for configured location', async () => {
      const mockSettings = {
        location: { lat: 51.5074, lon: -0.1278, name: 'London' },
        units: 'celsius',
      };
      const mockWeather = {
        temperature: 15,
        condition: 'cloudy',
        icon: 'cloud',
        humidity: 75,
        windSpeed: 12,
        location: 'London',
      };

      settingsService.getSettings.mockReturnValue(mockSettings);
      weatherService.getWeather.mockResolvedValue(mockWeather);

      const response = await request(app)
        .get('/api/v2/weather')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockWeather);
    });

    it('should return 404 if no location configured', async () => {
      settingsService.getSettings.mockReturnValue({ location: null });

      const response = await request(app)
        .get('/api/v2/weather')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('location');
    });

    it('should return 401 without auth', async () => {
      const response = await request(app).get('/api/v2/weather');

      expect(response.status).toBe(401);
    });

    it('should handle weather service errors', async () => {
      settingsService.getSettings.mockReturnValue({
        location: { lat: 51.5074, lon: -0.1278, name: 'London' },
        units: 'celsius',
      });
      weatherService.getWeather.mockRejectedValue(new Error('API unavailable'));

      const response = await request(app)
        .get('/api/v2/weather')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(503);
    });
  });
});
