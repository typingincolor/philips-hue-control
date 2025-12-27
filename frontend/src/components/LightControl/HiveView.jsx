import PropTypes from 'prop-types';
import { UI_TEXT } from '../../constants/uiText';
import { Spinner } from './Icons';

export const HiveView = ({ status, schedules = [], isLoading = false, error = null, onRetry }) => {
  // Loading state
  if (isLoading && !status) {
    return (
      <div className="hive-view">
        <div className="hive-loading">
          <Spinner size={24} />
          <span>{UI_TEXT.HIVE_LOADING}</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !status) {
    return (
      <div className="hive-view">
        <div className="hive-error">
          <span className="hive-error-message">{error}</span>
          <button className="hive-retry-btn" onClick={onRetry}>
            {UI_TEXT.RETRY}
          </button>
        </div>
      </div>
    );
  }

  // No status data
  if (!status) {
    return null;
  }

  const { heating, hotWater } = status;

  return (
    <div className="hive-view">
      {/* Thermostat Display */}
      <div className="hive-thermostat">
        <div className="hive-temp-display" aria-label={UI_TEXT.HIVE_CURRENT_TEMP}>
          <span className="hive-temp-value">{heating.currentTemperature}°</span>
          <span className="hive-mode-badge">{heating.mode}</span>
        </div>

        <div className="hive-status-indicators">
          <div
            className={`hive-status-indicator ${heating.isHeating ? 'active' : ''}`}
            aria-label={UI_TEXT.HIVE_HEATING_STATUS}
          >
            <HeatingIcon />
            <span>Heating</span>
          </div>
          <div
            className={`hive-status-indicator ${hotWater.isOn ? 'active' : ''}`}
            aria-label={UI_TEXT.HIVE_HOT_WATER_STATUS}
          >
            <WaterIcon />
            <span>Hot Water</span>
          </div>
        </div>
      </div>

      {/* Schedule List */}
      <div className="hive-schedules">
        {schedules.length === 0 ? (
          <div className="hive-schedules-empty">{UI_TEXT.HIVE_NO_SCHEDULES}</div>
        ) : (
          <ul className="hive-schedule-list" aria-label={UI_TEXT.HIVE_SCHEDULES}>
            {schedules.map((schedule) => (
              <li key={schedule.id} className="hive-schedule-item">
                <div className="hive-schedule-icon">
                  {schedule.type === 'heating' ? <HeatingIcon /> : <WaterIcon />}
                </div>
                <div className="hive-schedule-info">
                  <span className="hive-schedule-name">{schedule.name}</span>
                  <span className="hive-schedule-time">{schedule.time}</span>
                  <span className="hive-schedule-days">{schedule.days.join(', ')}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

// Simple SVG icons
const HeatingIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M12 2c0 4-4 6-4 10 0 2.2 1.8 4 4 4s4-1.8 4-4c0-4-4-6-4-10zm0 14c-1.1 0-2-.9-2-2 0-2 2-3 2-5 0 2 2 3 2 5 0 1.1-.9 2-2 2z" />
  </svg>
);

const WaterIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8zm0 18c-3.35 0-6-2.57-6-6.2 0-2.34 1.95-5.44 6-9.14 4.05 3.7 6 6.79 6 9.14 0 3.63-2.65 6.2-6 6.2z" />
  </svg>
);

HiveView.propTypes = {
  status: PropTypes.shape({
    heating: PropTypes.shape({
      currentTemperature: PropTypes.number.isRequired,
      targetTemperature: PropTypes.number,
      isHeating: PropTypes.bool.isRequired,
      mode: PropTypes.string.isRequired,
    }).isRequired,
    hotWater: PropTypes.shape({
      isOn: PropTypes.bool.isRequired,
      mode: PropTypes.string,
    }).isRequired,
  }),
  schedules: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['heating', 'hotWater']).isRequired,
      time: PropTypes.string.isRequired,
      days: PropTypes.arrayOf(PropTypes.string).isRequired,
    })
  ),
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  onRetry: PropTypes.func,
};
