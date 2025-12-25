/**
 * HueClient Factory
 * Returns the appropriate HueClient instance based on request context
 */

import hueClient from './hueClient.js';
import mockHueClient from './mockHueClient.js';
import { DEMO_BRIDGE_IP } from './mockData.js';

/**
 * Get the appropriate HueClient for the request
 * Returns MockHueClient for demo mode, real HueClient otherwise
 *
 * @param {object} req - Express request object with demoMode flag
 * @returns {object} HueClient or MockHueClient instance
 */
export function getHueClient(req) {
  if (req.demoMode) {
    return mockHueClient;
  }
  return hueClient;
}

/**
 * Get the appropriate HueClient for a bridge IP
 * Returns MockHueClient for demo bridge, real HueClient otherwise
 *
 * Used by services that don't have request context (e.g., WebSocket polling)
 *
 * @param {string} bridgeIp - Bridge IP address
 * @returns {object} HueClient or MockHueClient instance
 */
export function getHueClientForBridge(bridgeIp) {
  if (bridgeIp === DEMO_BRIDGE_IP) {
    return mockHueClient;
  }
  return hueClient;
}
