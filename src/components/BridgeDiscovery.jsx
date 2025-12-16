import { useState } from 'react';
import { hueApi } from '../services/hueApi';

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
        setError('No bridges found. Please enter IP manually.');
      }
    } catch (err) {
      setError('Could not discover bridges. Please enter IP manually.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (validateIp(manualIp)) {
      onBridgeSelected(manualIp);
    } else {
      setError('Please enter a valid IP address (e.g., 192.168.1.100)');
    }
  };

  const validateIp = (ip) => {
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) return false;

    // Check each octet is 0-255
    const octets = ip.split('.');
    return octets.every(octet => {
      const num = parseInt(octet, 10);
      return num >= 0 && num <= 255;
    });
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
