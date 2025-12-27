import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { hueApi, resetDemoModeCache } from './hueApi';

// Mock axios
vi.mock('axios', () => {
  const mockAxios = {
    create: vi.fn(() => mockAxios),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };
  return { default: mockAxios };
});

// Helper to mock demo mode via URL
const mockDemoModeURL = (isDemoMode) => {
  Object.defineProperty(window, 'location', {
    value: {
      search: isDemoMode ? '?demo=true' : '',
      protocol: 'http:',
      host: 'localhost:5173',
    },
    writable: true,
  });
};

describe('hueApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDemoModeCache();
    mockDemoModeURL(false);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createUser', () => {
    it('should send POST request with correct body', async () => {
      axios.post.mockResolvedValue({ data: { username: 'test-user-123' } });

      const result = await hueApi.createUser('192.168.1.100', 'test-app');

      expect(axios.post).toHaveBeenCalledWith('/v1/auth/pair', {
        bridgeIp: '192.168.1.100',
        appName: 'test-app',
      });
      expect(result).toBe('test-user-123');
    });

    it('should use default appName if not provided', async () => {
      axios.post.mockResolvedValue({ data: { username: 'test-user' } });

      await hueApi.createUser('192.168.1.100');

      expect(axios.post).toHaveBeenCalledWith('/v1/auth/pair', {
        bridgeIp: '192.168.1.100',
        appName: 'hue_control_app',
      });
    });
  });

  describe('createSession', () => {
    it('should send POST request with correct body', async () => {
      const mockSession = {
        sessionToken: 'hue_sess_abc123',
        expiresIn: 86400,
        bridgeIp: '192.168.1.100',
      };
      axios.post.mockResolvedValue({ data: mockSession });

      const result = await hueApi.createSession('192.168.1.100', 'test-user');

      expect(axios.post).toHaveBeenCalledWith('/v1/auth/session', {
        bridgeIp: '192.168.1.100',
        username: 'test-user',
      });
      expect(result).toEqual(mockSession);
    });

    it('should throw error if response fails', async () => {
      const error = new Error('Request failed');
      error.data = { message: 'Invalid credentials' };
      axios.post.mockRejectedValue(error);

      await expect(hueApi.createSession('192.168.1.100', 'bad-user')).rejects.toThrow(
        'Invalid credentials'
      );
    });
  });

  describe('getDashboard', () => {
    it('should send GET request with Authorization header', async () => {
      const mockDashboard = {
        summary: { totalLights: 10, lightsOn: 5 },
        rooms: [],
      };
      axios.get.mockResolvedValue({ data: mockDashboard });

      const result = await hueApi.getDashboard('hue_sess_test123');

      expect(axios.get).toHaveBeenCalledWith('/v1/dashboard', {
        headers: { Authorization: 'Bearer hue_sess_test123' },
      });
      expect(result).toEqual(mockDashboard);
    });
  });

  describe('getMotionZones', () => {
    it('should send GET request with Authorization header', async () => {
      const mockZones = { zones: [] };
      axios.get.mockResolvedValue({ data: mockZones });

      const result = await hueApi.getMotionZones('hue_sess_test123');

      expect(axios.get).toHaveBeenCalledWith('/v1/motion-zones', {
        headers: { Authorization: 'Bearer hue_sess_test123' },
      });
      expect(result).toEqual(mockZones);
    });
  });

  describe('updateLight', () => {
    it('should send PUT request with correct headers and body', async () => {
      const mockResponse = { light: { id: 'light-1', on: true, brightness: 80 } };
      axios.put.mockResolvedValue({ data: mockResponse });

      const result = await hueApi.updateLight('hue_sess_test123', 'light-1', {
        on: true,
        brightness: 80,
      });

      expect(axios.put).toHaveBeenCalledWith(
        '/v1/lights/light-1',
        { on: true, brightness: 80 },
        { headers: { Authorization: 'Bearer hue_sess_test123' } }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateRoomLights', () => {
    it('should send PUT request with correct parameters', async () => {
      const mockResponse = {
        updatedLights: [
          { id: 'light-1', on: true },
          { id: 'light-2', on: true },
        ],
      };
      axios.put.mockResolvedValue({ data: mockResponse });

      const result = await hueApi.updateRoomLights('hue_sess_test123', 'room-1', { on: true });

      expect(axios.put).toHaveBeenCalledWith(
        '/v1/rooms/room-1/lights',
        { on: true },
        { headers: { Authorization: 'Bearer hue_sess_test123' } }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateZoneLights', () => {
    it('should send PUT request with correct parameters', async () => {
      const mockResponse = {
        updatedLights: [
          { id: 'light-1', on: true },
          { id: 'light-2', on: true },
        ],
      };
      axios.put.mockResolvedValue({ data: mockResponse });

      const result = await hueApi.updateZoneLights('hue_sess_test123', 'zone-1', { on: true });

      expect(axios.put).toHaveBeenCalledWith(
        '/v1/zones/zone-1/lights',
        { on: true },
        { headers: { Authorization: 'Bearer hue_sess_test123' } }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('activateSceneV1', () => {
    it('should send POST request with Authorization header', async () => {
      const mockResponse = { affectedLights: [{ id: 'light-1', on: true }] };
      axios.post.mockResolvedValue({ data: mockResponse });

      const result = await hueApi.activateSceneV1('hue_sess_test123', 'scene-1');

      expect(axios.post).toHaveBeenCalledWith('/v1/scenes/scene-1/activate', null, {
        headers: { Authorization: 'Bearer hue_sess_test123' },
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('refreshSession', () => {
    it('should send POST request with Authorization header', async () => {
      const mockNewSession = {
        sessionToken: 'hue_sess_new456',
        expiresIn: 86400,
        bridgeIp: '192.168.1.100',
      };
      axios.post.mockResolvedValue({ data: mockNewSession });

      const result = await hueApi.refreshSession('hue_sess_old123');

      expect(axios.post).toHaveBeenCalledWith('/v1/auth/refresh', null, {
        headers: { Authorization: 'Bearer hue_sess_old123' },
      });
      expect(result).toEqual(mockNewSession);
    });
  });

  describe('revokeSession', () => {
    it('should send DELETE request with Authorization header', async () => {
      const mockResponse = { success: true, message: 'Session revoked' };
      axios.delete.mockResolvedValue({ data: mockResponse });

      const result = await hueApi.revokeSession('hue_sess_test123');

      expect(axios.delete).toHaveBeenCalledWith('/v1/auth/session', {
        headers: { Authorization: 'Bearer hue_sess_test123' },
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('connect', () => {
    it('should connect successfully with stored credentials', async () => {
      const mockSession = {
        sessionToken: 'hue_sess_abc123',
        expiresIn: 86400,
        bridgeIp: '192.168.1.100',
      };
      axios.post.mockResolvedValue({ data: mockSession });

      const result = await hueApi.connect('192.168.1.100');

      expect(axios.post).toHaveBeenCalledWith('/v1/auth/connect', { bridgeIp: '192.168.1.100' });
      expect(result).toEqual(mockSession);
    });

    it('should throw PAIRING_REQUIRED when no stored credentials', async () => {
      const error = new Error('Not found');
      error.data = { error: 'No stored credentials', requiresPairing: true };
      axios.post.mockRejectedValue(error);

      await expect(hueApi.connect('192.168.1.100')).rejects.toThrow('PAIRING_REQUIRED');
    });
  });

  describe('checkBridgeStatus', () => {
    it('should return true when credentials exist', async () => {
      axios.get.mockResolvedValue({ data: { bridgeIp: '192.168.1.100', hasCredentials: true } });

      const result = await hueApi.checkBridgeStatus('192.168.1.100');

      expect(axios.get).toHaveBeenCalledWith('/v1/auth/bridge-status', {
        params: { bridgeIp: '192.168.1.100' },
      });
      expect(result).toBe(true);
    });

    it('should return false when no credentials exist', async () => {
      axios.get.mockResolvedValue({ data: { bridgeIp: '192.168.1.100', hasCredentials: false } });

      const result = await hueApi.checkBridgeStatus('192.168.1.100');

      expect(result).toBe(false);
    });

    it('should return false on network error', async () => {
      axios.get.mockRejectedValue(new Error('Network error'));

      const result = await hueApi.checkBridgeStatus('192.168.1.100');

      expect(result).toBe(false);
    });
  });

  describe('settings API', () => {
    it('getSettings should fetch settings with authorization', async () => {
      const mockSettings = { location: null, units: 'celsius' };
      axios.get.mockResolvedValue({ data: mockSettings });

      const result = await hueApi.getSettings('test-token');

      expect(axios.get).toHaveBeenCalledWith('/v1/settings', {
        headers: { Authorization: 'Bearer test-token' },
      });
      expect(result).toEqual(mockSettings);
    });

    it('updateSettings should send PUT request with settings', async () => {
      const newSettings = { location: { lat: 51.5, lon: -0.1, name: 'London' }, units: 'celsius' };
      axios.put.mockResolvedValue({ data: newSettings });

      const result = await hueApi.updateSettings('test-token', newSettings);

      expect(axios.put).toHaveBeenCalledWith('/v1/settings', newSettings, {
        headers: { Authorization: 'Bearer test-token' },
      });
      expect(result).toEqual(newSettings);
    });

    it('updateLocation should send PUT request to location endpoint', async () => {
      const location = { lat: 51.5, lon: -0.1, name: 'London' };
      axios.put.mockResolvedValue({ data: { location, units: 'celsius' } });

      await hueApi.updateLocation('test-token', location);

      expect(axios.put).toHaveBeenCalledWith('/v1/settings/location', location, {
        headers: { Authorization: 'Bearer test-token' },
      });
    });

    it('clearLocation should send DELETE request to location endpoint', async () => {
      axios.delete.mockResolvedValue({ data: { location: null, units: 'celsius' } });

      await hueApi.clearLocation('test-token');

      expect(axios.delete).toHaveBeenCalledWith('/v1/settings/location', {
        headers: { Authorization: 'Bearer test-token' },
      });
    });
  });

  describe('weather API', () => {
    it('getWeather should fetch weather with authorization', async () => {
      const mockWeather = {
        current: { temperature: 15, condition: 'Partly cloudy' },
        forecast: [],
      };
      axios.get.mockResolvedValue({ data: mockWeather });

      const result = await hueApi.getWeather('test-token');

      expect(axios.get).toHaveBeenCalledWith('/v1/weather', {
        headers: { Authorization: 'Bearer test-token' },
      });
      expect(result).toEqual(mockWeather);
    });
  });

  describe('automations API', () => {
    it('getAutomations should fetch automations with authorization', async () => {
      const mockAutomations = {
        automations: [
          { id: 'automation-1', name: 'Good Morning', type: 'smart_scene', enabled: true },
        ],
      };
      axios.get.mockResolvedValue({ data: mockAutomations });

      const result = await hueApi.getAutomations('test-token');

      expect(axios.get).toHaveBeenCalledWith('/v1/automations', {
        headers: { Authorization: 'Bearer test-token' },
      });
      expect(result).toEqual(mockAutomations);
    });

    it('triggerAutomation should send POST request to trigger endpoint', async () => {
      const mockResponse = { success: true };
      axios.post.mockResolvedValue({ data: mockResponse });

      const result = await hueApi.triggerAutomation('test-token', 'automation-1');

      expect(axios.post).toHaveBeenCalledWith('/v1/automations/automation-1/trigger', null, {
        headers: { Authorization: 'Bearer test-token' },
      });
      expect(result).toEqual(mockResponse);
    });

    it('triggerAutomation should throw error on failure', async () => {
      const error = new Error('Failed to trigger');
      error.data = { message: 'Automation not found' };
      axios.post.mockRejectedValue(error);

      await expect(hueApi.triggerAutomation('test-token', 'invalid-id')).rejects.toThrow(
        'Automation not found'
      );
    });
  });

  describe('discoverBridge', () => {
    it('should return bridge data on success', async () => {
      const mockBridges = [{ id: 'bridge-1', internalipaddress: '192.168.1.100' }];
      axios.get.mockResolvedValue({ data: mockBridges });

      const result = await hueApi.discoverBridge();

      expect(axios.get).toHaveBeenCalledWith('/discovery');
      expect(result).toEqual(mockBridges);
    });

    it('should throw user-friendly error on failure', async () => {
      axios.get.mockRejectedValue(new Error('Network error'));

      await expect(hueApi.discoverBridge()).rejects.toThrow(
        'Could not discover bridges. Please enter IP manually.'
      );
    });
  });

  describe('Hive API', () => {
    describe('connectHive', () => {
      it('should send POST request with credentials', async () => {
        axios.post.mockResolvedValue({ data: { success: true } });

        const result = await hueApi.connectHive('test@hive.com', 'password123');

        expect(axios.post).toHaveBeenCalledWith('/v1/hive/connect', {
          username: 'test@hive.com',
          password: 'password123',
        });
        expect(result.success).toBe(true);
      });

      it('should return error on invalid credentials', async () => {
        axios.post.mockResolvedValue({
          data: { success: false, error: 'Invalid credentials' },
        });

        const result = await hueApi.connectHive('bad@email.com', 'wrong');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid credentials');
      });
    });

    describe('disconnectHive', () => {
      it('should send POST request to disconnect', async () => {
        axios.post.mockResolvedValue({ data: { success: true } });

        const result = await hueApi.disconnectHive();

        expect(axios.post).toHaveBeenCalledWith('/v1/hive/disconnect');
        expect(result.success).toBe(true);
      });
    });

    describe('getHiveStatus', () => {
      it('should fetch thermostat and hot water status', async () => {
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
        axios.get.mockResolvedValue({ data: mockStatus });

        const result = await hueApi.getHiveStatus();

        expect(axios.get).toHaveBeenCalledWith('/v1/hive/status');
        expect(result).toEqual(mockStatus);
      });

      it('should throw error if not connected', async () => {
        axios.get.mockRejectedValue({ response: { status: 401 } });

        await expect(hueApi.getHiveStatus()).rejects.toThrow();
      });
    });

    describe('getHiveSchedules', () => {
      it('should fetch list of schedules', async () => {
        const mockSchedules = [
          { id: '1', name: 'Morning', type: 'heating', time: '06:00' },
          { id: '2', name: 'Evening', type: 'heating', time: '17:00' },
        ];
        axios.get.mockResolvedValue({ data: mockSchedules });

        const result = await hueApi.getHiveSchedules();

        expect(axios.get).toHaveBeenCalledWith('/v1/hive/schedules');
        expect(result).toEqual(mockSchedules);
      });

      it('should return empty array when no schedules', async () => {
        axios.get.mockResolvedValue({ data: [] });

        const result = await hueApi.getHiveSchedules();

        expect(result).toEqual([]);
      });
    });

    describe('getHiveConnectionStatus', () => {
      it('should fetch connection status', async () => {
        axios.get.mockResolvedValue({ data: { connected: true } });

        const result = await hueApi.getHiveConnectionStatus();

        expect(axios.get).toHaveBeenCalledWith('/v1/hive/connection');
        expect(result.connected).toBe(true);
      });

      it('should return connected: false when not connected', async () => {
        axios.get.mockResolvedValue({ data: { connected: false } });

        const result = await hueApi.getHiveConnectionStatus();

        expect(result.connected).toBe(false);
      });
    });
  });
});
