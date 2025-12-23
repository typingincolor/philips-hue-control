import { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useHueApi } from '../hooks/useHueApi';

export const MotionZones = ({ sessionToken, motionZones }) => {
  const api = useHueApi();

  const [zones, setZones] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const previousMotionState = useRef({});

  // Use WebSocket data if available, otherwise fallback to API
  useEffect(() => {
    if (motionZones) {
      setZones(motionZones);
    } else if (sessionToken) {
      const fetchSensors = async () => {
        try {
          const motionData = await api.getMotionZones(sessionToken);
          setZones(motionData.zones || []);
        } catch (err) {
          console.error('[MotionZones] Failed to fetch MotionAware data:', err);
        }
      };
      fetchSensors();
    }
  }, [sessionToken, motionZones, api]);

  // Detect motion changes and trigger alerts
  useEffect(() => {
    zones.forEach(zone => {
      const wasDetected = previousMotionState.current[zone.id];
      const isDetected = zone.motionDetected && zone.reachable !== false;

      // Show alert when motion newly detected
      if (isDetected && !wasDetected) {
        const alertId = `${zone.id}-${Date.now()}`;
        setActiveAlerts(prev => [...prev, { id: alertId, name: zone.name }]);

        // Auto-dismiss after 3 seconds
        setTimeout(() => {
          setActiveAlerts(prev => prev.filter(a => a.id !== alertId));
        }, 3000);
      }

      previousMotionState.current[zone.id] = isDetected;
    });
  }, [zones]);

  // Don't render anything if no active alerts
  if (activeAlerts.length === 0) {
    return null;
  }

  return (
    <div className="motion-alert-container">
      {activeAlerts.map(alert => (
        <div key={alert.id} className="motion-alert">
          <span className="motion-alert-dot">🔴</span>
          <span className="motion-alert-text">Motion: {alert.name}</span>
        </div>
      ))}
    </div>
  );
};

MotionZones.propTypes = {
  sessionToken: PropTypes.string.isRequired,
  motionZones: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    motionDetected: PropTypes.bool.isRequired,
    enabled: PropTypes.bool,
    reachable: PropTypes.bool
  }))
};
