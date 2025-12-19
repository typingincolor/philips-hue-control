import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useHueApi } from '../hooks/useHueApi';
import { useDemoMode } from '../hooks/useDemoMode';
import { usePolling } from '../hooks/usePolling';
import { parseMotionSensors } from '../utils/motionSensors';
import { POLLING_INTERVALS } from '../constants/polling';

export const MotionZones = ({ bridgeIp, username }) => {
  const isDemoMode = useDemoMode();
  const api = useHueApi();

  const [behaviors, setBehaviors] = useState(null);
  const [motionAreas, setMotionAreas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch MotionAware data using API
  const fetchSensors = async () => {
    try {
      // Fetch behaviors (for zone names)
      const behaviorsData = await api.getResource(bridgeIp, username, 'behavior_instance');

      // Fetch convenience_area_motion (for motion status)
      const motionAreasData = await api.getResource(bridgeIp, username, 'convenience_area_motion');

      setBehaviors(behaviorsData);
      setMotionAreas(motionAreasData);
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
    if (bridgeIp && username) {
      fetchSensors();
    }
  }, [bridgeIp, username]);

  // Auto-refresh polling (disabled in demo mode)
  usePolling(
    fetchSensors,
    POLLING_INTERVALS.MOTION_REFRESH,
    !!(bridgeIp && username && !isDemoMode)
  );

  const motionSensors = parseMotionSensors(behaviors, motionAreas);

  // Don't render if no MotionAware zones found
  if (!loading && motionSensors.length === 0) {
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

      {!loading && motionSensors.length > 0 && (
        <div className="motion-zones-row">
          {motionSensors.map((sensor) => (
            <div
              key={sensor.id}
              className={`motion-zone ${!sensor.reachable ? 'unreachable' : ''}`}
              title={!sensor.reachable ? 'Sensor unreachable' : ''}
            >
              <span className={`motion-dot ${sensor.motionDetected ? 'active' : 'inactive'}`}>
                {sensor.motionDetected ? '🔴' : '🟢'}
              </span>
              <span className="motion-zone-name">{sensor.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

MotionZones.propTypes = {
  bridgeIp: PropTypes.string.isRequired,
  username: PropTypes.string.isRequired
};
