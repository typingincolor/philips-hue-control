import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useHueApi } from '../hooks/useHueApi';
import { useDemoMode } from '../hooks/useDemoMode';
import { usePolling } from '../hooks/usePolling';
import { POLLING_INTERVALS } from '../constants/polling';

export const MotionZones = ({ sessionToken }) => {
  const isDemoMode = useDemoMode();
  const api = useHueApi();

  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch MotionAware zones from unified endpoint
  const fetchSensors = async () => {
    try {
      const motionData = await api.getMotionZones(sessionToken);
      setZones(motionData.zones || []);
      setError(null);
    } catch (err) {
      console.error('[MotionZones] Failed to fetch MotionAware data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (sessionToken) {
      fetchSensors();
    }
  }, [sessionToken]);

  // Auto-refresh polling (disabled in demo mode)
  usePolling(
    fetchSensors,
    POLLING_INTERVALS.MOTION_REFRESH,
    !!(sessionToken && !isDemoMode)
  );

  // Don't render if no MotionAware zones found
  if (!loading && zones.length === 0) {
    return null;
  }

  return (
    <div className="motion-zones">
      <div className="motion-zones-header">
        <h3>Motion Zones</h3>
        {loading && <span className="loading-text">Loading sensors...</span>}
      </div>

      {error && (
        <div className="motion-zones-error">
          Failed to load sensors: {error}
        </div>
      )}

      {!loading && zones.length > 0 && (
        <div className="motion-zones-row">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className={`motion-zone ${!zone.reachable ? 'unreachable' : ''}`}
              title={!zone.reachable ? 'Sensor unreachable' : ''}
            >
              <span className={`motion-dot ${zone.motionDetected ? 'active' : 'inactive'}`}>
                {zone.motionDetected ? '🔴' : '🟢'}
              </span>
              <span className="motion-zone-name">{zone.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

MotionZones.propTypes = {
  sessionToken: PropTypes.string.isRequired
};
