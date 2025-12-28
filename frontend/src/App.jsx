import { useHueBridge } from './hooks/useHueBridge';
import { DemoModeProvider, useDemoMode } from './context/DemoModeContext';
import { BridgeDiscovery } from './components/BridgeDiscovery';
import { Authentication } from './components/Authentication';
import { LightControl } from './components/LightControl';
import { SettingsPage } from './components/LightControl/SettingsPage';
import { UI_TEXT } from './constants/uiText';
import './App.css';

/**
 * Inner app content that uses the demo mode context
 */
function AppContent() {
  const { isDemoMode } = useDemoMode();

  const { step, bridgeIp, sessionToken, loading, error, setBridgeIp, authenticate, reset, enableHue } =
    useHueBridge();

  // In demo mode, use dummy credentials and skip to connected step
  const effectiveStep = isDemoMode ? 'connected' : step;
  const effectiveBridgeIp = isDemoMode ? 'demo-bridge' : bridgeIp;
  const effectiveSessionToken = isDemoMode ? 'demo-session-token' : sessionToken;

  // Show settings page as a full-screen experience (no header/footer)
  // This is the initial state before any service is enabled
  if (effectiveStep === 'settings') {
    return (
      <div className="app">
        <main className="app-main">
          <SettingsPage
            onBack={() => {}}
            onEnableHue={enableHue}
            hueConnected={false}
            hiveConnected={false}
            settings={{ services: { hue: { enabled: false }, hive: { enabled: false } } }}
            onUpdateSettings={() => {}}
            onDetectLocation={() => {}}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      {effectiveStep !== 'connected' && effectiveStep !== 'restoring' && (
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
          <LightControl sessionToken={effectiveSessionToken} onLogout={reset} />
        )}
      </main>

      {effectiveStep !== 'connected' && effectiveStep !== 'restoring' && (
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
