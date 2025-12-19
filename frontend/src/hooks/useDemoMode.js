import { useState } from 'react';

/**
 * Hook to determine if demo mode is active
 * Demo mode is enabled via URL parameter ?demo=true
 * @returns {boolean} True if demo mode is active
 */
export const useDemoMode = () => {
  const [isDemoMode] = useState(() =>
    new URLSearchParams(window.location.search).get('demo') === 'true'
  );
  return isDemoMode;
};
