import { createContext, useContext, useMemo } from 'react';
import { hueApi } from '../services/hueApi';
import { mockApi } from '../services/mockApi';

/**
 * Demo location for demo mode (London)
 */
const DEMO_LOCATION = {
  lat: 51.5074,
  lon: -0.1278,
  name: 'London',
};

/**
 * Context for demo mode state and services
 */
const DemoModeContext = createContext(null);

/**
 * Detect if demo mode is enabled from URL
 * @returns {boolean} True if URL has ?demo=true
 */
const detectDemoMode = () => {
  return new URLSearchParams(window.location.search).get('demo') === 'true';
};

/**
 * Provider component for demo mode context
 * Centralizes all demo-specific behavior and provides appropriate services
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Child components
 */
export const DemoModeProvider = ({ children }) => {
  const value = useMemo(() => {
    const isDemoMode = detectDemoMode();

    return {
      // Whether demo mode is active
      isDemoMode,
      // API to use (mockApi in demo mode, hueApi otherwise)
      api: isDemoMode ? mockApi : hueApi,
      // Demo location (London) for demo mode, null otherwise
      demoLocation: isDemoMode ? DEMO_LOCATION : null,
      // Motion subscription function for demo mode simulation
      subscribeToMotion: isDemoMode ? mockApi.subscribeToMotion : null,
    };
  }, []);

  return <DemoModeContext.Provider value={value}>{children}</DemoModeContext.Provider>;
};

/**
 * Hook to access demo mode context
 * Must be used within a DemoModeProvider
 *
 * @returns {object} Demo mode context value
 * @property {boolean} isDemoMode - Whether demo mode is active
 * @property {object} api - The API to use (mockApi or hueApi)
 * @property {object|null} demoLocation - Demo location object or null
 * @property {function|null} subscribeToMotion - Motion subscription function or null
 */
export const useDemoMode = () => {
  const context = useContext(DemoModeContext);
  if (context === null) {
    throw new Error('useDemoMode must be used within a DemoModeProvider');
  }
  return context;
};
