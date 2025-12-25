import { createContext, useContext, useMemo } from 'react';
import { hueApi } from '../services/hueApi';

/**
 * Context for demo mode state and services
 * Demo mode is now handled by backend via X-Demo-Mode header
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
 * Demo mode is handled by the backend - frontend just detects mode for UI badge
 * and passes X-Demo-Mode header (handled automatically by hueApi)
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Child components
 */
export const DemoModeProvider = ({ children }) => {
  const value = useMemo(() => {
    const isDemoMode = detectDemoMode();

    return {
      // Whether demo mode is active (for UI badge display)
      isDemoMode,
      // Always use hueApi - it sends X-Demo-Mode header when in demo mode
      api: hueApi,
    };
  }, []);

  return <DemoModeContext.Provider value={value}>{children}</DemoModeContext.Provider>;
};

/**
 * Hook to access demo mode context
 * Must be used within a DemoModeProvider
 *
 * @returns {object} Demo mode context value
 * @property {boolean} isDemoMode - Whether demo mode is active (for UI display)
 * @property {object} api - The API to use (always hueApi, which handles demo mode via header)
 */
export const useDemoMode = () => {
  const context = useContext(DemoModeContext);
  if (context === null) {
    throw new Error('useDemoMode must be used within a DemoModeProvider');
  }
  return context;
};
