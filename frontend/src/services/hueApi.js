import axios from 'axios';
import { createLogger } from '../utils/logger';

const logger = createLogger('HueApi');

// Check if demo mode from URL (cached for performance)
let demoModeCache = null;
const isDemoMode = () => {
  if (demoModeCache === null) {
    const params = new URLSearchParams(window.location.search);
    demoModeCache = params.get('demo') === 'true';
  }
  return demoModeCache;
};

// Reset cache when needed (e.g., for testing)
export const resetDemoModeCache = () => {
  demoModeCache = null;
};

// Create axios instance with defaults
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// Request interceptor for demo mode header
api.interceptors.request.use((config) => {
  if (isDemoMode()) {
    config.headers['X-Demo-Mode'] = 'true';
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // V2 API error handling (errors in successful response)
    if (response.data?.errors?.length > 0) {
      const error = new Error(response.data.errors[0].description);
      return Promise.reject(error);
    }
    return response;
  },
  (error) => {
    // Handle 401 as session expiration
    if (error.response?.status === 401) {
      return Promise.reject(new Error('Session expired. Please log in again.'));
    }

    // Network error detection
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      return Promise.reject(new Error('Could not connect to proxy server. Make sure it is running.'));
    }

    // Log unexpected errors (not 401/404)
    const expectedStatuses = [401, 404];
    if (!expectedStatuses.includes(error.response?.status)) {
      logger.error('Request failed:', error);
    }

    // Preserve original error with status
    if (error.response) {
      const httpError = new Error(`HTTP error! status: ${error.response.status}`);
      httpError.status = error.response.status;
      httpError.data = error.response.data;
      return Promise.reject(httpError);
    }

    return Promise.reject(error);
  }
);

// Helper to set auth header
const authHeader = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

export const hueApi = {
  // Discovery
  async discoverBridge() {
    try {
      const { data } = await api.get('/discovery');
      return data;
    } catch (error) {
      logger.error('Bridge discovery error:', error);
      throw new Error('Could not discover bridges. Please enter IP manually.');
    }
  },

  // Auth - Create user (requires link button)
  async createUser(bridgeIp, appName = 'hue_control_app') {
    logger.info('createUser: sending pair request', { bridgeIp });
    const { data } = await api.post('/v1/auth/pair', { bridgeIp, appName });
    logger.info('createUser: received response', { username: data.username });
    return data.username;
  },

  // Auth - Connect with stored credentials
  async connect(bridgeIp) {
    logger.info('connect: trying stored credentials', { bridgeIp, demoMode: isDemoMode() });
    try {
      const { data } = await api.post('/v1/auth/connect', { bridgeIp });
      logger.info('connect: connected with stored credentials');
      return data;
    } catch (error) {
      if (error.data?.requiresPairing) {
        logger.info('connect: pairing required');
        throw new Error('PAIRING_REQUIRED');
      }
      throw new Error(error.data?.error || 'Failed to connect');
    }
  },

  // Auth - Check bridge status
  async checkBridgeStatus(bridgeIp) {
    try {
      const { data } = await api.get('/v1/auth/bridge-status', {
        params: { bridgeIp },
      });
      return data.hasCredentials;
    } catch {
      return false;
    }
  },

  // Auth - Create session
  async createSession(bridgeIp, username) {
    try {
      const { data } = await api.post('/v1/auth/session', { bridgeIp, username });
      return data;
    } catch (error) {
      throw new Error(error.data?.message || 'Failed to create session');
    }
  },

  // Dashboard
  getDashboard: (token) => api.get('/v1/dashboard', authHeader(token)).then((r) => r.data),

  // Motion zones
  getMotionZones: (token) => api.get('/v1/motion-zones', authHeader(token)).then((r) => r.data),

  // Light control
  updateLight: (token, lightId, state) =>
    api.put(`/v1/lights/${lightId}`, state, authHeader(token)).then((r) => r.data),

  // Room control
  updateRoomLights: (token, roomId, state) =>
    api.put(`/v1/rooms/${roomId}/lights`, state, authHeader(token)).then((r) => r.data),

  // Zone control
  updateZoneLights: (token, zoneId, state) =>
    api.put(`/v1/zones/${zoneId}/lights`, state, authHeader(token)).then((r) => r.data),

  // Scene activation
  activateSceneV1: (token, sceneId) =>
    api.post(`/v1/scenes/${sceneId}/activate`, null, authHeader(token)).then((r) => r.data),

  // Session management
  refreshSession: (token) => api.post('/v1/auth/refresh', null, authHeader(token)).then((r) => r.data),

  revokeSession: (token) => api.delete('/v1/auth/session', authHeader(token)).then((r) => r.data),

  // Settings
  getSettings: (token) => api.get('/v1/settings', authHeader(token)).then((r) => r.data),

  updateSettings: (token, settings) =>
    api.put('/v1/settings', settings, authHeader(token)).then((r) => r.data),

  updateLocation: (token, location) =>
    api.put('/v1/settings/location', location, authHeader(token)).then((r) => r.data),

  clearLocation: (token) => api.delete('/v1/settings/location', authHeader(token)).then((r) => r.data),

  // Weather
  getWeather: (token) => api.get('/v1/weather', authHeader(token)).then((r) => r.data),
};
