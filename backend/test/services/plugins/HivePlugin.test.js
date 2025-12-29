import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock logger
vi.mock('../../../utils/logger.js', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

// Mock hiveService
vi.mock('../../../services/hiveService.js', () => ({
  default: {
    connect: vi.fn(),
    verify2fa: vi.fn(),
    disconnect: vi.fn(),
    isConnected: vi.fn(),
    isConnectedDemo: vi.fn(),
    getConnectionStatus: vi.fn(),
    getStatus: vi.fn(),
    getSchedules: vi.fn(),
    resetDemo: vi.fn(),
    transformStatusToDevices: vi.fn((status) => {
      const devices = [];
      if (status.heating) {
        devices.push({
          id: 'hive:heating',
          name: 'Central Heating',
          type: 'thermostat',
          serviceId: 'hive',
          state: {
            currentTemperature: status.heating.currentTemperature,
            targetTemperature: status.heating.targetTemperature,
            isHeating: status.heating.isHeating,
            mode: status.heating.mode,
          },
          capabilities: ['temperature', 'targetTemperature', 'mode'],
        });
      }
      if (status.hotWater) {
        devices.push({
          id: 'hive:hotwater',
          name: 'Hot Water',
          type: 'hotWater',
          serviceId: 'hive',
          state: {
            isOn: status.hotWater.isOn,
            mode: status.hotWater.mode,
          },
          capabilities: ['on', 'mode'],
        });
      }
      return devices;
    }),
  },
}));

// Mock hiveCredentialsManager
vi.mock('../../../services/hiveCredentialsManager.js', () => ({
  default: {
    hasCredentials: vi.fn(),
    clearCredentials: vi.fn(),
    clearDeviceCredentials: vi.fn(),
    clearSessionToken: vi.fn(),
  },
  HIVE_DEMO_CREDENTIALS: {
    username: 'demo@hive.com',
    password: 'demo',
    code: '123456',
  },
}));

describe('HivePlugin', () => {
  let HivePlugin;
  let hiveService;
  let hiveCredentialsManager;

  beforeEach(async () => {
    vi.clearAllMocks();

    const serviceMod = await import('../../../services/hiveService.js');
    hiveService = serviceMod.default;

    const credsMod = await import('../../../services/hiveCredentialsManager.js');
    hiveCredentialsManager = credsMod.default;

    const pluginMod = await import('../../../services/plugins/HivePlugin.js');
    HivePlugin = pluginMod.default;
  });

  describe('static properties', () => {
    it('should have id "hive"', () => {
      expect(HivePlugin.constructor.id).toBe('hive');
    });

    it('should have displayName "Hive Heating"', () => {
      expect(HivePlugin.constructor.displayName).toBe('Hive Heating');
    });

    it('should have authType "2fa"', () => {
      expect(HivePlugin.constructor.authType).toBe('2fa');
    });
  });

  describe('connect', () => {
    it('should require 2FA for valid credentials', async () => {
      hiveService.connect.mockResolvedValue({
        requires2fa: true,
        session: 'cognito-session-token',
      });

      const result = await HivePlugin.connect(
        { username: 'user@example.com', password: 'password' },
        false
      );

      expect(result.requires2fa).toBe(true);
      expect(result.session).toBe('cognito-session-token');
    });

    it('should return success when already authenticated via device', async () => {
      hiveService.connect.mockResolvedValue({ success: true });

      const result = await HivePlugin.connect(
        { username: 'user@example.com', password: 'password' },
        false
      );

      expect(result.success).toBe(true);
    });

    it('should return error for invalid credentials', async () => {
      hiveService.connect.mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });

      const result = await HivePlugin.connect(
        { username: 'bad@example.com', password: 'wrong' },
        false
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });

    it('should require username and password', async () => {
      const result = await HivePlugin.connect({}, false);

      expect(result.success).toBe(false);
      expect(result.error).toContain('username');
    });

    it('should handle demo mode', async () => {
      hiveService.connect.mockResolvedValue({
        requires2fa: true,
        session: 'demo-2fa-session',
      });

      const result = await HivePlugin.connect(
        { username: 'demo@hive.com', password: 'demo' },
        true
      );

      expect(result.requires2fa).toBe(true);
      expect(hiveService.connect).toHaveBeenCalledWith('demo@hive.com', 'demo', true);
    });
  });

  describe('disconnect', () => {
    it('should delegate to hiveService', async () => {
      await HivePlugin.disconnect();

      expect(hiveService.disconnect).toHaveBeenCalled();
    });
  });

  describe('isConnected', () => {
    it('should return true when connected', () => {
      hiveService.isConnected.mockReturnValue(true);

      expect(HivePlugin.isConnected(false)).toBe(true);
    });

    it('should check demo connection in demo mode', () => {
      hiveService.isConnectedDemo.mockReturnValue(true);

      expect(HivePlugin.isConnected(true)).toBe(true);
      expect(hiveService.isConnectedDemo).toHaveBeenCalled();
    });
  });

  describe('getConnectionStatus', () => {
    it('should delegate to hiveService', async () => {
      hiveService.getConnectionStatus.mockResolvedValue({ connected: true });

      const status = await HivePlugin.getConnectionStatus(false);

      expect(status).toEqual({ connected: true });
      expect(hiveService.getConnectionStatus).toHaveBeenCalledWith(false);
    });
  });

  describe('getStatus', () => {
    it('should return thermostat status', async () => {
      hiveService.getStatus.mockResolvedValue({
        heating: { currentTemperature: 20, targetTemperature: 21, isHeating: true },
        hotWater: { isOn: false },
      });

      const status = await HivePlugin.getStatus(false);

      expect(status).toHaveProperty('heating');
      expect(status).toHaveProperty('hotWater');
    });

    it('should return demo status in demo mode', async () => {
      hiveService.getStatus.mockResolvedValue({
        heating: { currentTemperature: 19, targetTemperature: 20 },
        hotWater: { isOn: true },
      });

      await HivePlugin.getStatus(true);

      expect(hiveService.getStatus).toHaveBeenCalledWith(true);
    });
  });

  describe('hasCredentials', () => {
    it('should delegate to hiveCredentialsManager', () => {
      hiveCredentialsManager.hasCredentials.mockReturnValue(true);

      expect(HivePlugin.hasCredentials()).toBe(true);
    });
  });

  describe('clearCredentials', () => {
    it('should clear all credential types', async () => {
      await HivePlugin.clearCredentials();

      expect(hiveCredentialsManager.clearCredentials).toHaveBeenCalled();
      expect(hiveCredentialsManager.clearDeviceCredentials).toHaveBeenCalled();
      expect(hiveCredentialsManager.clearSessionToken).toHaveBeenCalled();
    });
  });

  describe('getDemoCredentials', () => {
    it('should return demo credentials', () => {
      const creds = HivePlugin.getDemoCredentials();

      expect(creds).toHaveProperty('username', 'demo@hive.com');
      expect(creds).toHaveProperty('password', 'demo');
      expect(creds).toHaveProperty('code', '123456');
    });
  });

  describe('resetDemo', () => {
    it('should delegate to hiveService', () => {
      HivePlugin.resetDemo();

      expect(hiveService.resetDemo).toHaveBeenCalled();
    });
  });

  describe('getRouter', () => {
    it('should return Express router', () => {
      const router = HivePlugin.getRouter();

      expect(router).toBeDefined();
      expect(typeof router).toBe('function');
    });

    it('should have route for /verify-2fa', () => {
      const router = HivePlugin.getRouter();
      const routes = router.stack.filter((layer) => layer.route);
      const verifyRoute = routes.find((r) => r.route.path === '/verify-2fa');

      expect(verifyRoute).toBeDefined();
    });

    it('should have route for /schedules', () => {
      const router = HivePlugin.getRouter();
      const routes = router.stack.filter((layer) => layer.route);
      const schedulesRoute = routes.find((r) => r.route.path === '/schedules');

      expect(schedulesRoute).toBeDefined();
    });
  });

  describe('verify2fa', () => {
    it('should verify 2FA code and return success', async () => {
      hiveService.verify2fa.mockResolvedValue({ success: true });

      const result = await HivePlugin.verify2fa(
        {
          code: '123456',
          session: 'session-token',
          username: 'user@example.com',
        },
        false
      );

      expect(result.success).toBe(true);
    });

    it('should return error for invalid code', async () => {
      hiveService.verify2fa.mockResolvedValue({
        success: false,
        error: 'Invalid verification code',
      });

      const result = await HivePlugin.verify2fa(
        {
          code: '000000',
          session: 'session-token',
          username: 'user@example.com',
        },
        false
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid');
    });
  });

  describe('getSchedules', () => {
    it('should return heating schedules', async () => {
      hiveService.getSchedules.mockResolvedValue([
        { id: 'sched-1', name: 'Morning', type: 'heating' },
        { id: 'sched-2', name: 'Evening', type: 'hotwater' },
      ]);

      const schedules = await HivePlugin.getSchedules(false);

      expect(schedules).toHaveLength(2);
      expect(hiveService.getSchedules).toHaveBeenCalledWith(false);
    });
  });

  describe('detectChanges', () => {
    it('should detect status changes', () => {
      const previous = {
        heating: { currentTemperature: 19 },
        hotWater: { isOn: false },
      };
      const current = {
        heating: { currentTemperature: 20 },
        hotWater: { isOn: false },
      };

      const changes = HivePlugin.detectChanges(previous, current);

      expect(changes).not.toBeNull();
    });

    it('should return null when no changes', () => {
      const state = {
        heating: { currentTemperature: 20 },
        hotWater: { isOn: true },
      };

      const changes = HivePlugin.detectChanges(state, state);

      expect(changes).toBeNull();
    });
  });

  describe('getRooms (Home abstraction)', () => {
    it('should return empty array (Hive has no rooms)', async () => {
      const rooms = await HivePlugin.getRooms(false);

      expect(rooms).toEqual([]);
    });
  });

  describe('getDevices (Home abstraction)', () => {
    it('should return heating and hot water as home-level devices', async () => {
      hiveService.getStatus.mockResolvedValue({
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
      });

      const devices = await HivePlugin.getDevices(false);

      expect(devices).toHaveLength(2);

      const heating = devices.find((d) => d.type === 'thermostat');
      expect(heating).toBeDefined();
      expect(heating.id).toBe('hive:heating');
      expect(heating.name).toBe('Central Heating');
      expect(heating.serviceId).toBe('hive');
      expect(heating.state.currentTemperature).toBe(19.5);
      expect(heating.state.targetTemperature).toBe(21);
      expect(heating.state.isHeating).toBe(true);

      const hotWater = devices.find((d) => d.type === 'hotWater');
      expect(hotWater).toBeDefined();
      expect(hotWater.id).toBe('hive:hotwater');
      expect(hotWater.name).toBe('Hot Water');
      expect(hotWater.serviceId).toBe('hive');
      expect(hotWater.state.isOn).toBe(false);
    });

    it('should handle demo mode', async () => {
      hiveService.getStatus.mockResolvedValue({
        heating: { currentTemperature: 20, isHeating: false },
        hotWater: { isOn: true },
      });

      await HivePlugin.getDevices(true);

      expect(hiveService.getStatus).toHaveBeenCalledWith(true);
    });

    it('should return empty array when not connected', async () => {
      hiveService.getStatus.mockRejectedValue(new Error('Not connected'));

      const devices = await HivePlugin.getDevices(false);

      expect(devices).toEqual([]);
    });
  });

  describe('updateDevice', () => {
    it('should update heating target temperature', async () => {
      hiveService.setTargetTemperature = vi.fn().mockResolvedValue({ success: true });

      const result = await HivePlugin.updateDevice('heating', { targetTemperature: 22 });

      expect(hiveService.setTargetTemperature).toHaveBeenCalledWith(22, false);
      expect(result.success).toBe(true);
    });

    it('should update hot water state', async () => {
      hiveService.setHotWater = vi.fn().mockResolvedValue({ success: true });

      const result = await HivePlugin.updateDevice('hotwater', { isOn: true });

      expect(hiveService.setHotWater).toHaveBeenCalledWith(true, false);
      expect(result.success).toBe(true);
    });
  });
});
