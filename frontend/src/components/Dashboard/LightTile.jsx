import PropTypes from 'prop-types';
import { LightShape } from '../../propTypes/shapes';
import { LightbulbOn, LightbulbOff, Spinner } from './Icons';

export const LightTile = ({ light, onToggle, isToggling }) => {
  const brightness = light.on ? light.brightness || 0 : 0;
  const fillHeight = `${brightness}%`;

  // Fill color from backend, or default warm color
  const fillColor = light.color || 'rgb(255, 200, 130)';
  const fillGradient = `linear-gradient(to top, ${fillColor} 0%, ${adjustColor(fillColor, 20)} 100%)`;

  // Shadow only when brightness is high enough
  const shadowStyle =
    light.on && brightness >= 50 && light.shadow
      ? {
          boxShadow: light.shadow,
        }
      : {};

  // Content color and background pill for readability
  const { color: contentColor, background: pillBackground } = getContrastStyle(
    fillColor,
    brightness
  );

  return (
    <button
      onClick={() => onToggle(light.id)}
      disabled={isToggling}
      className={`light-tile ${light.on ? 'on' : 'off'} ${isToggling ? 'toggling' : ''}`}
      style={shadowStyle}
    >
      {/* Brightness fill - rises from bottom */}
      <div
        className="light-tile-fill"
        style={{
          height: fillHeight,
          background: fillGradient,
        }}
      />

      {/* Content layer */}
      <div className="light-tile-content">
        {isToggling ? (
          <Spinner size={48} className="light-tile-icon" style={{ color: contentColor }} />
        ) : light.on ? (
          <LightbulbOn size={48} className="light-tile-icon" style={{ color: contentColor }} />
        ) : (
          <LightbulbOff size={48} className="light-tile-icon" style={{ color: contentColor }} />
        )}
        <span
          className="light-tile-name"
          style={{
            color: contentColor,
            background: pillBackground,
            padding: '2px 8px',
            borderRadius: '10px',
          }}
        >
          {light.name || 'Light'}
        </span>
      </div>
    </button>
  );
};

// Helper to adjust color brightness for gradient effect
function adjustColor(color, amount) {
  if (!color) return color;

  // Parse rgb(r, g, b) format
  const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return color;

  const r = Math.max(0, Math.min(255, parseInt(match[1]) + amount));
  const g = Math.max(0, Math.min(255, parseInt(match[2]) + amount));
  const b = Math.max(0, Math.min(255, parseInt(match[3]) + amount));

  return `rgb(${r}, ${g}, ${b})`;
}

// Calculate text style with background pill for readability
function getContrastStyle(color, brightness) {
  // Parse rgb(r, g, b) format to get luminance
  const match = color?.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  let luminance = 180; // Default for warm colors

  if (match) {
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  }

  // For bright fill colors with enough coverage, use dark text on light pill
  // Otherwise use light text on dark pill
  const isBrightFill = luminance > 140 && brightness >= 50;

  if (isBrightFill) {
    return {
      color: 'rgba(0, 0, 0, 0.9)',
      background: 'rgba(255, 255, 255, 0.7)',
    };
  } else {
    return {
      color: 'rgba(255, 255, 255, 0.95)',
      background: 'rgba(0, 0, 0, 0.5)',
    };
  }
}

LightTile.propTypes = {
  light: LightShape.isRequired,
  onToggle: PropTypes.func.isRequired,
  isToggling: PropTypes.bool,
};
