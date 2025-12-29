import PropTypes from 'prop-types';
import { WaterIcon } from './Icons';

/**
 * HiveTile - Display-only tile for heating and hot water devices
 * Matches the visual style of LightTile with orange fill when active
 */
export const HiveTile = ({ type, data }) => {
  const isHeating = type === 'heating';
  const isActive = isHeating ? data.isHeating : data.isOn;

  const fillHeight = isActive ? '100%' : '0%';

  // Build aria-label
  const ariaLabel = isHeating
    ? `Heating at ${data.currentTemperature?.toFixed(1)} degrees, target ${data.targetTemperature?.toFixed(1)} degrees, mode ${data.mode}`
    : `Hot water ${isActive ? 'on' : 'off'}, mode ${data.mode}`;

  const tileClasses = ['hive-tile', `hive-tile-${type}`, isActive ? 'active' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={tileClasses} data-testid={`hive-tile-${type}`} aria-label={ariaLabel}>
      {/* Orange fill - rises from bottom when active */}
      <div className="hive-tile-fill" style={{ height: fillHeight }} />

      {/* Content layer */}
      <div className="hive-tile-content">
        {isHeating ? (
          <>
            <span className="hive-tile-temp-current" data-testid="hive-tile-temp-current">
              {data.currentTemperature?.toFixed(1)}°
            </span>
            <span className="hive-tile-temp-target" data-testid="hive-tile-temp-target">
              → {data.targetTemperature?.toFixed(1)}°
            </span>
          </>
        ) : (
          <>
            <WaterIcon width="32" height="32" />
            <span className="hive-tile-label">Hot Water</span>
          </>
        )}
        <span className="hive-tile-mode" data-testid="hive-tile-mode">
          {data.mode}
        </span>
      </div>
    </div>
  );
};

HiveTile.propTypes = {
  type: PropTypes.oneOf(['heating', 'hotwater']).isRequired,
  data: PropTypes.shape({
    // Heating data
    currentTemperature: PropTypes.number,
    targetTemperature: PropTypes.number,
    isHeating: PropTypes.bool,
    // Hot water data
    isOn: PropTypes.bool,
    // Common
    mode: PropTypes.string,
  }).isRequired,
};
