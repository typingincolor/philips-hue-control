/**
 * Home API - Client for the unified Home abstraction API
 */

import { getHeaders, handleResponse } from './apiUtils';

const API_BASE = '/api/v2/home';

/**
 * Get the full home structure
 * @param {boolean} demoMode - Whether demo mode is enabled
 * @returns {Promise<Object>} Home object with rooms, devices, zones, and summary
 */
export async function getHome(demoMode = false) {
  const response = await fetch(API_BASE, {
    method: 'GET',
    headers: getHeaders({ demoMode }),
  });
  return handleResponse(response);
}

/**
 * Get home-level devices
 * @param {boolean} demoMode - Whether demo mode is enabled
 * @returns {Promise<Array>} Array of home-level devices
 */
export async function getHomeDevices(demoMode = false) {
  const response = await fetch(`${API_BASE}/devices`, {
    method: 'GET',
    headers: getHeaders({ demoMode }),
  });
  return handleResponse(response);
}

/**
 * Update a device state
 * @param {string} deviceId - Device ID in format 'serviceId:originalId'
 * @param {Object} state - New state to apply
 * @param {boolean} demoMode - Whether demo mode is enabled
 * @returns {Promise<Object>} Result object
 */
export async function updateDevice(deviceId, state, demoMode = false) {
  const response = await fetch(`${API_BASE}/devices/${deviceId}`, {
    method: 'PUT',
    headers: getHeaders({ demoMode }),
    body: JSON.stringify(state),
  });
  return handleResponse(response);
}

/**
 * Activate a scene
 * @param {string} sceneId - Scene ID in format 'serviceId:originalId'
 * @param {boolean} demoMode - Whether demo mode is enabled
 * @returns {Promise<Object>} Result object with success and lightsAffected
 */
export async function activateScene(sceneId, demoMode = false) {
  const response = await fetch(`${API_BASE}/scenes/${sceneId}/activate`, {
    method: 'POST',
    headers: getHeaders({ demoMode }),
  });
  return handleResponse(response);
}

/**
 * Update all devices in a room
 * @param {string} roomId - Room ID
 * @param {Object} state - New state to apply
 * @param {boolean} demoMode - Whether demo mode is enabled
 * @returns {Promise<Object>} Result object with updatedLights
 */
export async function updateRoomDevices(roomId, state, demoMode = false) {
  const response = await fetch(`${API_BASE}/rooms/${roomId}/devices`, {
    method: 'PUT',
    headers: getHeaders({ demoMode }),
    body: JSON.stringify(state),
  });
  return handleResponse(response);
}

/**
 * Update all devices in a zone
 * @param {string} zoneId - Zone ID
 * @param {Object} state - New state to apply
 * @param {boolean} demoMode - Whether demo mode is enabled
 * @returns {Promise<Object>} Result object with updatedLights
 */
export async function updateZoneDevices(zoneId, state, demoMode = false) {
  const response = await fetch(`${API_BASE}/zones/${zoneId}/devices`, {
    method: 'PUT',
    headers: getHeaders({ demoMode }),
    body: JSON.stringify(state),
  });
  return handleResponse(response);
}
