/**
 * Tests for V2 Auth Refactoring
 *
 * Goal: Move Hue-specific auth routes from generic /api/v2/auth to plugin routes
 * - /api/v2/auth/pair should NOT exist (Hue-specific)
 * - /api/v2/auth/connect should NOT exist (Hue-specific - use /api/v2/services/hue/connect)
 * - /api/v2/services/hue/pair should work
 * - /api/v2/services/hue/connect should work
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import v2Router from '../../routes/v2/index.js';
import sessionManager from '../../services/sessionManager.js';

// Mock axios to prevent real network calls
vi.mock('axios', () => ({
  default: {
    post: vi.fn().mockResolvedValue({
      data: [{ success: { username: 'test-username' } }],
    }),
  },
}));

// Mock dependencies
vi.mock('../../services/sessionManager.js', () => ({
  default: {
    hasBridgeCredentials: vi.fn(),
    getBridgeCredentials: vi.fn(),
    createSession: vi.fn(),
    storeBridgeCredentials: vi.fn(),
    clearBridgeCredentials: vi.fn(),
    getDefaultBridgeIp: vi.fn(),
  },
}));

vi.mock('../../services/hueClientFactory.js', () => ({
  getHueClient: vi.fn(() => ({
    getLights: vi.fn().mockResolvedValue({ data: [] }),
    createUser: vi.fn().mockResolvedValue('test-username'),
  })),
  getHueClientForBridge: vi.fn(() => ({
    getLights: vi.fn().mockResolvedValue({ data: [] }),
  })),
}));

describe('V2 Auth Refactoring', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v2', v2Router);
    // 404 handler
    app.use((req, res) => {
      res.status(404).json({ error: 'Not found' });
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Hue-specific routes should be removed from /api/v2/auth', () => {
    it('POST /api/v2/auth/pair should return 404 (Hue-specific, use /api/v2/services/hue/pair)', async () => {
      const response = await request(app)
        .post('/api/v2/auth/pair')
        .send({ bridgeIp: '192.168.1.100' });

      expect(response.status).toBe(404);
    });

    it('POST /api/v2/auth/connect should return 404 (Hue-specific, use /api/v2/services/hue/connect)', async () => {
      const response = await request(app)
        .post('/api/v2/auth/connect')
        .send({ bridgeIp: '192.168.1.100' });

      expect(response.status).toBe(404);
    });
  });

  describe('Generic auth routes should still exist', () => {
    it('GET /api/v2/auth/bridge-status should work', async () => {
      sessionManager.hasBridgeCredentials.mockReturnValue(true);

      const response = await request(app)
        .get('/api/v2/auth/bridge-status')
        .query({ bridgeIp: '192.168.1.100' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('hasCredentials');
    });

    it('POST /api/v2/auth/session should work (creates session with provided credentials)', async () => {
      sessionManager.createSession.mockReturnValue({
        sessionToken: 'test-token',
        expiresIn: 3600,
        bridgeIp: '192.168.1.100',
      });

      const response = await request(app)
        .post('/api/v2/auth/session')
        .send({ bridgeIp: '192.168.1.100', username: 'test-username' });

      expect(response.status).toBe(200);
    });
  });

  describe('Hue plugin routes should handle pairing and connection', () => {
    it('POST /api/v2/services/hue/pair should work', async () => {
      const response = await request(app)
        .post('/api/v2/services/hue/pair')
        .send({ bridgeIp: '192.168.1.100' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it('POST /api/v2/services/hue/connect should work', async () => {
      sessionManager.hasBridgeCredentials.mockReturnValue(true);
      sessionManager.getBridgeCredentials.mockReturnValue('stored-username');
      sessionManager.createSession.mockReturnValue({
        sessionToken: 'test-session',
        expiresIn: 3600,
        bridgeIp: '192.168.1.100',
      });

      const response = await request(app)
        .post('/api/v2/services/hue/connect')
        .send({ bridgeIp: '192.168.1.100' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });
});
