import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

export const Authentication = ({ bridgeIp, onAuthenticate, loading, error }) => {
  const [isButtonPressed, setIsButtonPressed] = useState(false);

  // Automatically authenticate when user confirms they pressed the button
  useEffect(() => {
    if (isButtonPressed) {
      onAuthenticate();
    }
  }, [isButtonPressed, onAuthenticate]);

  const handleStartAuth = () => {
    setIsButtonPressed(true);
  };

  const handleRetry = () => {
    setIsButtonPressed(false);
  };

  return (
    <div className="authentication">
      <h2>Authenticate with Bridge</h2>

      <div className="bridge-info">
        <p>Bridge IP: <strong>{bridgeIp}</strong></p>
      </div>

      <div className="instructions">
        <div className="link-button-image">
          <div className="bridge-icon">
            <svg viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="35" fill="#3498db" opacity="0.2"/>
              <circle cx="40" cy="40" r="25" fill="#3498db" opacity="0.3"/>
              <circle cx="40" cy="40" r="15" fill="#3498db"/>
              <circle cx="40" cy="40" r="8" fill="white"/>
            </svg>
          </div>
        </div>

        {!isButtonPressed && !loading && (
          <>
            <h3>Press the Link Button</h3>
            <p className="instruction-text">Press the round button on top of your Hue Bridge, then click below</p>
            <button onClick={handleStartAuth} className="primary large">
              I Pressed the Button
            </button>
          </>
        )}

        {loading && (
          <div className="auth-step">
            <h3>Authenticating...</h3>
            <div className="loading">
              <div className="spinner"></div>
              <p>Creating secure connection to your bridge</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="error-box">
          <h4>Authentication Failed</h4>
          <p className="error-message">{error}</p>

          {error.includes('link button') && (
            <div className="error-help">
              <p>Make sure you pressed the link button on the bridge, then try again.</p>
            </div>
          )}

          {error.includes('CORS') || error.includes('Browser security') && (
            <div className="cors-help">
              <h5>CORS Troubleshooting:</h5>
              <p>The browser is blocking requests to your bridge. Try these solutions:</p>
              <ul>
                <li>Install a CORS browser extension (e.g., "Allow CORS" or "CORS Unblock")</li>
                <li>Visit <code>http://{bridgeIp}/api/config</code> directly in a new tab first</li>
                <li>Make sure your device is on the same network as the bridge</li>
              </ul>
            </div>
          )}

          <button onClick={handleRetry} className="secondary">
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

Authentication.propTypes = {
  bridgeIp: PropTypes.string.isRequired,
  onAuthenticate: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string
};
