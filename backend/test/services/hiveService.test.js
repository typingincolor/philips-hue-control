import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock logger
vi.mock('../../utils/logger.js', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

// Mock credentials manager
vi.mock('../../services/hiveCredentialsManager.js', () => ({
  default: {
    hasCredentials: vi.fn(() => false),
    getCredentials: vi.fn(() => null),
    getSessionToken: vi.fn(() => null),
    getRefreshToken: vi.fn(() => null),
    setSessionToken: vi.fn(),
    setUsername: vi.fn(),
    clearSessionToken: vi.fn(),
    clearCredentials: vi.fn(),
    getDeviceCredentials: vi.fn(() => null),
    setDeviceCredentials: vi.fn(),
    clearDeviceCredentials: vi.fn(),
  },
  HIVE_DEMO_CREDENTIALS: {
    username: 'demo@hive.com',
    password: 'demo',
    code: '123456',
  },
}));

// Track whether device creds should be returned (set in individual tests)
let mockDeviceCredentials = null;

// Mock hiveAuthService with synchronous factory
vi.mock('../../services/hiveAuthService.js', () => ({
  default: {
    initiateAuth: vi.fn((username, password, demoMode) => {
      // Demo mode is handled in hiveService directly
      if (demoMode) {
        return Promise.resolve({ requires2fa: true, session: 'demo-session' });
      }

      // Check if device credentials exist (uses module-level variable)
      if (mockDeviceCredentials?.deviceKey) {
        return Promise.resolve({ accessToken: 'device-token', refreshToken: 'refresh' });
      }

      // No device credentials - require 2FA
      return Promise.resolve({ requires2fa: true, session: `session-${Date.now()}` });
    }),
    verify2fa: vi.fn((code) => {
      if (code === '123456') {
        return Promise.resolve({ success: true, accessToken: 'access-token' });
      }
      return Promise.resolve({ error: 'Invalid verification code' });
    }),
    deviceLogin: vi.fn(() =>
      Promise.resolve({ accessToken: 'device-token', refreshToken: 'refresh-token' })
    ),
  },
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('HiveService', () => {
  let HiveService;
  let hiveCredentialsManager;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset device credentials mock state
    mockDeviceCredentials = null;

    // Import modules (first import - cached thereafter)
    const credsMod = await import('../../services/hiveCredentialsManager.js');
    hiveCredentialsManager = credsMod.default;

    const serviceMod = await import('../../services/hiveService.js');
    HiveService = serviceMod.default;

    // Reset demo connection state for each test
    HiveService._demoConnected = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isConnected', () => {
    it('should return false when no credentials are stored', () => {
      hiveCredentialsManager.hasCredentials.mockReturnValue(false);

      expect(HiveService.isConnected()).toBe(false);
    });

    it('should return true when credentials exist and session is valid', () => {
      hiveCredentialsManager.hasCredentials.mockReturnValue(true);
      hiveCredentialsManager.getSessionToken.mockReturnValue('valid_token');

      expect(HiveService.isConnected()).toBe(true);
    });

    it('should return false when credentials exist but no valid session', () => {
      hiveCredentialsManager.hasCredentials.mockReturnValue(true);
      hiveCredentialsManager.getSessionToken.mockReturnValue(null);

      expect(HiveService.isConnected()).toBe(false);
    });
  });

  describe('connect', () => {
    it('should require 2FA for non-demo mode authentication', async () => {
      // Non-demo mode authentication will require 2FA
      const result = await HiveService.connect('test@hive.com', 'password123');

      // Non-demo mode triggers 2FA flow
      expect(result.requires2fa).toBe(true);
      expect(result.session).toBeTruthy();
    });

    it('should return success when device credentials allow skipping 2FA', async () => {
      // Set up valid device credentials (module-level mock state)
      mockDeviceCredentials = {
        deviceKey: 'device-key-123',
        deviceGroupKey: 'group-key',
        devicePassword: 'device-pass',
      };

      const result = await HiveService.connect('test@hive.com', 'password123');

      // With device credentials, should succeed without 2FA
      expect(result.success).toBe(true);
      expect(result.requires2fa).toBeFalsy();
    });

    it('should return error for invalid demo credentials', async () => {
      const result = await HiveService.connect('bad@email.com', 'wrongpass', true);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should require 2FA for valid demo credentials', async () => {
      const result = await HiveService.connect('demo@hive.com', 'demo', true);

      expect(result.requires2fa).toBe(true);
      expect(result.session).toBeTruthy();
    });
  });

  describe('disconnect', () => {
    it('should clear all credentials and session tokens', async () => {
      await HiveService.disconnect();

      expect(hiveCredentialsManager.clearCredentials).toHaveBeenCalled();
      expect(hiveCredentialsManager.clearDeviceCredentials).toHaveBeenCalled();
      expect(hiveCredentialsManager.clearSessionToken).toHaveBeenCalled();
    });
  });

  describe('getStatus', () => {
    it('should return thermostat status in demo mode', async () => {
      const result = await HiveService.getStatus(true);

      expect(result).toHaveProperty('heating');
      expect(result.heating.currentTemperature).toBe(19.5);
      expect(result.heating.isHeating).toBe(true);
    });

    it('should throw error when not connected', async () => {
      hiveCredentialsManager.hasCredentials.mockReturnValue(false);

      await expect(HiveService.getStatus()).rejects.toThrow(/not connected/i);
    });

    it('should include hot water status in demo mode', async () => {
      const result = await HiveService.getStatus(true);

      expect(result).toHaveProperty('hotWater');
      expect(result.hotWater.isOn).toBe(false);
      expect(result.hotWater.mode).toBe('schedule');
    });
  });

  describe('getSchedules', () => {
    it('should return list of schedules in demo mode', async () => {
      const result = await HiveService.getSchedules(true);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('type');
    });

    it('should throw error when not connected', async () => {
      hiveCredentialsManager.hasCredentials.mockReturnValue(false);

      await expect(HiveService.getSchedules()).rejects.toThrow(/not connected/i);
    });

    it('should return schedules with required properties in demo mode', async () => {
      const result = await HiveService.getSchedules(true);

      // All schedules should have required properties
      result.forEach((schedule) => {
        expect(schedule).toHaveProperty('id');
        expect(schedule).toHaveProperty('name');
        expect(schedule).toHaveProperty('type');
        expect(schedule).toHaveProperty('time');
        expect(schedule).toHaveProperty('days');
      });
    });
  });

  describe('Demo Mode', () => {
    it('should return mock status in demo mode', async () => {
      const result = await HiveService.getStatus(true);

      expect(result).toHaveProperty('heating');
      expect(result).toHaveProperty('hotWater');
      expect(result.heating).toHaveProperty('currentTemperature');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return mock schedules in demo mode', async () => {
      const result = await HiveService.getSchedules(true);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should require 2FA for connect in demo mode with valid credentials', async () => {
      const result = await HiveService.connect('demo@hive.com', 'demo', true);

      expect(result.requires2fa).toBe(true);
      expect(result.session).toBeTruthy();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('2FA Authentication Flow', () => {
    it('should return requires2fa for non-demo mode without device credentials', async () => {
      // Non-demo mode authentication requires 2FA when no device credentials
      const result = await HiveService.connect('user@hive.com', 'password');

      expect(result.requires2fa).toBe(true);
      expect(result.session).toBeTruthy();
    });

    it('should accept 2FA code and return success', async () => {
      const result = await HiveService.verify2fa('123456', 'session-token', 'user@hive.com');

      expect(result.success).toBe(true);
    });

    it('should return error for invalid 2FA code', async () => {
      const result = await HiveService.verify2fa('000000', 'session-token', 'user@hive.com');

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/invalid|code/i);
    });

    it('should skip 2FA when device credentials exist', async () => {
      // Set up valid device credentials (module-level mock state)
      mockDeviceCredentials = {
        deviceKey: 'device-key',
        deviceGroupKey: 'group-key',
        devicePassword: 'device-pass',
      };

      const result = await HiveService.connect('user@hive.com', 'password');

      // Should connect directly without 2FA
      expect(result.requires2fa).toBeFalsy();
      expect(result.success).toBe(true);
    });

    it('should return success after verifying 2FA', async () => {
      const result = await HiveService.verify2fa('123456', 'session-token', 'user@hive.com');

      // Verify 2FA returns success
      expect(result.success).toBe(true);
    });
  });

  describe('Demo Mode 2FA', () => {
    it('should require 2FA for demo@hive.com in demo mode', async () => {
      const result = await HiveService.connect('demo@hive.com', 'demo', true);

      expect(result.requires2fa).toBe(true);
      expect(result.session).toBeTruthy();
    });

    it('should verify 2FA code 123456 in demo mode', async () => {
      const result = await HiveService.verify2fa('123456', 'demo-session', 'demo@hive.com', true);

      expect(result.success).toBe(true);
    });

    it('should reject invalid 2FA code in demo mode', async () => {
      const result = await HiveService.verify2fa('000000', 'demo-session', 'demo@hive.com', true);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Demo Mode Session Tracking', () => {
    it('should track demo mode connection state after 2FA verification', async () => {
      // Connect in demo mode (requires 2FA)
      const connectResult = await HiveService.connect('demo@hive.com', 'demo', true);
      expect(connectResult.requires2fa).toBe(true);

      // Verify 2FA
      await HiveService.verify2fa('123456', connectResult.session, 'demo@hive.com', true);

      // Should report as connected in demo mode
      expect(HiveService.isConnectedDemo()).toBe(true);
    });

    it('should clear demo mode connection state on disconnect', async () => {
      // Connect and verify 2FA in demo mode
      await HiveService.connect('demo@hive.com', 'demo', true);
      await HiveService.verify2fa('123456', 'demo-session', 'demo@hive.com', true);
      expect(HiveService.isConnectedDemo()).toBe(true);

      // Disconnect
      await HiveService.disconnect();

      // Should no longer be connected
      expect(HiveService.isConnectedDemo()).toBe(false);
    });

    it('should not be connected in demo mode initially', () => {
      expect(HiveService.isConnectedDemo()).toBe(false);
    });

    it('should return error if trying to get status without demo connection', async () => {
      // Not connected in demo mode, and demoMode flag is false
      hiveCredentialsManager.hasCredentials.mockReturnValue(false);

      await expect(HiveService.getStatus(false)).rejects.toThrow(/not connected/i);
    });

    it('should reject invalid demo credentials', async () => {
      const result = await HiveService.connect('invalid@email.com', 'wrongpass', true);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/invalid/i);
    });
  });

  describe('_transformStatus', () => {
    it('should use props.working for heating status, not state.status', async () => {
      // Set up connected state
      hiveCredentialsManager.getSessionToken.mockReturnValue('valid_token');

      // Mock API response with props.working = true (heating is on)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            products: [
              {
                type: 'heating',
                state: { mode: 'SCHEDULE', target: 20 },
                props: { temperature: 18.5, working: true },
              },
              {
                type: 'hotwater',
                state: { mode: 'SCHEDULE', status: 'OFF' },
                props: { working: false },
              },
            ],
          }),
      });

      const result = await HiveService.getStatus(false);

      // isHeating should be true because props.working is true
      expect(result.heating.isHeating).toBe(true);
      expect(result.heating.currentTemperature).toBe(18.5);
      expect(result.heating.targetTemperature).toBe(20);
    });

    it('should show heating as off when props.working is false', async () => {
      hiveCredentialsManager.getSessionToken.mockReturnValue('valid_token');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            products: [
              {
                type: 'heating',
                state: { mode: 'SCHEDULE', target: 20 },
                props: { temperature: 21.5, working: false },
              },
              {
                type: 'hotwater',
                state: { mode: 'OFF' },
                props: { working: false },
              },
            ],
          }),
      });

      const result = await HiveService.getStatus(false);

      // isHeating should be false because props.working is false
      expect(result.heating.isHeating).toBe(false);
    });

    it('should use props.working for hot water status', async () => {
      hiveCredentialsManager.getSessionToken.mockReturnValue('valid_token');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            products: [
              {
                type: 'heating',
                state: { mode: 'SCHEDULE', target: 20 },
                props: { temperature: 20, working: false },
              },
              {
                type: 'hotwater',
                state: { mode: 'BOOST', status: 'ON' },
                props: { working: true },
              },
            ],
          }),
      });

      const result = await HiveService.getStatus(false);

      // isOn should be true because props.working is true
      expect(result.hotWater.isOn).toBe(true);
      expect(result.hotWater.mode).toBe('BOOST');
    });

    it('should show hot water as off when props.working is false', async () => {
      hiveCredentialsManager.getSessionToken.mockReturnValue('valid_token');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            products: [
              {
                type: 'heating',
                state: { mode: 'SCHEDULE', target: 20 },
                props: { temperature: 20, working: false },
              },
              {
                type: 'hotwater',
                state: { mode: 'SCHEDULE', status: 'OFF' },
                props: { working: false },
              },
            ],
          }),
      });

      const result = await HiveService.getStatus(false);

      expect(result.hotWater.isOn).toBe(false);
    });

    it('should handle missing props.working gracefully (default to false)', async () => {
      hiveCredentialsManager.getSessionToken.mockReturnValue('valid_token');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            products: [
              {
                type: 'heating',
                state: { mode: 'SCHEDULE', target: 20 },
                props: { temperature: 20 }, // No working field
              },
              {
                type: 'hotwater',
                state: { mode: 'SCHEDULE' },
                props: {}, // No working field
              },
            ],
          }),
      });

      const result = await HiveService.getStatus(false);

      // Should default to false when props.working is undefined
      expect(result.heating.isHeating).toBe(false);
      expect(result.hotWater.isOn).toBe(false);
    });
  });

  describe('getConnectionStatus', () => {
    it('should return connected: false when not connected in demo mode', async () => {
      const status = await HiveService.getConnectionStatus(true);

      expect(status.connected).toBe(false);
    });

    it('should return connected: true after 2FA verification in demo mode', async () => {
      await HiveService.connect('demo@hive.com', 'demo', true);
      await HiveService.verify2fa('123456', 'demo-session', 'demo@hive.com', true);

      const status = await HiveService.getConnectionStatus(true);

      expect(status.connected).toBe(true);
    });

    it('should return connected: false after disconnecting in demo mode', async () => {
      await HiveService.connect('demo@hive.com', 'demo', true);
      await HiveService.verify2fa('123456', 'demo-session', 'demo@hive.com', true);
      await HiveService.disconnect();

      const status = await HiveService.getConnectionStatus(true);

      expect(status.connected).toBe(false);
    });

    it('should check real connection status when not in demo mode', async () => {
      hiveCredentialsManager.getSessionToken.mockReturnValue('valid_token');

      const status = await HiveService.getConnectionStatus(false);

      expect(status.connected).toBe(true);
    });

    it('should return connected: false when no session token', async () => {
      hiveCredentialsManager.getSessionToken.mockReturnValue(null);

      const status = await HiveService.getConnectionStatus(false);

      expect(status.connected).toBe(false);
    });
  });
});
