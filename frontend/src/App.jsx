import { useHueBridge } from './hooks/useHueBridge';
import { BridgeDiscovery } from './components/BridgeDiscovery';
import { Authentication } from './components/Authentication';
import { ConnectionTest } from './components/ConnectionTest';
import './App.css';

function App() {
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

  return (
    <div className="app">
      {step !== 'connected' && (
        <header className="app-header">
          <h1>Philips Hue Bridge Connector</h1>
          <p className="subtitle">Verify Local API Connectivity</p>

          <div className="progress-indicator">
            <div className={`step ${step === 'discovery' ? 'active' : step !== 'discovery' ? 'completed' : ''}`}>
              <div className="step-number">1</div>
              <div className="step-label">Discovery</div>
            </div>
            <div className="progress-line"></div>
            <div className={`step ${step === 'authentication' ? 'active' : step === 'connected' ? 'completed' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-label">Authentication</div>
            </div>
            <div className="progress-line"></div>
            <div className={`step ${step === 'connected' ? 'active' : ''}`}>
              <div className="step-number">3</div>
              <div className="step-label">Connected</div>
            </div>
          </div>
        </header>
      )}

      <main className="app-main">
        {step === 'discovery' && (
          <BridgeDiscovery onBridgeSelected={setBridgeIp} />
        )}

        {step === 'authentication' && (
          <Authentication
            bridgeIp={bridgeIp}
            onAuthenticate={authenticate}
            loading={loading}
            error={error}
          />
        )}

        {step === 'connected' && (
          <ConnectionTest
            bridgeIp={bridgeIp}
            username={username}
            lights={lights}
            onTest={testConnection}
            loading={loading}
            error={error}
          />
        )}
      </main>

      {step !== 'connected' && (
        <footer className="app-footer">
          <button onClick={reset} className="secondary">
            Start Over
          </button>

          <div className="footer-info">
            <p>Using Philips Hue Local API v1</p>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;
