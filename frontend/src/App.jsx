import { useHueBridge } from './hooks/useHueBridge';
import { BridgeDiscovery } from './components/BridgeDiscovery';
import { Authentication } from './components/Authentication';
import { LightControl } from './components/LightControl';
import './App.css';

function App() {
  // Check for demo mode
  const isDemoMode = new URLSearchParams(window.location.search).get('demo') === 'true';

  const {
    step,
    bridgeIp,
    username,
    lights,
    loading,
    error,
    setBridgeIp,
    authenticate,
    testConnection,
    reset
  } = useHueBridge();

  // In demo mode, use dummy credentials and skip to connected step
  const effectiveStep = isDemoMode ? 'connected' : step;
  const effectiveBridgeIp = isDemoMode ? 'demo-bridge' : bridgeIp;
  const effectiveUsername = isDemoMode ? 'demo-user' : username;

  return (
    <div className="app">
      {effectiveStep !== 'connected' && (
        <header className="app-header">
          <h1>Philips Hue Bridge Connector</h1>
          <p className="subtitle">Verify Local API Connectivity</p>

          <div className="progress-indicator">
            <div className={`step ${effectiveStep === 'discovery' ? 'active' : effectiveStep !== 'discovery' ? 'completed' : ''}`}>
              <div className="step-number">1</div>
              <div className="step-label">Discovery</div>
            </div>
            <div className="progress-line"></div>
            <div className={`step ${effectiveStep === 'authentication' ? 'active' : effectiveStep === 'connected' ? 'completed' : ''}`}>
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
        {effectiveStep === 'discovery' && (
          <BridgeDiscovery onBridgeSelected={setBridgeIp} />
        )}

        {effectiveStep === 'authentication' && (
          <Authentication
            bridgeIp={effectiveBridgeIp}
            onAuthenticate={authenticate}
            loading={loading}
            error={error}
          />
        )}

        {effectiveStep === 'connected' && (
          <LightControl
            bridgeIp={effectiveBridgeIp}
            username={effectiveUsername}
            onLogout={reset}
          />
        )}
      </main>

      {effectiveStep !== 'connected' && (
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

export default App;
