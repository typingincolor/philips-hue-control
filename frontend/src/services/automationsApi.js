/**
 * Automations API - Client for the V2 Automations API
 */

import { getHeaders, handleResponse } from './apiUtils';

const API_BASE = '/api/v2/automations';

/**
 * Get all automations
 * @param {boolean} demoMode - Whether demo mode is enabled
 * @returns {Promise<Array>} Array of automations
 */
export async function getAutomations(demoMode = false) {
  const response = await fetch(API_BASE, {
    method: 'GET',
    headers: getHeaders({ demoMode }),
  });

  return handleResponse(response);
}

/**
 * Trigger an automation
 * @param {string} automationId - Automation ID
 * @param {boolean} demoMode - Whether demo mode is enabled
 * @returns {Promise<Object>} Result { success, affectedLights }
 */
export async function triggerAutomation(automationId, demoMode = false) {
  const response = await fetch(`${API_BASE}/${automationId}/trigger`, {
    method: 'POST',
    headers: getHeaders({ demoMode }),
  });

  return handleResponse(response, {
    errorMap: {
      404: 'Automation not found',
    },
  });
}
