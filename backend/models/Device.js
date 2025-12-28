/**
 * Device Model - Unified device representation across services
 */

export const DeviceTypes = {
  LIGHT: 'light',
  THERMOSTAT: 'thermostat',
  HOT_WATER: 'hotWater',
  SENSOR: 'sensor',
};

const VALID_TYPES = Object.values(DeviceTypes);

/**
 * Create a globally unique device ID
 * @param {string} serviceId - Service identifier (hue, hive, etc.)
 * @param {string} deviceId - Service-specific device ID
 * @returns {string} Globally unique ID in format 'serviceId:deviceId'
 */
export function normalizeDeviceId(serviceId, deviceId) {
  return `${serviceId}:${deviceId}`;
}

/**
 * Create a normalized device object
 * @param {Object} params - Device parameters
 * @param {string} params.id - Service-specific device ID
 * @param {string} params.name - Device display name
 * @param {string} params.type - Device type from DeviceTypes
 * @param {string} params.serviceId - Service identifier
 * @param {Object} params.state - Device state object
 * @param {string[]} [params.capabilities] - Optional capabilities array
 * @returns {Object} Normalized device object
 */
export function createDevice({ id, name, type, serviceId, state = {}, capabilities = [] }) {
  if (!id) {
    throw new Error('Device id is required');
  }
  if (!name) {
    throw new Error('Device name is required');
  }
  if (!type) {
    throw new Error('Device type is required');
  }
  if (!VALID_TYPES.includes(type)) {
    throw new Error(`Invalid device type: ${type}`);
  }

  return {
    id: normalizeDeviceId(serviceId, id),
    name,
    type,
    serviceId,
    state,
    capabilities,
  };
}
