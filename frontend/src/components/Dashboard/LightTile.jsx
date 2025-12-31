import PropTypes from 'prop-types';
import { LightShape } from '../../propTypes/shapes';
import { LightbulbOn, LightbulbOff, Spinner } from './Icons';
import { COLOR_TEMPERATURE } from '../../constants/colors';

export const LightTile = ({ light, onToggle, onColorTemperatureChange, isToggling }) => {
  const lightName = light.name || 'Light';
  const brightness = light.on ? light.brightness || 0 : 0;

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

  // Color temperature value (default to neutral if not set)
  const colorTemperature = light.colorTemperature || COLOR_TEMPERATURE.DEFAULT;

  // State classes for styling
  const stateClasses = `${light.on ? 'on' : 'off'} ${isToggling ? 'toggling' : ''}`;

  const handleToggleClick = () => {
    if (!isToggling) {
      onToggle(light.id);
    }
  };

  const handleSliderChange = (e) => {
    e.stopPropagation();
    if (onColorTemperatureChange) {
      onColorTemperatureChange(light.id, parseInt(e.target.value, 10));
    }
  };

  const handleSliderClick = (e) => {
    e.stopPropagation();
  };

  const handleNameClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      className={`light-tile ${stateClasses} light-tile-flex-layout light-tile-balanced`}
      role="group"
      aria-label={`${lightName} controls`}
      onClick={handleToggleClick}
      style={shadowStyle}
    >
      {/* Full tile background fill when on */}
      {light.on && (
        <div
          className="light-tile-fill light-tile-fill-rounded light-tile-fill-inset light-tile-fill-all-rounded light-tile-fill-edge-to-edge light-tile-fill-full"
          style={{
            background: fillGradient,
          }}
        />
      )}

      {/* Toggle button area - fills most of the tile */}
      <button
        className={`light-tile-toggle ${stateClasses} light-tile-toggle-contained light-tile-toggle-proportional light-tile-toggle-fill-container light-tile-toggle-flush`}
        onClick={handleToggleClick}
        disabled={isToggling}
        aria-label={`Toggle ${lightName}, currently ${light.on ? 'on' : 'off'}${light.on ? ` at ${brightness}% brightness` : ''}`}
      >
        {/* Icon centered in toggle area */}
        {isToggling ? (
          <Spinner size={48} className="light-tile-icon" style={{ color: contentColor }} />
        ) : light.on ? (
          <LightbulbOn size={48} className="light-tile-icon" style={{ color: contentColor }} />
        ) : (
          <LightbulbOff size={48} className="light-tile-icon" style={{ color: contentColor }} />
        )}
      </button>

      {/* Color temperature slider - only visible when light is on */}
      {light.on && (
        <div
          className="light-tile-slider light-tile-slider-centered light-tile-slider-padded light-tile-slider-spaced light-tile-slider-expanded"
          onClick={handleSliderClick}
        >
          <input
            type="range"
            min={COLOR_TEMPERATURE.MIN}
            max={COLOR_TEMPERATURE.MAX}
            value={colorTemperature}
            onChange={handleSliderChange}
            disabled={isToggling}
            aria-label={`Color temperature for ${lightName}`}
            aria-valuemin={COLOR_TEMPERATURE.MIN}
            aria-valuemax={COLOR_TEMPERATURE.MAX}
            aria-valuenow={colorTemperature}
          />
        </div>
      )}

      {/* Name label at bottom */}
      <span
        className="light-tile-name light-tile-name-centered light-tile-name-padded light-tile-name-spaced light-tile-name-expanded"
        onClick={handleNameClick}
        style={{
          color: contentColor,
          background: pillBackground,
          borderRadius: '10px',
        }}
      >
        {lightName}
      </span>
    </div>
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
  onColorTemperatureChange: PropTypes.func,
  isToggling: PropTypes.bool,
};
