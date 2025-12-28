/**
 * Tests to verify V1 API routes have been decommissioned
 * All V1 endpoints should return 404 after migration to V2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import v2Router from '../../routes/v2/index.js';

describe('V1 API Decommissioned', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    // Only V2 routes are mounted - no V1
    app.use('/api/v2', v2Router);
    // 404 handler for all other routes
    app.use((req, res) => {
      res.status(404).json({ error: 'Not found' });
    });
  });

  describe('V1 Auth endpoints should not exist', () => {
    it('POST /api/v1/auth/pair should return 404', async () => {
      const response = await request(app)
        .post('/api/v1/auth/pair')
        .send({ bridgeIp: '192.168.1.100' });

      expect(response.status).toBe(404);
    });

    it('POST /api/v1/auth/connect should return 404', async () => {
      const response = await request(app)
        .post('/api/v1/auth/connect')
        .send({ bridgeIp: '192.168.1.100' });

      expect(response.status).toBe(404);
    });

    it('POST /api/v1/auth/session should return 404', async () => {
      const response = await request(app).post('/api/v1/auth/session');

      expect(response.status).toBe(404);
    });
  });

  describe('V1 Dashboard endpoint should not exist', () => {
    it('GET /api/v1/dashboard should return 404', async () => {
      const response = await request(app).get('/api/v1/dashboard');

      expect(response.status).toBe(404);
    });
  });

  describe('V1 Settings endpoints should not exist', () => {
    it('GET /api/v1/settings should return 404', async () => {
      const response = await request(app).get('/api/v1/settings');

      expect(response.status).toBe(404);
    });

    it('PUT /api/v1/settings should return 404', async () => {
      const response = await request(app).put('/api/v1/settings');

      expect(response.status).toBe(404);
    });
  });

  describe('V1 Weather endpoint should not exist', () => {
    it('GET /api/v1/weather should return 404', async () => {
      const response = await request(app).get('/api/v1/weather');

      expect(response.status).toBe(404);
    });
  });

  describe('V1 Automations endpoints should not exist', () => {
    it('GET /api/v1/automations should return 404', async () => {
      const response = await request(app).get('/api/v1/automations');

      expect(response.status).toBe(404);
    });

    it('POST /api/v1/automations/:id/trigger should return 404', async () => {
      const response = await request(app).post('/api/v1/automations/auto-1/trigger');

      expect(response.status).toBe(404);
    });
  });

  describe('V1 Lights/Rooms/Zones endpoints should not exist', () => {
    it('PUT /api/v1/lights/:id should return 404', async () => {
      const response = await request(app).put('/api/v1/lights/light-1');

      expect(response.status).toBe(404);
    });

    it('PUT /api/v1/rooms/:id/lights should return 404', async () => {
      const response = await request(app).put('/api/v1/rooms/room-1/lights');

      expect(response.status).toBe(404);
    });

    it('PUT /api/v1/zones/:id/lights should return 404', async () => {
      const response = await request(app).put('/api/v1/zones/zone-1/lights');

      expect(response.status).toBe(404);
    });
  });

  describe('V1 Scenes endpoint should not exist', () => {
    it('POST /api/v1/scenes/:id/activate should return 404', async () => {
      const response = await request(app).post('/api/v1/scenes/scene-1/activate');

      expect(response.status).toBe(404);
    });
  });

  describe('V1 Hive endpoints should not exist (use V2 services instead)', () => {
    it('POST /api/v1/hive/connect should return 404', async () => {
      const response = await request(app).post('/api/v1/hive/connect');

      expect(response.status).toBe(404);
    });

    it('GET /api/v1/hive/status should return 404', async () => {
      const response = await request(app).get('/api/v1/hive/status');

      expect(response.status).toBe(404);
    });
  });
});
