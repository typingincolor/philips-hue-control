import PropTypes from 'prop-types';
import { getLightColor, getLightShadow } from '../../utils/colorConversion';

export const LightButton = ({ light, onToggle, isToggling }) => {
  const lightColor = getLightColor(light);
  const lightShadow = getLightShadow(light, lightColor);
  const buttonStyle = lightColor ? {
    background: `linear-gradient(135deg, ${lightColor} 0%, ${lightColor} 100%)`,
    boxShadow: lightShadow
  } : {};

  return (
    <div className="light-card">
      <button
        onClick={() => onToggle(light.id)}
        disabled={isToggling}
        className={`light-bulb-button ${light.on?.on ? 'on' : 'off'}`}
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
      <span className="light-label">{light.metadata?.name || 'Unknown Light'}</span>
    </div>
  );
};

LightButton.propTypes = {
  light: PropTypes.shape({
    id: PropTypes.string.isRequired,
    on: PropTypes.shape({
      on: PropTypes.bool
    }),
    metadata: PropTypes.shape({
      name: PropTypes.string
    }),
    dimming: PropTypes.shape({
      brightness: PropTypes.number
    }),
    color: PropTypes.shape({
      xy: PropTypes.shape({
        x: PropTypes.number,
        y: PropTypes.number
      })
    }),
    color_temperature: PropTypes.shape({
      mirek: PropTypes.number
    })
  }).isRequired,
  onToggle: PropTypes.func.isRequired,
  isToggling: PropTypes.bool
};
