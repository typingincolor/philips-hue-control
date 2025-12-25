import { Spinner, WeatherIcon, MapPin } from './Icons';
import { UI_TEXT } from '../../constants/uiText';

/**
 * Weather display component for the toolbar
 * Shows icon, temperature, and location name
 */
export const WeatherDisplay = ({ weather, location, isLoading, error, units, onClick }) => {
  // No location set - show setup prompt
  if (!location) {
    return (
      <button className="weather-display weather-display--setup" onClick={onClick}>
        <MapPin size={16} />
        <span className="weather-display__text">{UI_TEXT.WEATHER_SET_LOCATION}</span>
      </button>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <button
        className="weather-display weather-display--loading"
        onClick={onClick}
        data-testid="weather-loading"
      >
        <Spinner size={16} />
        <span className="weather-display__text">{location.name}</span>
      </button>
    );
  }

  // Error state
  if (error) {
    return (
      <button
        className="weather-display weather-display--error"
        onClick={onClick}
        data-testid="weather-error"
      >
        <MapPin size={16} />
        <span className="weather-display__text">{UI_TEXT.WEATHER_ERROR}</span>
      </button>
    );
  }

  // Weather data available
  if (weather?.current) {
    const { temperature, condition } = weather.current;

    return (
      <button className="weather-display" onClick={onClick}>
        <span data-testid="weather-icon">
          <WeatherIcon condition={condition} size={16} />
        </span>
        <span className="weather-display__temp">{temperature}°</span>
        <span className="weather-display__location">{location.name}</span>
      </button>
    );
  }

  // Fallback - no weather data yet
  return (
    <button className="weather-display" onClick={onClick}>
      <MapPin size={16} />
      <span className="weather-display__text">{location.name}</span>
    </button>
  );
};
