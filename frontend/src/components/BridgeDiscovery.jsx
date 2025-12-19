import { useState } from 'react';
import PropTypes from 'prop-types';
import { hueApi } from '../services/hueApi';
import { validateIp } from '../utils/validation';
import { ERROR_MESSAGES } from '../constants/messages';

export const BridgeDiscovery = ({ onBridgeSelected }) => {
  const [manualIp, setManualIp] = useState('');
  const [discoveredBridges, setDiscoveredBridges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDiscover = async () => {
    setLoading(true);
    setError(null);

    try {
      const bridges = await hueApi.discoverBridge();
      setDiscoveredBridges(bridges);
      if (bridges.length === 0) {
        setError(ERROR_MESSAGES.BRIDGE_DISCOVERY);
      }
    } catch (err) {
      setError(ERROR_MESSAGES.BRIDGE_DISCOVERY);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (validateIp(manualIp)) {
      onBridgeSelected(manualIp);
    } else {
      setError(ERROR_MESSAGES.INVALID_IP);
    }
  };

  return (
    <div className="bridge-discovery">
      <h2>Find Your Hue Bridge</h2>

      <div className="discovery-section">
        <h3>Auto-Discovery</h3>
        <button onClick={handleDiscover} disabled={loading} className="primary">
          {loading ? 'Searching...' : 'Discover Bridge'}
        </button>

        {discoveredBridges.length > 0 && (
          <div className="discovered-bridges">
            <h4>Found Bridges:</h4>
            {discoveredBridges.map((bridge) => (
              <div key={bridge.id} className="bridge-item">
                <span className="bridge-ip">{bridge.internalipaddress}</span>
                <button onClick={() => onBridgeSelected(bridge.internalipaddress)}>
                  Use This Bridge
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="divider">OR</div>

      <div className="manual-section">
        <h3>Enter IP Manually</h3>
        <form onSubmit={handleManualSubmit}>
          <input
            type="text"
            placeholder="192.168.1.xxx"
            value={manualIp}
            onChange={(e) => setManualIp(e.target.value)}
            className="ip-input"
          />
          <button type="submit" className="primary">Connect</button>
        </form>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="help-text">
        <p><strong>Tip:</strong> Your bridge IP can be found in the Philips Hue app under Settings → My Hue System → Bridge</p>
      </div>
    </div>
  );
};

BridgeDiscovery.propTypes = {
  onBridgeSelected: PropTypes.func.isRequired
};
