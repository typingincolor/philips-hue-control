import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// Mock dependencies before importing the router
vi.mock('../../../services/sessionManager.js', () => ({
  default: {
    getBridgeCredentials: vi.fn(),
    hasBridgeCredentials: vi.fn(),
    storeBridgeCredentials: vi.fn(),
    createSession: vi.fn()
  }
}));

vi.mock('../../../services/hueClient.js', () => ({
  default: {
    getLights: vi.fn()
  }
}));

vi.mock('../../../utils/logger.js', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  })
}));

// Import mocked modules
import sessionManager from '../../../services/sessionManager.js';
import hueClient from '../../../services/hueClient.js';

describe('Auth Routes - Connect and Bridge Status', () => {
  let app;
  const bridgeIp = '192.168.1.100';
  const username = 'test-user-abc123';
  const sessionToken = 'hue_sess_test123';

  beforeEach(async () => {
    vi.clearAllMocks();

    // Create fresh Express app for each test
    app = express();
    app.use(express.json());

    // Import and mount auth router
    const authModule = await import('../../../routes/v1/auth.js');
    app.use('/api/v1/auth', authModule.default);

    // Add error handler
    app.use((err, req, res, _next) => {
      res.status(err.status || 500).json({ error: err.message });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/v1/auth/connect', () => {
    it('should connect successfully with stored credentials', async () => {
      sessionManager.getBridgeCredentials.mockReturnValue(username);
      hueClient.getLights.mockResolvedValue({ data: [] });
      sessionManager.createSession.mockReturnValue({
        sessionToken,
        expiresIn: 86400,
        bridgeIp
      });

      const res = await request(app)
        .post('/api/v1/auth/connect')
        .send({ bridgeIp });

      expect(res.status).toBe(200);
      expect(res.body.sessionToken).toBe(sessionToken);
      expect(res.body.bridgeIp).toBe(bridgeIp);
      expect(sessionManager.getBridgeCredentials).toHaveBeenCalledWith(bridgeIp);
      expect(hueClient.getLights).toHaveBeenCalledWith(bridgeIp, username);
      expect(sessionManager.createSession).toHaveBeenCalledWith(bridgeIp, username);
    });

    it('should return 404 when no stored credentials exist', async () => {
      sessionManager.getBridgeCredentials.mockReturnValue(null);

      const res = await request(app)
        .post('/api/v1/auth/connect')
        .send({ bridgeIp });

      expect(res.status).toBe(404);
      expect(res.body.requiresPairing).toBe(true);
      expect(res.body.error).toContain('Pairing required');
    });

    it('should return 401 when stored credentials are invalid', async () => {
      sessionManager.getBridgeCredentials.mockReturnValue(username);
      hueClient.getLights.mockRejectedValue(new Error('Invalid credentials'));

      const res = await request(app)
        .post('/api/v1/auth/connect')
        .send({ bridgeIp });

      expect(res.status).toBe(401);
      expect(res.body.requiresPairing).toBe(true);
      expect(res.body.error).toContain('no longer valid');
    });

    it('should return 400 when bridgeIp is missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/connect')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/auth/bridge-status', () => {
    it('should return hasCredentials: true when credentials exist', async () => {
      sessionManager.hasBridgeCredentials.mockReturnValue(true);

      const res = await request(app)
        .get('/api/v1/auth/bridge-status')
        .query({ bridgeIp });

      expect(res.status).toBe(200);
      expect(res.body.bridgeIp).toBe(bridgeIp);
      expect(res.body.hasCredentials).toBe(true);
      expect(sessionManager.hasBridgeCredentials).toHaveBeenCalledWith(bridgeIp);
    });

    it('should return hasCredentials: false when no credentials exist', async () => {
      sessionManager.hasBridgeCredentials.mockReturnValue(false);

      const res = await request(app)
        .get('/api/v1/auth/bridge-status')
        .query({ bridgeIp });

      expect(res.status).toBe(200);
      expect(res.body.hasCredentials).toBe(false);
    });

    it('should return 400 when bridgeIp is missing', async () => {
      const res = await request(app).get('/api/v1/auth/bridge-status');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('bridgeIp');
    });
  });
});
