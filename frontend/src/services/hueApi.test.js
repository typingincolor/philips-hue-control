import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { hueApi } from './hueApi';

// Mock global fetch
global.fetch = vi.fn();

describe('hueApi', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createUser', () => {
    it('should send POST request with correct headers and body', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ username: 'test-user-123' })
      });

      const result = await hueApi.createUser('192.168.1.100', 'test-app');

      // Verify fetch was called correctly
      expect(fetch).toHaveBeenCalledWith(
        '/api/v1/auth/pair',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            bridgeIp: '192.168.1.100',
            appName: 'test-app'
          })
        })
      );

      // Verify result
      expect(result).toBe('test-user-123');
    });

    it('should use default appName if not provided', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ username: 'test-user' })
      });

      await hueApi.createUser('192.168.1.100');

      const callArgs = fetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);

      expect(body.appName).toBe('hue_control_app');
    });

    it('should throw error on HTTP failure', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 500
      });

      await expect(hueApi.createUser('192.168.1.100')).rejects.toThrow('HTTP error! status: 500');
    });
  });

  describe('createSession', () => {
    it('should send POST request with correct headers and body', async () => {
      const mockSession = {
        sessionToken: 'hue_sess_abc123',
        expiresIn: 86400,
        bridgeIp: '192.168.1.100'
      };

      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSession)
      });

      const result = await hueApi.createSession('192.168.1.100', 'test-user');

      expect(fetch).toHaveBeenCalledWith(
        '/api/v1/auth/session',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            bridgeIp: '192.168.1.100',
            username: 'test-user'
          })
        })
      );

      expect(result).toEqual(mockSession);
    });

    it('should throw error if response not ok', async () => {
      fetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: 'Invalid credentials' })
      });

      await expect(hueApi.createSession('192.168.1.100', 'bad-user')).rejects.toThrow();
    });
  });

  describe('getDashboard', () => {
    it('should send GET request with Authorization header', async () => {
      const mockDashboard = {
        summary: { totalLights: 10, lightsOn: 5 },
        rooms: []
      };

      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockDashboard)
      });

      const result = await hueApi.getDashboard('hue_sess_test123');

      expect(fetch).toHaveBeenCalledWith(
        '/api/v1/dashboard',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer hue_sess_test123'
          })
        })
      );

      expect(result).toEqual(mockDashboard);
    });

    it('should handle 401 Unauthorized as session expiration', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 401
      });

      await expect(hueApi.getDashboard('expired-token')).rejects.toThrow(
        'Session expired. Please log in again.'
      );
    });
  });

  describe('getMotionZones', () => {
    it('should send GET request with Authorization header', async () => {
      const mockZones = { zones: [] };

      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockZones)
      });

      const result = await hueApi.getMotionZones('hue_sess_test123');

      expect(fetch).toHaveBeenCalledWith(
        '/api/v1/motion-zones',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer hue_sess_test123'
          })
        })
      );

      expect(result).toEqual(mockZones);
    });
  });

  describe('updateLight', () => {
    it('should send PUT request with correct headers and body', async () => {
      const mockResponse = {
        light: { id: 'light-1', on: true, brightness: 80 }
      };

      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await hueApi.updateLight('hue_sess_test123', 'light-1', {
        on: true,
        brightness: 80
      });

      expect(fetch).toHaveBeenCalledWith(
        '/api/v1/lights/light-1',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer hue_sess_test123'
          }),
          body: JSON.stringify({ on: true, brightness: 80 })
        })
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateRoomLights', () => {
    it('should send PUT request with correct parameters', async () => {
      const mockResponse = {
        updatedLights: [
          { id: 'light-1', on: true },
          { id: 'light-2', on: true }
        ]
      };

      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await hueApi.updateRoomLights('hue_sess_test123', 'room-1', { on: true });

      expect(fetch).toHaveBeenCalledWith(
        '/api/v1/rooms/room-1/lights',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer hue_sess_test123'
          }),
          body: JSON.stringify({ on: true })
        })
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('activateSceneV1', () => {
    it('should send POST request with Authorization header', async () => {
      const mockResponse = {
        affectedLights: [{ id: 'light-1', on: true }]
      };

      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await hueApi.activateSceneV1('hue_sess_test123', 'scene-1');

      expect(fetch).toHaveBeenCalledWith(
        '/api/v1/scenes/scene-1/activate',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer hue_sess_test123'
          })
        })
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('refreshSession', () => {
    it('should send POST request with Authorization header', async () => {
      const mockNewSession = {
        sessionToken: 'hue_sess_new456',
        expiresIn: 86400,
        bridgeIp: '192.168.1.100'
      };

      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockNewSession)
      });

      const result = await hueApi.refreshSession('hue_sess_old123');

      expect(fetch).toHaveBeenCalledWith(
        '/api/v1/auth/refresh',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer hue_sess_old123'
          })
        })
      );

      expect(result).toEqual(mockNewSession);
    });
  });

  describe('revokeSession', () => {
    it('should send DELETE request with Authorization header', async () => {
      const mockResponse = {
        success: true,
        message: 'Session revoked'
      };

      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await hueApi.revokeSession('hue_sess_test123');

      expect(fetch).toHaveBeenCalledWith(
        '/api/v1/auth/session',
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            Authorization: 'Bearer hue_sess_test123'
          })
        })
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      fetch.mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(hueApi.getDashboard('test-token')).rejects.toThrow(
        'Could not connect to proxy server'
      );
    });

    it('should handle V2 API errors in response', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            errors: [{ description: 'Invalid parameter' }],
            data: []
          })
      });

      await expect(hueApi.getDashboard('test-token')).rejects.toThrow('Invalid parameter');
    });
  });

  describe('connect', () => {
    it('should connect successfully with stored credentials', async () => {
      const mockSession = {
        sessionToken: 'hue_sess_abc123',
        expiresIn: 86400,
        bridgeIp: '192.168.1.100'
      };

      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSession)
      });

      const result = await hueApi.connect('192.168.1.100');

      expect(fetch).toHaveBeenCalledWith(
        '/api/v1/auth/connect',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({ bridgeIp: '192.168.1.100' })
        })
      );

      expect(result).toEqual(mockSession);
    });

    it('should throw PAIRING_REQUIRED when no stored credentials', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () =>
          Promise.resolve({
            error: 'No stored credentials',
            requiresPairing: true
          })
      });

      await expect(hueApi.connect('192.168.1.100')).rejects.toThrow('PAIRING_REQUIRED');
    });

    it('should throw error when credentials are invalid', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () =>
          Promise.resolve({
            error: 'Stored credentials are no longer valid',
            requiresPairing: true
          })
      });

      await expect(hueApi.connect('192.168.1.100')).rejects.toThrow('PAIRING_REQUIRED');
    });
  });

  describe('checkBridgeStatus', () => {
    it('should return true when credentials exist', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            bridgeIp: '192.168.1.100',
            hasCredentials: true
          })
      });

      const result = await hueApi.checkBridgeStatus('192.168.1.100');

      expect(fetch).toHaveBeenCalledWith(
        '/api/v1/auth/bridge-status?bridgeIp=192.168.1.100'
      );

      expect(result).toBe(true);
    });

    it('should return false when no credentials exist', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            bridgeIp: '192.168.1.100',
            hasCredentials: false
          })
      });

      const result = await hueApi.checkBridgeStatus('192.168.1.100');

      expect(result).toBe(false);
    });

    it('should return false on network error', async () => {
      fetch.mockRejectedValue(new Error('Network error'));

      const result = await hueApi.checkBridgeStatus('192.168.1.100');

      expect(result).toBe(false);
    });

    it('should URL-encode the bridgeIp parameter', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ hasCredentials: false })
      });

      await hueApi.checkBridgeStatus('192.168.1.100');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('bridgeIp=192.168.1.100')
      );
    });
  });
});
