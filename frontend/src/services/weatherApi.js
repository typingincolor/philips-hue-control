/**
 * Weather API - Client for the V2 Weather API
 */

import { getHeaders, handleResponse } from './apiUtils';

const API_BASE = '/api/v2/weather';

/**
 * Get weather for configured location
 * @param {boolean} demoMode - Whether demo mode is enabled
 * @returns {Promise<Object>} Weather data
 */
export async function getWeather(demoMode = false) {
  const response = await fetch(API_BASE, {
    method: 'GET',
    headers: getHeaders({ demoMode }),
  });

  return handleResponse(response, {
    errorMap: {
      404: 'No location configured',
      503: 'Weather service unavailable',
    },
  });
}
