/**
 * Device Normalizer - Converts service-specific device data to unified format
 */

import { createDevice, DeviceTypes } from '../models/Device.js';
import slugMappingService from './slugMappingService.js';

/**
 * Normalize a Hue light to unified device format
 * @param {Object} hueLight - Hue API light object
 * @returns {Object} Normalized device
 */
export function normalizeHueLight(hueLight) {
  const state = {
    on: hueLight.on?.on ?? false,
    brightness: hueLight.dimming?.brightness ?? 0,
  };

  // Add color if present
  if (hueLight.color?.xy) {
    state.color = xyToHex(hueLight.color.xy);
  }

  // Add color temperature if present
  if (hueLight.color_temperature?.mirek) {
    state.colorTemperature = hueLight.color_temperature.mirek;
  }

  // Determine capabilities
  const capabilities = ['on'];
  if (hueLight.dimming) {
    capabilities.push('dimming');
  }
  if (hueLight.color) {
    capabilities.push('color');
  }
  if (hueLight.color_temperature) {
    capabilities.push('colorTemperature');
  }

  const name = hueLight.metadata?.name || 'Light';
  const slug = slugMappingService.getSlug('hue', hueLight.id, name);

  const device = createDevice({
    id: slug,
    name,
    type: DeviceTypes.LIGHT,
    serviceId: 'hue',
    state,
    capabilities,
  });

  // Preserve original UUID for reference (internal use only)
  device._uuid = hueLight.id;

  return device;
}

/**
 * Normalize Hive heating status to unified thermostat device
 * @param {Object} hiveHeating - Hive heating status object
 * @returns {Object} Normalized thermostat device
 */
export function normalizeHiveThermostat(hiveHeating) {
  const state = {
    currentTemperature: hiveHeating.currentTemperature,
    targetTemperature: hiveHeating.targetTemperature ?? null,
    isHeating: hiveHeating.isHeating ?? false,
    mode: hiveHeating.mode ?? 'off',
  };

  const capabilities = ['temperature', 'targetTemperature', 'mode'];

  const device = createDevice({
    id: 'heating',
    name: 'Central Heating',
    type: DeviceTypes.THERMOSTAT,
    serviceId: 'hive',
    state,
    capabilities,
  });

  return device;
}

/**
 * Normalize Hive hot water status to unified device
 * @param {Object} hiveHotWater - Hive hot water status object
 * @returns {Object} Normalized hot water device
 */
export function normalizeHiveHotWater(hiveHotWater) {
  const state = {
    isOn: hiveHotWater.isOn ?? false,
    mode: hiveHotWater.mode ?? 'off',
  };

  const capabilities = ['on', 'mode'];

  const device = createDevice({
    id: 'hotwater',
    name: 'Hot Water',
    type: DeviceTypes.HOT_WATER,
    serviceId: 'hive',
    state,
    capabilities,
  });

  return device;
}

/**
 * Normalize a dashboard light object to unified device format
 * @param {Object} light - Dashboard light object (pre-processed format from enrichLight)
 * @returns {Object} Normalized device
 */
export function normalizeDashboardLight(light) {
  // Light is already enriched with slug as id and _uuid from enrichLight()
  // Do NOT call slugMappingService.getSlug() here - it would create corrupt mappings
  const device = createDevice({
    id: light.id,
    name: light.name,
    type: DeviceTypes.LIGHT,
    serviceId: 'hue',
    state: {
      on: light.on ?? false,
      brightness: light.brightness ?? 0,
      color: light.color || null,
    },
    capabilities: ['on', 'dimming', 'color'],
  });

  // Preserve original UUID for reference (internal use only)
  device._uuid = light._uuid;

  return device;
}

/**
 * Convert XY color coordinates to hex color
 * @param {Object} xy - XY color coordinates
 * @returns {string} Hex color string
 */
function xyToHex(xy) {
  // Simplified XY to RGB conversion
  const x = xy.x || 0.5;
  const y = xy.y || 0.5;
  const z = 1.0 - x - y;

  const Y = 1.0;
  const X = (Y / y) * x;
  const Z = (Y / y) * z;

  // XYZ to RGB
  let r = X * 1.656492 - Y * 0.354851 - Z * 0.255038;
  let g = -X * 0.707196 + Y * 1.655397 + Z * 0.036152;
  let b = X * 0.051713 - Y * 0.121364 + Z * 1.01153;

  // Clamp and gamma correct
  r = Math.max(0, Math.min(1, r));
  g = Math.max(0, Math.min(1, g));
  b = Math.max(0, Math.min(1, b));

  // Convert to hex
  const toHex = (val) =>
    Math.round(val * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
