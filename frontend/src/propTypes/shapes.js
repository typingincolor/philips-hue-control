import PropTypes from 'prop-types';

/**
 * PropTypes shape for an enriched light object
 * Matches the backend's enrichLight() output
 */
export const LightShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  on: PropTypes.bool.isRequired,
  brightness: PropTypes.number.isRequired,
  color: PropTypes.string, // Pre-computed CSS color (e.g., "rgb(255, 180, 120)")
  shadow: PropTypes.string, // Pre-computed CSS shadow
  colorSource: PropTypes.oneOf(['xy', 'temperature', 'fallback', null])
});

/**
 * PropTypes shape for a scene object
 */
export const SceneShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired
});

/**
 * PropTypes shape for room statistics
 */
export const RoomStatsShape = PropTypes.shape({
  lightsOnCount: PropTypes.number.isRequired,
  totalLights: PropTypes.number.isRequired,
  averageBrightness: PropTypes.number.isRequired
});

/**
 * PropTypes shape for a room object with lights and scenes
 */
export const RoomShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  stats: RoomStatsShape.isRequired,
  lights: PropTypes.arrayOf(LightShape).isRequired,
  scenes: PropTypes.arrayOf(SceneShape).isRequired
});

/**
 * PropTypes shape for a motion zone
 */
export const MotionZoneShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  motionDetected: PropTypes.bool.isRequired,
  enabled: PropTypes.bool,
  reachable: PropTypes.bool
});

/**
 * PropTypes shape for a zone (light grouping)
 */
export const ZoneShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  stats: RoomStatsShape.isRequired,
  lights: PropTypes.arrayOf(LightShape).isRequired,
  scenes: PropTypes.arrayOf(SceneShape).isRequired
});

/**
 * PropTypes shape for dashboard summary
 */
export const DashboardSummaryShape = PropTypes.shape({
  lightsOn: PropTypes.number.isRequired,
  totalLights: PropTypes.number.isRequired,
  roomCount: PropTypes.number.isRequired,
  sceneCount: PropTypes.number.isRequired
});
