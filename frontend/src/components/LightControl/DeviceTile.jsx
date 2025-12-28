/**
 * DeviceTile Component - Universal device tile for the unified Home model
 * Supports lights, thermostats, and hot water devices
 */

import PropTypes from 'prop-types';
import './DeviceTile.css';

/**
 * Determine if a device is "on" based on its type
 */
function isDeviceOn(device) {
  switch (device.type) {
    case 'light':
      return device.state?.on === true;
    case 'hotWater':
      return device.state?.isOn === true;
    case 'thermostat':
      return device.state?.isHeating === true;
    default:
      return false;
  }
}

/**
 * Get CSS classes for the device tile
 */
function getTileClasses(device, isUpdating) {
  const classes = ['device-tile', `device-tile-${device.type}`];

  if (isUpdating) {
    classes.push('toggling');
  }

  if (device.type === 'thermostat') {
    if (device.state?.isHeating) {
      classes.push('heating');
    }
  } else {
    // Light or hot water
    const isOn = isDeviceOn(device);
    classes.push(isOn ? 'on' : 'off');
  }

  return classes.join(' ');
}

export function DeviceTile({
  device,
  onToggle,
  onUpdate,
  isUpdating = false,
  showServiceBadge = false,
}) {
  const handleClick = () => {
    if (isUpdating) return;

    if (device.type === 'thermostat' && onUpdate) {
      onUpdate(device.id);
    } else if (onToggle) {
      onToggle(device.id);
    }
  };

  const renderLightContent = () => {
    const brightness = device.state?.brightness ?? 0;

    return (
      <>
        <div className="device-tile-fill" style={{ height: `${brightness}%` }} />
        <span className="device-tile-name">{device.name}</span>
      </>
    );
  };

  const renderThermostatContent = () => {
    const currentTemp = device.state?.currentTemperature;
    const targetTemp = device.state?.targetTemperature;
    const mode = device.state?.mode;

    return (
      <>
        <span className="device-tile-name">{device.name}</span>
        <div className="device-tile-temps">
          {currentTemp !== undefined && <span className="current-temp">{currentTemp}°</span>}
          {targetTemp !== undefined && <span className="target-temp">{targetTemp}°</span>}
        </div>
        {mode && <span className="device-tile-mode">{mode}</span>}
      </>
    );
  };

  const renderHotWaterContent = () => {
    return (
      <>
        <span className="device-tile-name">{device.name}</span>
      </>
    );
  };

  const renderContent = () => {
    switch (device.type) {
      case 'light':
        return renderLightContent();
      case 'thermostat':
        return renderThermostatContent();
      case 'hotWater':
        return renderHotWaterContent();
      default:
        return <span className="device-tile-name">{device.name}</span>;
    }
  };

  return (
    <button
      className={getTileClasses(device, isUpdating)}
      onClick={handleClick}
      disabled={isUpdating}
      aria-label={device.name}
    >
      {renderContent()}
      {showServiceBadge && <span className="device-tile-service">{device.serviceId}</span>}
    </button>
  );
}

DeviceTile.propTypes = {
  device: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['light', 'thermostat', 'hotWater', 'sensor']).isRequired,
    serviceId: PropTypes.string.isRequired,
    state: PropTypes.object,
  }).isRequired,
  onToggle: PropTypes.func,
  onUpdate: PropTypes.func,
  isUpdating: PropTypes.bool,
  showServiceBadge: PropTypes.bool,
};
