import { useState } from 'react';
import { useHueBridge } from './hooks/useHueBridge';
import { DemoModeProvider, useDemoMode } from './context/DemoModeContext';
import { BridgeDiscovery } from './components/BridgeDiscovery';
import { Authentication } from './components/Authentication';
import { Dashboard } from './components/Dashboard';
import { SettingsPage } from './components/Dashboard/SettingsPage';
import { useLocation } from './hooks/useLocation';
import { UI_TEXT } from './constants/uiText';
import './App.css';

/**
 * Inner app content that uses the demo mode context
 */
function AppContent() {
  const { isDemoMode } = useDemoMode();
  const [initialLocation, setInitialLocation] = useState(null);

  const {
    step,
    bridgeIp,
    sessionToken,
    loading,
    error,
    setBridgeIp,
    authenticate,
    reset,
    enableHue,
    enableHiveOnly,
  } = useHueBridge();

  // Location detection for initial settings page (no session required)
  const {
    isDetecting,
    error: locationError,
    detectLocation,
  } = useLocation(initialLocation, setInitialLocation, false);

  // In demo mode, use dummy credentials and skip to connected step
  const effectiveStep = isDemoMode ? 'connected' : step;
  const effectiveBridgeIp = isDemoMode ? 'demo-bridge' : bridgeIp;
  const effectiveSessionToken = isDemoMode ? 'demo-session-token' : sessionToken;

  // Show settings page as a full-screen experience (no header/footer)
  // This is the initial state before any service is enabled
  if (effectiveStep === 'settings') {
    return (
      <div className="app app-fullscreen">
        <SettingsPage
          onBack={() => {}}
          onEnableHue={enableHue}
          onEnableHive={enableHiveOnly}
          hueConnected={false}
          hiveConnected={false}
          location={initialLocation}
          settings={{ services: { hue: { enabled: false }, hive: { enabled: false } } }}
          onUpdateSettings={() => {}}
          onDetectLocation={detectLocation}
          isDetecting={isDetecting}
          locationError={locationError}
        />
      </div>
    );
  }

  // Use fullscreen mode for connected state and pairing flow (no padding)
  const isFullscreen =
    effectiveStep === 'connected' ||
    effectiveStep === 'restoring' ||
    effectiveStep === 'discovery' ||
    effectiveStep === 'authentication';

  return (
    <div className={`app ${isFullscreen ? 'app-fullscreen' : ''}`}>
      {effectiveStep !== 'connected' &&
        effectiveStep !== 'restoring' &&
        effectiveStep !== 'backend_unavailable' && (
          <header className="app-header">
            <h1>{UI_TEXT.APP_TITLE}</h1>
            <p className="subtitle">{UI_TEXT.APP_SUBTITLE}</p>

            <div className="progress-indicator">
              <div
                className={`step ${effectiveStep === 'discovery' ? 'active' : effectiveStep !== 'discovery' ? 'completed' : ''}`}
              >
                <div className="step-number">1</div>
                <div className="step-label">Discovery</div>
              </div>
              <div className="progress-line"></div>
              <div
                className={`step ${effectiveStep === 'authentication' ? 'active' : effectiveStep === 'connected' ? 'completed' : ''}`}
              >
                <div className="step-number">2</div>
                <div className="step-label">Authentication</div>
              </div>
              <div className="progress-line"></div>
              <div className={`step ${effectiveStep === 'connected' ? 'active' : ''}`}>
                <div className="step-number">3</div>
                <div className="step-label">Connected</div>
              </div>
            </div>
          </header>
        )}

      <main className="app-main">
        {effectiveStep === 'restoring' && (
          <div className="restoring-session">
            <div className="spinner"></div>
            <p>Restoring session...</p>
          </div>
        )}

        {effectiveStep === 'backend_unavailable' && (
          <div className="backend-unavailable">
            <div className="error-icon">⚠️</div>
            <h2>Backend Unavailable</h2>
            <p>{error || 'Cannot connect to the backend server.'}</p>
            <p className="hint">Please ensure the backend server is running on port 3001.</p>
            <button onClick={() => window.location.reload()} className="primary">
              Retry Connection
            </button>
          </div>
        )}

        {effectiveStep === 'discovery' && <BridgeDiscovery onBridgeSelected={setBridgeIp} />}

        {effectiveStep === 'authentication' && (
          <Authentication
            bridgeIp={effectiveBridgeIp}
            onAuthenticate={authenticate}
            loading={loading}
            error={error}
          />
        )}

        {effectiveStep === 'connected' && (
          <Dashboard sessionToken={effectiveSessionToken} onLogout={reset} />
        )}
      </main>

      {effectiveStep !== 'connected' &&
        effectiveStep !== 'restoring' &&
        effectiveStep !== 'backend_unavailable' && (
          <footer className="app-footer">
            <button onClick={reset} className="secondary">
              Start Over
            </button>

            <div className="footer-info">
              <p>Using Philips Hue Local API v2</p>
            </div>
          </footer>
        )}
    </div>
  );
}

/**
 * Main App component wrapped with DemoModeProvider
 */
function App() {
  return (
    <DemoModeProvider>
      <AppContent />
    </DemoModeProvider>
  );
}

export default App;
