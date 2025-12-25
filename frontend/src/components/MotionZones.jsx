import { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { MotionZoneShape } from '../propTypes/shapes';
import { useDemoMode } from '../context/DemoModeContext';
import { createLogger } from '../utils/logger';

const logger = createLogger('MotionZones');

export const MotionZones = ({ sessionToken, motionZones }) => {
  const { api } = useDemoMode();

  const [fetchedZones, setFetchedZones] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const previousMotionState = useRef({});

  // Use WebSocket data if available, otherwise use fetched data
  const zones = motionZones || fetchedZones;

  // Fetch from API only when no WebSocket data is provided
  useEffect(() => {
    if (!motionZones && sessionToken) {
      const fetchSensors = async () => {
        try {
          const motionData = await api.getMotionZones(sessionToken);
          setFetchedZones(motionData.zones || []);
        } catch (err) {
          logger.error('Failed to fetch MotionAware data:', err);
        }
      };
      fetchSensors();
    }
  }, [sessionToken, motionZones, api]);

  // Detect motion changes and trigger alerts
  useEffect(() => {
    zones.forEach((zone) => {
      const wasDetected = previousMotionState.current[zone.id];
      const isDetected = zone.motionDetected && zone.reachable !== false;

      // Show alert when motion newly detected
      if (isDetected && !wasDetected) {
        const alertId = `${zone.id}-${Date.now()}`;
        setActiveAlerts((prev) => [...prev, { id: alertId, name: zone.name }]);

        // Auto-dismiss after 3 seconds
        setTimeout(() => {
          setActiveAlerts((prev) => prev.filter((a) => a.id !== alertId));
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
      {activeAlerts.map((alert) => (
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
  motionZones: PropTypes.arrayOf(MotionZoneShape),
};
