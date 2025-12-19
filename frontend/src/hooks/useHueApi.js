import { useDemoMode } from './useDemoMode';
import { hueApi } from '../services/hueApi';
import { mockApi } from '../services/mockData';

/**
 * Hook to get the appropriate API (real or mock) based on demo mode
 * @returns {Object} API object (hueApi or mockApi)
 */
export const useHueApi = () => {
  const isDemoMode = useDemoMode();
  return isDemoMode ? mockApi : hueApi;
};
