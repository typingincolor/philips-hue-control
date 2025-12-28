/**
 * Tests for V2 Automations API routes
 * These tests verify the V2 automations endpoints that replace V1 automations functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import automationsRouter from '../../../routes/v2/automations.js';
import automationService from '../../../services/automationService.js';

// Mock services (default export)
vi.mock('../../../services/automationService.js', () => ({
  default: {
    getAutomations: vi.fn(),
    triggerAutomation: vi.fn(),
  },
}));

// Mock auth middleware (extractCredentials is used by automations)
vi.mock('../../../middleware/auth.js', () => ({
  extractCredentials: (req, res, next) => {
    if (req.headers.authorization) {
      req.hue = {
        bridgeIp: '192.168.1.100',
        username: 'test-user',
        authMethod: 'session',
      };
      next();
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  },
}));

describe('V2 Automations Routes', () => {
  let app;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/v2/automations', automationsRouter);
  });

  describe('GET /api/v2/automations', () => {
    it('should return list of automations', async () => {
      const mockAutomations = [
        {
          id: 'auto-1',
          name: 'Movie Time',
          description: 'Dim lights for movie watching',
          scenes: [{ id: 'scene-1', name: 'Movie Scene' }],
        },
        {
          id: 'auto-2',
          name: 'Goodnight',
          description: 'Turn off all lights',
          scenes: [{ id: 'scene-2', name: 'Off' }],
        },
      ];
      automationService.getAutomations.mockResolvedValue(mockAutomations);

      const response = await request(app)
        .get('/api/v2/automations')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockAutomations);
    });

    it('should return empty array when no automations', async () => {
      automationService.getAutomations.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v2/automations')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return 401 without auth', async () => {
      const response = await request(app).get('/api/v2/automations');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v2/automations/:id/trigger', () => {
    it('should trigger automation', async () => {
      automationService.triggerAutomation.mockResolvedValue({
        success: true,
        affectedLights: 5,
      });

      const response = await request(app)
        .post('/api/v2/automations/auto-1/trigger')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(automationService.triggerAutomation).toHaveBeenCalledWith(
        '192.168.1.100',
        'test-user',
        'auto-1'
      );
    });

    it('should return 404 for non-existent automation', async () => {
      automationService.triggerAutomation.mockRejectedValue(new Error('Automation not found'));

      const response = await request(app)
        .post('/api/v2/automations/non-existent/trigger')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
    });
  });
});
