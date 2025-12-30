import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { MapPin, LocateFixed, Spinner, X } from './Icons';
import { UI_TEXT } from '../../constants/uiText';

/**
 * Service Toggle component with proper checkbox for accessibility and testing
 */
const ServiceToggle = ({ label, checked, onChange, connected }) => (
  <label className="service-toggle">
    <span className="service-toggle-label">{label}</span>
    <input
      type="checkbox"
      role="switch"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
    <span className="service-toggle-switch">
      <span className="service-toggle-thumb" />
    </span>
    {connected !== undefined && (
      <span
        className={`service-status ${connected ? 'connected' : 'disconnected'}`}
        title={connected ? 'Connected' : 'Disconnected'}
      />
    )}
  </label>
);

ServiceToggle.propTypes = {
  label: PropTypes.string.isRequired,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  connected: PropTypes.bool,
};

/**
 * Settings page component (full page, replaces main panel)
 */
export const SettingsPage = ({
  onBack,
  location,
  settings,
  onUpdateSettings,
  onDetectLocation,
  isDetecting,
  locationError,
  hueConnected,
  hiveConnected,
  onEnableHue,
  onEnableHive,
  onDisableHue,
  onDisableHive,
}) => {
  // Only show close button if at least one service is connected (there's somewhere to go back to)
  const canClose = hueConnected || hiveConnected;

  // Close on Escape key (only if close is allowed)
  useEffect(() => {
    if (!canClose) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onBack();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onBack, canClose]);

  const { units = 'celsius', services = {} } = settings || {};
  const hueEnabled = services?.hue?.enabled ?? true;
  const hiveEnabled = services?.hive?.enabled ?? false;

  const handleServiceToggle = (service, enabled) => {
    // When enabling a disconnected service, call the enable callback instead
    if (enabled) {
      if (service === 'hue' && !hueConnected && onEnableHue) {
        onEnableHue();
        return;
      }
      if (service === 'hive' && !hiveConnected && onEnableHive) {
        onEnableHive();
        return;
      }
    } else {
      // When disabling, call disable callback to clear credentials
      if (service === 'hue' && onDisableHue) {
        onDisableHue();
        return;
      }
      if (service === 'hive' && onDisableHive) {
        onDisableHive();
        return;
      }
    }
    // Fallback: update settings directly (when callbacks not provided)
    onUpdateSettings({
      services: { [service]: { enabled } },
    });
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h2 className="settings-header-title">{UI_TEXT.SETTINGS_TITLE}</h2>
        {canClose && (
          <button className="settings-close-btn" onClick={onBack} aria-label="close">
            <X size={24} />
          </button>
        )}
      </div>

      <div className="settings-content">
        {/* Services Section */}
        <div className="settings-section">
          <div className="settings-section-label">{UI_TEXT.SETTINGS_SERVICES}</div>
          <div className="settings-services">
            <ServiceToggle
              label={UI_TEXT.SETTINGS_HUE_SERVICE}
              checked={hueEnabled}
              onChange={(enabled) => handleServiceToggle('hue', enabled)}
              connected={hueConnected}
            />
            <ServiceToggle
              label={UI_TEXT.SETTINGS_HIVE_SERVICE}
              checked={hiveEnabled}
              onChange={(enabled) => handleServiceToggle('hive', enabled)}
              connected={hiveConnected}
            />
          </div>
        </div>

        {/* Location Section */}
        <div className="settings-section">
          <div className="settings-section-label">{UI_TEXT.SETTINGS_LOCATION}</div>
          <div className="settings-location">
            <div className="settings-location-current">
              <MapPin size={16} />
              <span>{location?.name || UI_TEXT.WEATHER_SET_LOCATION}</span>
            </div>
            <button
              className="settings-detect-btn"
              onClick={onDetectLocation}
              disabled={isDetecting}
              aria-label={UI_TEXT.SETTINGS_DETECT_LOCATION}
              title={UI_TEXT.SETTINGS_DETECT_LOCATION}
            >
              {isDetecting ? <Spinner size={18} /> : <LocateFixed size={18} />}
            </button>
          </div>
          {locationError && <div className="settings-error">{locationError}</div>}
        </div>

        {/* Units Section */}
        <div className="settings-section">
          <div className="settings-section-label">{UI_TEXT.SETTINGS_UNITS}</div>
          <label className="settings-units-toggle">
            <span className="units-label-left">℉</span>
            <input
              type="checkbox"
              role="switch"
              checked={units === 'celsius'}
              onChange={(e) =>
                onUpdateSettings({ units: e.target.checked ? 'celsius' : 'fahrenheit' })
              }
            />
            <span className="units-toggle-switch">
              <span className="units-toggle-thumb" />
            </span>
            <span className="units-label-right">℃</span>
          </label>
        </div>
      </div>

      <div className="settings-footer">
        <span className="settings-auto-saved">{UI_TEXT.SETTINGS_AUTO_SAVED}</span>
      </div>
    </div>
  );
};

SettingsPage.propTypes = {
  onBack: PropTypes.func.isRequired,
  location: PropTypes.shape({
    lat: PropTypes.number,
    lon: PropTypes.number,
    name: PropTypes.string,
  }),
  settings: PropTypes.shape({
    units: PropTypes.oneOf(['celsius', 'fahrenheit']),
    services: PropTypes.shape({
      hue: PropTypes.shape({ enabled: PropTypes.bool }),
      hive: PropTypes.shape({ enabled: PropTypes.bool }),
    }),
  }),
  onUpdateSettings: PropTypes.func.isRequired,
  onDetectLocation: PropTypes.func.isRequired,
  isDetecting: PropTypes.bool,
  locationError: PropTypes.string,
  hueConnected: PropTypes.bool,
  hiveConnected: PropTypes.bool,
  onEnableHue: PropTypes.func,
  onEnableHive: PropTypes.func,
  onDisableHue: PropTypes.func,
  onDisableHive: PropTypes.func,
};
