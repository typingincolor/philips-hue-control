import { useState, useEffect } from 'react';

export const Authentication = ({ bridgeIp, onAuthenticate, loading, error }) => {
  const [countdown, setCountdown] = useState(30);
  const [isButtonPressed, setIsButtonPressed] = useState(false);

  useEffect(() => {
    if (isButtonPressed && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [isButtonPressed, countdown]);

  const handleStartAuth = () => {
    setIsButtonPressed(true);
    setCountdown(30);
  };

  const handleCreateUsername = () => {
    onAuthenticate();
  };

  const handleRetry = () => {
    setIsButtonPressed(false);
    setCountdown(30);
  };

  return (
    <div className="authentication">
      <h2>Authenticate with Bridge</h2>

      <div className="bridge-info">
        <p>Bridge IP: <strong>{bridgeIp}</strong></p>
      </div>

      <div className="instructions">
        <h3>Step 1: Press the Link Button</h3>
        <div className="link-button-image">
          <div className="bridge-icon">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="35" fill="#3498db" opacity="0.2"/>
              <circle cx="40" cy="40" r="25" fill="#3498db" opacity="0.3"/>
              <circle cx="40" cy="40" r="15" fill="#3498db"/>
              <circle cx="40" cy="40" r="8" fill="white"/>
            </svg>
          </div>
        </div>
        <p className="instruction-text">Press the round button on top of your Hue Bridge</p>

        {!isButtonPressed && (
          <button onClick={handleStartAuth} className="primary large">
            I Pressed the Button
          </button>
        )}
      </div>

      {isButtonPressed && (
        <div className="auth-step">
          <h3>Step 2: Create Username</h3>
          <div className="countdown">
            <div className="countdown-circle">
              <span className="countdown-number">{countdown}</span>
            </div>
            <p>seconds remaining</p>
          </div>

          <button
            onClick={handleCreateUsername}
            disabled={loading || countdown === 0}
            className="primary large"
          >
            {loading ? 'Creating...' : 'Create Username'}
          </button>

          {countdown === 0 && (
            <div className="warning">
              <p>Time expired. Please press the link button again.</p>
              <button onClick={handleRetry} className="secondary">
                Start Over
              </button>
            </div>
          )}
        </div>
      )}

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
