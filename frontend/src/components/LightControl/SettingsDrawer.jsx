import { useEffect } from 'react';
import { X, MapPin, Spinner } from './Icons';
import { UI_TEXT } from '../../constants/uiText';

/**
 * Settings drawer component for weather configuration
 * Allows location detection and temperature unit selection
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
}) => {
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
        </div>

        <div className="settings-drawer-footer">
          <span className="settings-auto-saved">{UI_TEXT.SETTINGS_AUTO_SAVED}</span>
        </div>
      </div>
    </>
  );
};
