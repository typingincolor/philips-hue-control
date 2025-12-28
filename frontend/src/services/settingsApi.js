/**
 * Settings API - Client for the V2 Settings API
 */

import { getHeaders, handleResponse } from './apiUtils';

const API_BASE = '/api/v2/settings';

/**
 * Get current settings
 * @param {boolean} demoMode - Whether demo mode is enabled
 * @returns {Promise<Object>} Settings object
 */
export async function getSettings(demoMode = false) {
  const response = await fetch(API_BASE, {
    method: 'GET',
    headers: getHeaders({ demoMode }),
  });

  return handleResponse(response);
}

/**
 * Update settings
 * @param {Object} updates - Settings to update
 * @param {boolean} demoMode - Whether demo mode is enabled
 * @returns {Promise<Object>} Updated settings
 */
export async function updateSettings(updates, demoMode = false) {
  const response = await fetch(API_BASE, {
    method: 'PUT',
    headers: getHeaders({ demoMode }),
    body: JSON.stringify(updates),
  });

  return handleResponse(response);
}

/**
 * Update location
 * @param {Object} location - Location object { lat, lon, name? }
 * @param {boolean} demoMode - Whether demo mode is enabled
 * @returns {Promise<Object>} Updated location
 */
export async function updateLocation(location, demoMode = false) {
  const response = await fetch(`${API_BASE}/location`, {
    method: 'PUT',
    headers: getHeaders({ demoMode }),
    body: JSON.stringify(location),
  });

  return handleResponse(response);
}

/**
 * Clear location
 * @param {boolean} demoMode - Whether demo mode is enabled
 * @returns {Promise<Object>} Result { success: boolean }
 */
export async function clearLocation(demoMode = false) {
  const response = await fetch(`${API_BASE}/location`, {
    method: 'DELETE',
    headers: getHeaders({ demoMode }),
  });

  return handleResponse(response);
}
