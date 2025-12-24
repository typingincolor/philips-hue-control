import PropTypes from 'prop-types';
import { LightShape } from '../../propTypes/shapes';

export const LightButton = ({ light, onToggle, isToggling }) => {
  // Use pre-computed color and shadow from backend
  const buttonStyle = light.color ? {
    background: `linear-gradient(135deg, ${light.color} 0%, ${light.color} 100%)`,
    boxShadow: light.shadow
  } : {};

  return (
    <div className="light-card">
      <button
        onClick={() => onToggle(light.id)}
        disabled={isToggling}
        className={`light-bulb-button ${light.on ? 'on' : 'off'}`}
        style={buttonStyle}
      >
        {isToggling ? (
          <span className="bulb-loading">⏳</span>
        ) : (
          <svg className="bulb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18h6"></path>
            <path d="M10 22h4"></path>
            <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7Z"></path>
          </svg>
        )}
      </button>
      <span className="light-label">{light.name || 'Unknown Light'}</span>
    </div>
  );
};

LightButton.propTypes = {
  light: LightShape.isRequired,
  onToggle: PropTypes.func.isRequired,
  isToggling: PropTypes.bool
};
