import { useEffect, useState } from 'react';
import { X, MapPin, Spinner } from './Icons';
import { UI_TEXT } from '../../constants/uiText';

/**
 * Settings drawer component for weather and Hive configuration
 * Allows location detection, temperature unit selection, and Hive connection
 */
export const SettingsDrawer = ({
  isOpen,
  onClose,
  location,
  settings,
  onUpdateSettings,
  onDetectLocation,
  isDetecting,
  locationError,
  hiveConnected,
  hiveConnecting,
  hiveError,
  onHiveConnect,
  onHiveDisconnect,
}) => {
  const [hiveUsername, setHiveUsername] = useState('');
  const [hivePassword, setHivePassword] = useState('');
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const { units = 'celsius' } = settings || {};

  return (
    <>
      <div
        className="settings-drawer-overlay"
        onClick={onClose}
        data-testid="settings-drawer-overlay"
      />
      <div className="settings-drawer">
        <div className="settings-drawer-header">
          <h3 className="settings-drawer-title">{UI_TEXT.SETTINGS_TITLE}</h3>
          <button className="settings-drawer-close" onClick={onClose} aria-label="close">
            <X size={20} />
          </button>
        </div>

        <div className="settings-drawer-content">
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
              >
                {isDetecting ? (
                  <>
                    <Spinner size={14} />
                    <span>{UI_TEXT.SETTINGS_DETECTING}</span>
                  </>
                ) : (
                  <span>{UI_TEXT.SETTINGS_DETECT_LOCATION}</span>
                )}
              </button>
            </div>
            {locationError && <div className="settings-error">{locationError}</div>}
          </div>

          {/* Units Section */}
          <div className="settings-section">
            <div className="settings-section-label">{UI_TEXT.SETTINGS_UNITS}</div>
            <div className="settings-units">
              <button
                className={`settings-unit-btn ${units === 'celsius' ? 'selected' : ''}`}
                onClick={() => onUpdateSettings({ units: 'celsius' })}
              >
                {UI_TEXT.SETTINGS_CELSIUS}
              </button>
              <button
                className={`settings-unit-btn ${units === 'fahrenheit' ? 'selected' : ''}`}
                onClick={() => onUpdateSettings({ units: 'fahrenheit' })}
              >
                {UI_TEXT.SETTINGS_FAHRENHEIT}
              </button>
            </div>
          </div>

          {/* Hive Section */}
          <div className="settings-section">
            <div className="settings-section-label">{UI_TEXT.SETTINGS_HIVE}</div>
            {hiveConnected ? (
              <div className="settings-hive-connected">
                <span className="settings-hive-status">{UI_TEXT.HIVE_CONNECTED}</span>
                <button className="settings-hive-btn" onClick={onHiveDisconnect}>
                  {UI_TEXT.HIVE_DISCONNECT}
                </button>
              </div>
            ) : (
              <div className="settings-hive-login">
                <input
                  type="text"
                  className="settings-hive-input"
                  placeholder={UI_TEXT.HIVE_USERNAME_PLACEHOLDER}
                  value={hiveUsername}
                  onChange={(e) => setHiveUsername(e.target.value)}
                  autoComplete="email"
                  disabled={hiveConnecting}
                />
                <input
                  type="password"
                  className="settings-hive-input"
                  placeholder={UI_TEXT.HIVE_PASSWORD_PLACEHOLDER}
                  value={hivePassword}
                  onChange={(e) => setHivePassword(e.target.value)}
                  disabled={hiveConnecting}
                />
                <button
                  className="settings-hive-btn"
                  onClick={() => onHiveConnect(hiveUsername, hivePassword)}
                  disabled={hiveConnecting}
                >
                  {hiveConnecting ? UI_TEXT.HIVE_CONNECTING : UI_TEXT.HIVE_CONNECT}
                </button>
                {hiveError && <div className="settings-error">{hiveError}</div>}
              </div>
            )}
          </div>
        </div>

        <div className="settings-drawer-footer">
          <span className="settings-auto-saved">{UI_TEXT.SETTINGS_AUTO_SAVED}</span>
        </div>
      </div>
    </>
  );
};
