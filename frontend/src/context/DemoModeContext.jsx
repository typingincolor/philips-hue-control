import { createContext, useContext, useMemo } from 'react';

/**
 * Context for demo mode state
 * Demo mode is handled by backend via X-Demo-Mode header
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
 * API modules pass X-Demo-Mode header when needed
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
 */
export const useDemoMode = () => {
  const context = useContext(DemoModeContext);
  if (context === null) {
    throw new Error('useDemoMode must be used within a DemoModeProvider');
  }
  return context;
};
