import { useState } from 'react';
import PropTypes from 'prop-types';
import { UI_TEXT } from '../../constants/uiText';
import { Logout, LightbulbOn, Home, Grid, Settings } from './Icons';
import { WeatherDisplay } from './WeatherDisplay';
import { WeatherTooltip } from './WeatherTooltip';
import { useDemoMode } from '../../context/DemoModeContext';

export const TopToolbar = ({
  summary = {},
  isConnected = true,
  isReconnecting = false,
  onLogout,
  // Weather props
  weather = null,
  weatherLoading = false,
  weatherError = null,
  location = null,
  units = 'celsius',
  onOpenSettings,
}) => {
  const { isDemoMode } = useDemoMode();
  const { lightsOn = 0, roomCount = 0, sceneCount = 0 } = summary;
  const [showWeatherTooltip, setShowWeatherTooltip] = useState(false);

  // Determine connection status text and style
  const getConnectionStatus = () => {
    if (isReconnecting) {
      return { text: 'Reconnecting...', className: 'reconnecting' };
    }
    if (!isConnected) {
      return { text: 'Disconnected', className: 'disconnected' };
    }
    return { text: UI_TEXT.STATUS_CONNECTED, className: '' };
  };

  const connectionStatus = getConnectionStatus();

  return (
    <div className="top-toolbar">
      <div className="toolbar-left">
        <button className="toolbar-settings" onClick={onOpenSettings} aria-label="settings">
          <Settings size={18} />
        </button>

        <div className="toolbar-divider" />

        <div className="toolbar-stat">
          <LightbulbOn size={16} className="toolbar-stat-icon" />
          <span className="toolbar-stat-value">{lightsOn}</span>
        </div>
        <div className="toolbar-stat">
          <Home size={16} className="toolbar-stat-icon" />
          <span className="toolbar-stat-value">{roomCount}</span>
        </div>
        <div className="toolbar-stat">
          <Grid size={16} className="toolbar-stat-icon" />
          <span className="toolbar-stat-value">{sceneCount}</span>
        </div>
      </div>

      <div className="toolbar-center"></div>

      <div className="toolbar-right">
        {/* Weather display */}
        <div
          className="toolbar-weather-container"
          onMouseEnter={() => setShowWeatherTooltip(true)}
          onMouseLeave={() => setShowWeatherTooltip(false)}
        >
          <WeatherDisplay
            weather={weather}
            location={location}
            isLoading={weatherLoading}
            error={weatherError}
            units={units}
            onClick={onOpenSettings}
          />
          {showWeatherTooltip && weather && location && (
            <WeatherTooltip weather={weather} location={location} units={units} />
          )}
        </div>

        <div className="toolbar-divider" />

        {isDemoMode && (
          <span className="toolbar-status" style={{ color: 'var(--accent-primary)' }}>
            {UI_TEXT.LABEL_DEMO_MODE}
          </span>
        )}
        <div className="toolbar-status">
          <span className={`toolbar-status-dot ${connectionStatus.className}`} />
          <span>{connectionStatus.text}</span>
        </div>
        <button className="toolbar-logout" onClick={onLogout}>
          <Logout size={16} />
        </button>
      </div>
    </div>
  );
};

TopToolbar.propTypes = {
  summary: PropTypes.shape({
    lightsOn: PropTypes.number,
    roomCount: PropTypes.number,
    sceneCount: PropTypes.number,
  }),
  isConnected: PropTypes.bool,
  isReconnecting: PropTypes.bool,
  onLogout: PropTypes.func.isRequired,
  // Weather props
  weather: PropTypes.shape({
    current: PropTypes.shape({
      temperature: PropTypes.number,
      condition: PropTypes.string,
      windSpeed: PropTypes.number,
    }),
    forecast: PropTypes.arrayOf(
      PropTypes.shape({
        date: PropTypes.string,
        condition: PropTypes.string,
        high: PropTypes.number,
        low: PropTypes.number,
      })
    ),
  }),
  weatherLoading: PropTypes.bool,
  weatherError: PropTypes.string,
  location: PropTypes.shape({
    lat: PropTypes.number,
    lon: PropTypes.number,
    name: PropTypes.string,
  }),
  units: PropTypes.oneOf(['celsius', 'fahrenheit']),
  onOpenSettings: PropTypes.func,
};
