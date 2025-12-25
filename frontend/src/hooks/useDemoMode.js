import { useDemoMode as useDemoModeContext } from '../context/DemoModeContext';

/**
 * Hook to determine if demo mode is active
 * Demo mode is enabled via URL parameter ?demo=true
 *
 * This is a backwards-compatible wrapper around the DemoModeContext.
 * It returns just the boolean for compatibility with existing code.
 *
 * @returns {boolean} True if demo mode is active
 */
export const useDemoMode = () => {
  const { isDemoMode } = useDemoModeContext();
  return isDemoMode;
};
