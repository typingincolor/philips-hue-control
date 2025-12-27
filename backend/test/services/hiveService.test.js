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
    setSessionToken: vi.fn(),
    clearSessionToken: vi.fn(),
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
    vi.resetModules();

    // Import fresh modules
    const credsMod = await import('../../services/hiveCredentialsManager.js');
    hiveCredentialsManager = credsMod.default;

    const serviceMod = await import('../../services/hiveService.js');
    HiveService = serviceMod.default;
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
    it('should authenticate with Hive API and store session token', async () => {
      const mockLoginResponse = {
        token: 'hive_session_token_123',
        user: { id: 'user123' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLoginResponse,
      });

      const result = await HiveService.connect('test@hive.com', 'password123');

      expect(mockFetch).toHaveBeenCalled();
      expect(hiveCredentialsManager.setSessionToken).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should return error for invalid credentials', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid credentials' }),
      });

      const result = await HiveService.connect('bad@email.com', 'wrongpass');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await HiveService.connect('test@hive.com', 'password');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network');
    });
  });

  describe('disconnect', () => {
    it('should clear session token and credentials', async () => {
      await HiveService.disconnect();

      expect(hiveCredentialsManager.clearSessionToken).toHaveBeenCalled();
    });
  });

  describe('getStatus', () => {
    it('should return thermostat status when connected', async () => {
      hiveCredentialsManager.hasCredentials.mockReturnValue(true);
      hiveCredentialsManager.getSessionToken.mockReturnValue('valid_token');

      const mockStatus = {
        heating: {
          currentTemperature: 19.5,
          targetTemperature: 21,
          isHeating: true,
          mode: 'schedule',
        },
        hotWater: {
          isOn: false,
          mode: 'schedule',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus,
      });

      const result = await HiveService.getStatus();

      expect(result).toHaveProperty('heating');
      expect(result.heating.currentTemperature).toBe(19.5);
      expect(result.heating.isHeating).toBe(true);
    });

    it('should throw error when not connected', async () => {
      hiveCredentialsManager.hasCredentials.mockReturnValue(false);

      await expect(HiveService.getStatus()).rejects.toThrow(/not connected/i);
    });

    it('should include hot water status', async () => {
      hiveCredentialsManager.hasCredentials.mockReturnValue(true);
      hiveCredentialsManager.getSessionToken.mockReturnValue('valid_token');

      const mockStatus = {
        heating: { currentTemperature: 20, targetTemperature: 21, isHeating: false, mode: 'off' },
        hotWater: { isOn: true, mode: 'on' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus,
      });

      const result = await HiveService.getStatus();

      expect(result).toHaveProperty('hotWater');
      expect(result.hotWater.isOn).toBe(true);
    });
  });

  describe('getSchedules', () => {
    it('should return list of schedules', async () => {
      hiveCredentialsManager.hasCredentials.mockReturnValue(true);
      hiveCredentialsManager.getSessionToken.mockReturnValue('valid_token');

      const mockSchedules = [
        {
          id: '1',
          name: 'Morning Warmup',
          type: 'heating',
          time: '06:00',
          days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        },
        {
          id: '2',
          name: 'Evening Heat',
          type: 'heating',
          time: '17:00',
          days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        },
        {
          id: '3',
          name: 'Hot Water AM',
          type: 'hotWater',
          time: '07:00',
          days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSchedules,
      });

      const result = await HiveService.getSchedules();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('type');
    });

    it('should throw error when not connected', async () => {
      hiveCredentialsManager.hasCredentials.mockReturnValue(false);

      await expect(HiveService.getSchedules()).rejects.toThrow(/not connected/i);
    });

    it('should return empty array when no schedules configured', async () => {
      hiveCredentialsManager.hasCredentials.mockReturnValue(true);
      hiveCredentialsManager.getSessionToken.mockReturnValue('valid_token');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const result = await HiveService.getSchedules();

      expect(result).toEqual([]);
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

    it('should return success for connect in demo mode with valid credentials', async () => {
      const result = await HiveService.connect('demo@hive.com', 'demo', true);

      expect(result.success).toBe(true);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Demo Mode Session Tracking', () => {
    it('should track demo mode connection state after connect', async () => {
      // Connect in demo mode
      await HiveService.connect('demo@hive.com', 'demo', true);

      // Should report as connected in demo mode
      expect(HiveService.isConnectedDemo()).toBe(true);
    });

    it('should clear demo mode connection state on disconnect', async () => {
      // Connect in demo mode
      await HiveService.connect('demo@hive.com', 'demo', true);
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

  describe('getConnectionStatus', () => {
    it('should return connected: false when not connected in demo mode', () => {
      const status = HiveService.getConnectionStatus(true);

      expect(status.connected).toBe(false);
    });

    it('should return connected: true after connecting in demo mode', async () => {
      await HiveService.connect('demo@hive.com', 'demo', true);

      const status = HiveService.getConnectionStatus(true);

      expect(status.connected).toBe(true);
    });

    it('should return connected: false after disconnecting in demo mode', async () => {
      await HiveService.connect('demo@hive.com', 'demo', true);
      await HiveService.disconnect();

      const status = HiveService.getConnectionStatus(true);

      expect(status.connected).toBe(false);
    });

    it('should check real connection status when not in demo mode', () => {
      hiveCredentialsManager.hasCredentials.mockReturnValue(true);
      hiveCredentialsManager.getSessionToken.mockReturnValue('valid_token');

      const status = HiveService.getConnectionStatus(false);

      expect(status.connected).toBe(true);
    });

    it('should return connected: false when no real credentials', () => {
      hiveCredentialsManager.hasCredentials.mockReturnValue(false);

      const status = HiveService.getConnectionStatus(false);

      expect(status.connected).toBe(false);
    });
  });
});
