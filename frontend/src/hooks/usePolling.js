import { useEffect } from 'react';

/**
 * Hook to poll a callback function at a regular interval
 * @param {Function} callback - Function to call on each interval
 * @param {number} interval - Interval in milliseconds
 * @param {boolean} enabled - Whether polling is enabled
 */
export const usePolling = (callback, interval, enabled) => {
  useEffect(() => {
    if (!enabled) return;

    const intervalId = setInterval(callback, interval);
    return () => clearInterval(intervalId);
  }, [callback, interval, enabled]);
};
