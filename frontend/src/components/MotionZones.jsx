import { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useHueApi } from '../hooks/useHueApi';
import { useDemoMode } from '../hooks/useDemoMode';

// Hook for drag-to-scroll functionality
const useDragScroll = () => {
  const ref = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMouseDown = (e) => {
      isDragging.current = true;
      startX.current = e.pageX - el.offsetLeft;
      scrollLeft.current = el.scrollLeft;
      el.style.cursor = 'grabbing';
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      el.style.cursor = 'grab';
    };

    const handleMouseLeave = () => {
      isDragging.current = false;
      el.style.cursor = 'grab';
    };

    const handleMouseMove = (e) => {
      if (!isDragging.current) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX.current) * 1.5;
      el.scrollLeft = scrollLeft.current - walk;
    };

    el.style.cursor = 'grab';
    el.addEventListener('mousedown', handleMouseDown);
    el.addEventListener('mouseup', handleMouseUp);
    el.addEventListener('mouseleave', handleMouseLeave);
    el.addEventListener('mousemove', handleMouseMove);

    return () => {
      el.removeEventListener('mousedown', handleMouseDown);
      el.removeEventListener('mouseup', handleMouseUp);
      el.removeEventListener('mouseleave', handleMouseLeave);
      el.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return ref;
};

export const MotionZones = ({ sessionToken, motionZones }) => {
  const isDemoMode = useDemoMode();
  const api = useHueApi();
  const scrollRef = useDragScroll();

  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use WebSocket data if available, otherwise fallback to API
  useEffect(() => {
    if (motionZones) {
      // WebSocket data available (real-time)
      setZones(motionZones);
      setLoading(false);
      setError(null);
    } else if (sessionToken) {
      // Fallback: fetch from API (for demo mode or when backend doesn't send motionZones yet)
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
      fetchSensors();
    }
  }, [sessionToken, motionZones, api]);

  // Don't render if no MotionAware zones found
  if (!loading && zones.length === 0) {
    return null;
  }

  return (
    <div className="motion-zones-bar">
      <span className="motion-zones-label">Motion:</span>
      {loading && <span className="loading-text">...</span>}
      {error && <span className="motion-zones-error">Failed</span>}
      {!loading && zones.length > 0 && (
        <div className="motion-zones-items" ref={scrollRef}>
          {zones.map((zone) => (
            <span
              key={zone.id}
              className={`motion-zone-item ${!zone.reachable ? 'unreachable' : ''}`}
              title={!zone.reachable ? 'Sensor unreachable' : zone.motionDetected ? 'Motion detected' : 'No motion'}
            >
              <span className={`motion-dot ${zone.motionDetected ? 'active' : 'inactive'}`}>
                {zone.motionDetected ? '🔴' : '🟢'}
              </span>
              <span className="motion-zone-name">{zone.name}</span>
            </span>
          ))}
        </div>
      )}
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
