/**
 * Hue API - Minimal client for bridge discovery
 *
 * Note: Most functionality has been migrated to V2 APIs:
 * - Auth operations: authApi.js
 * - Home/Dashboard: homeApi.js, homeAdapter.js
 * - Settings: settingsApi.js
 * - Weather: weatherApi.js
 * - Automations: automationsApi.js
 * - Services (Hue, Hive): servicesApi.js
 */

import axios from 'axios';
import { createLogger } from '../utils/logger';

const logger = createLogger('HueApi');

// Create axios instance with defaults
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const hueApi = {
  // Discovery - finds Hue bridges on the network
  async discoverBridge() {
    try {
      const { data } = await api.get('/discovery');
      return data;
    } catch (error) {
      logger.error('Bridge discovery error:', error);
      throw new Error('Could not discover bridges. Please enter IP manually.');
    }
  },
};
