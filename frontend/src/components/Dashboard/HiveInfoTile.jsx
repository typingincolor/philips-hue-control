import PropTypes from 'prop-types';
import { HeatingIcon, WaterIcon } from './Icons';

/**
 * HiveInfoTile - Square tile for Hive information (schedules, etc.)
 * Uses same sizing as LightTile for consistent grid layout
 */
export const HiveInfoTile = ({ schedule }) => {
  const isHeating = schedule.type === 'heating';
  const typeClass = isHeating ? 'hive-info-heating' : 'hive-info-hotwater';

  const ariaLabel = `${schedule.name}, ${schedule.type} schedule at ${schedule.time}`;

  return (
    <div
      className={`hive-info-tile ${typeClass}`}
      data-testid="hive-info-tile"
      aria-label={ariaLabel}
    >
      <div className="hive-info-content">
        <div className="hive-info-icon" data-testid="hive-info-icon">
          {isHeating ? (
            <HeatingIcon width="24" height="24" />
          ) : (
            <WaterIcon width="24" height="24" />
          )}
        </div>
        <span className="hive-info-name" data-testid="hive-info-name">
          {schedule.name}
        </span>
        <span className="hive-info-time" data-testid="hive-info-time">
          {schedule.time}
        </span>
      </div>
    </div>
  );
};

HiveInfoTile.propTypes = {
  schedule: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['heating', 'hotWater']).isRequired,
    time: PropTypes.string.isRequired,
    days: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
};
