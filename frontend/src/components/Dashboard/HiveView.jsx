import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { UI_TEXT } from '../../constants/uiText';
import { Spinner } from './Icons';

export const HiveView = ({
  // Connection state
  isConnected = true,
  status,
  schedules = [],
  isLoading = false,
  error = null,
  onRetry,

  // Login props
  onConnect,
  onVerify2fa,
  onCancel2fa,
  onClearError,
  requires2fa = false,
  isConnecting = false,
  isVerifying = false,
  pendingUsername = '',
}) => {
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 2FA form state
  const [twoFaCode, setTwoFaCode] = useState('');
  const codeInputRef = useRef(null);

  // Clear error when user starts typing
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (onClearError) onClearError();
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (onClearError) onClearError();
  };

  const handleCodeChange = (e) => {
    setTwoFaCode(e.target.value);
    if (onClearError) onClearError();
  };

  // Handle login form submit
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (email && password && onConnect) {
      onConnect(email, password);
    }
  };

  // Handle 2FA form submit
  const handle2faSubmit = (e) => {
    e.preventDefault();
    if (twoFaCode && onVerify2fa) {
      onVerify2fa(twoFaCode);
    }
  };

  // Handle back to login
  const handleBackToLogin = () => {
    setTwoFaCode('');
    if (onCancel2fa) {
      onCancel2fa();
    }
  };

  // Focus 2FA code input when showing 2FA form
  useEffect(() => {
    if (requires2fa && codeInputRef.current) {
      codeInputRef.current.focus();
    }
  }, [requires2fa]);

  // Restore email when coming back from 2FA
  useEffect(() => {
    if (pendingUsername && !email) {
      setEmail(pendingUsername);
    }
  }, [pendingUsername, email]);

  // Show login form when not connected and not in 2FA mode
  if (!isConnected && !requires2fa) {
    return (
      <div className="hive-view">
        <div className="hive-login-form">
          <h2 className="hive-login-title">{UI_TEXT.HIVE_LOGIN_TITLE}</h2>

          {error && (
            <div className="hive-error" role="alert" aria-live="polite">
              {error}
            </div>
          )}

          <form onSubmit={handleLoginSubmit}>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={handleEmailChange}
              disabled={isConnecting}
              autoComplete="email"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={handlePasswordChange}
              disabled={isConnecting}
              autoComplete="current-password"
            />
            <button type="submit" disabled={isConnecting || !email || !password}>
              {isConnecting ? UI_TEXT.HIVE_CONNECTING : UI_TEXT.HIVE_CONNECT}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Show 2FA form when required
  if (requires2fa) {
    return (
      <div className="hive-view">
        <div className="hive-2fa-form">
          <h2 className="hive-2fa-title">{UI_TEXT.HIVE_2FA_TITLE}</h2>
          <p className="hive-2fa-description">{UI_TEXT.HIVE_2FA_DESCRIPTION}</p>

          {error && (
            <div className="hive-error" role="alert" aria-live="polite">
              {error}
            </div>
          )}

          <form onSubmit={handle2faSubmit}>
            <input
              ref={codeInputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder={UI_TEXT.HIVE_2FA_PLACEHOLDER}
              value={twoFaCode}
              onChange={handleCodeChange}
              disabled={isVerifying}
              autoComplete="one-time-code"
            />
            <button type="submit" disabled={isVerifying || twoFaCode.length !== 6}>
              {isVerifying ? UI_TEXT.HIVE_VERIFYING : UI_TEXT.HIVE_VERIFY}
            </button>
          </form>

          <button type="button" className="hive-back-link" onClick={handleBackToLogin}>
            {UI_TEXT.HIVE_BACK_TO_LOGIN}
          </button>
        </div>
      </div>
    );
  }

  // Loading state (for connected users)
  if (isLoading && !status) {
    return (
      <div className="hive-view">
        <div className="hive-loading">
          <Spinner size={24} />
          <span>{UI_TEXT.HIVE_LOADING}</span>
        </div>
      </div>
    );
  }

  // Error state (for connected users)
  if (error && !status) {
    return (
      <div className="hive-view">
        <div className="hive-error" role="alert" aria-live="polite">
          <span className="hive-error-message">{error}</span>
          <button className="hive-retry-btn" onClick={onRetry}>
            {UI_TEXT.RETRY}
          </button>
        </div>
      </div>
    );
  }

  // No status data
  if (!status) {
    return null;
  }

  const { heating, hotWater } = status;

  return (
    <div className="hive-view">
      {/* Thermostat Display */}
      <div className="hive-thermostat">
        <div className="hive-temp-display" aria-label={UI_TEXT.HIVE_CURRENT_TEMP}>
          <span className="hive-temp-value">{heating.currentTemperature}°</span>
          <span className="hive-mode-badge">{heating.mode}</span>
        </div>

        <div className="hive-status-indicators">
          <div
            className={`hive-status-indicator ${heating.isHeating ? 'active' : ''}`}
            aria-label={UI_TEXT.HIVE_HEATING_STATUS}
          >
            <HeatingIcon />
            <span>Heating</span>
          </div>
          <div
            className={`hive-status-indicator ${hotWater.isOn ? 'active' : ''}`}
            aria-label={UI_TEXT.HIVE_HOT_WATER_STATUS}
          >
            <WaterIcon />
            <span>Hot Water</span>
          </div>
        </div>
      </div>

      {/* Schedule List */}
      <div className="hive-schedules">
        {schedules.length === 0 ? (
          <div className="hive-schedules-empty">{UI_TEXT.HIVE_NO_SCHEDULES}</div>
        ) : (
          <ul className="hive-schedule-list" aria-label={UI_TEXT.HIVE_SCHEDULES}>
            {schedules.map((schedule) => (
              <li key={schedule.id} className="hive-schedule-item">
                <div className="hive-schedule-icon">
                  {schedule.type === 'heating' ? <HeatingIcon /> : <WaterIcon />}
                </div>
                <div className="hive-schedule-info">
                  <span className="hive-schedule-name">{schedule.name}</span>
                  <span className="hive-schedule-time">{schedule.time}</span>
                  <span className="hive-schedule-days">{schedule.days.join(', ')}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

// Simple SVG icons
const HeatingIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M12 2c0 4-4 6-4 10 0 2.2 1.8 4 4 4s4-1.8 4-4c0-4-4-6-4-10zm0 14c-1.1 0-2-.9-2-2 0-2 2-3 2-5 0 2 2 3 2 5 0 1.1-.9 2-2 2z" />
  </svg>
);

const WaterIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8zm0 18c-3.35 0-6-2.57-6-6.2 0-2.34 1.95-5.44 6-9.14 4.05 3.7 6 6.79 6 9.14 0 3.63-2.65 6.2-6 6.2z" />
  </svg>
);

HiveView.propTypes = {
  // Connection state
  isConnected: PropTypes.bool,
  status: PropTypes.shape({
    heating: PropTypes.shape({
      currentTemperature: PropTypes.number.isRequired,
      targetTemperature: PropTypes.number,
      isHeating: PropTypes.bool.isRequired,
      mode: PropTypes.string.isRequired,
    }).isRequired,
    hotWater: PropTypes.shape({
      isOn: PropTypes.bool.isRequired,
      mode: PropTypes.string,
    }).isRequired,
  }),
  schedules: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['heating', 'hotWater']).isRequired,
      time: PropTypes.string.isRequired,
      days: PropTypes.arrayOf(PropTypes.string).isRequired,
    })
  ),
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  onRetry: PropTypes.func,

  // Login props
  onConnect: PropTypes.func,
  onVerify2fa: PropTypes.func,
  onCancel2fa: PropTypes.func,
  onClearError: PropTypes.func,
  requires2fa: PropTypes.bool,
  isConnecting: PropTypes.bool,
  isVerifying: PropTypes.bool,
  pendingUsername: PropTypes.string,
};
