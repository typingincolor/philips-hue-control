import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { UI_TEXT } from '../../constants/uiText';
import { Spinner } from './Icons';
import { HiveTile } from './HiveTile';
import { HiveInfoTile } from './HiveInfoTile';

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
      {/* All tiles in single grid - same layout as light tiles */}
      <div className="tiles-grid" data-testid="hive-tiles-grid">
        <HiveTile type="heating" data={heating} />
        <HiveTile type="hotwater" data={hotWater} />
        {schedules.map((schedule) => (
          <HiveInfoTile key={schedule.id} schedule={schedule} />
        ))}
      </div>
    </div>
  );
};

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
