import PropTypes from 'prop-types';
import { Sun, Moon, Spinner } from './Icons';

export const AllOnOffTile = ({ anyOn, onToggle, roomId, isToggling, className = '' }) => {
  const handleClick = () => {
    // If any lights are on, turn them all off. Otherwise turn all on.
    onToggle(roomId, !anyOn);
  };

  const label = anyOn ? 'All Off' : 'All On';
  const ariaLabel = anyOn ? 'Turn all lights off' : 'Turn all lights on';

  return (
    <button
      onClick={handleClick}
      disabled={isToggling}
      className={`all-on-off-tile ${anyOn ? 'on' : 'off'} ${isToggling ? 'toggling' : ''} ${className}`}
      aria-label={ariaLabel}
      aria-pressed={anyOn}
    >
      <div className="all-on-off-tile-icon">
        {isToggling ? <Spinner size={24} /> : anyOn ? <Moon size={24} /> : <Sun size={24} />}
      </div>
      <span className="all-on-off-tile-name">{label}</span>
    </button>
  );
};

AllOnOffTile.propTypes = {
  anyOn: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  roomId: PropTypes.string.isRequired,
  isToggling: PropTypes.bool,
  className: PropTypes.string,
};
