import { WeatherIcon, Wind } from './Icons';
import { UI_TEXT } from '../../constants/uiText';
import { getWeatherDescription } from '../../constants/weather';

/**
 * Format date to day abbreviation
 */
const formatDay = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

/**
 * Weather tooltip component showing detailed weather info
 * Appears on hover over WeatherDisplay
 */
export const WeatherTooltip = ({ weather, location, units }) => {
  // Don't render if no data
  if (!weather || !location) {
    return null;
  }

  const { current, forecast } = weather;
  const windUnit = units === 'fahrenheit' ? 'mph' : 'km/h';

  return (
    <div className="weather-tooltip">
      {/* Current weather header */}
      <div className="weather-tooltip__header">
        <div className="weather-tooltip__location">{location.name}</div>
        <div className="weather-tooltip__current">
          <WeatherIcon code={current.weatherCode} size={32} />
          <div className="weather-tooltip__temp-main">{current.temperature}°</div>
        </div>
        <div className="weather-tooltip__description">
          {getWeatherDescription(current.weatherCode)}
        </div>
        <div className="weather-tooltip__wind">
          <Wind size={14} />
          <span>
            {current.windSpeed} {windUnit}
          </span>
        </div>
      </div>

      {/* Forecast section */}
      <div className="weather-tooltip__forecast">
        <div className="weather-tooltip__forecast-title">{UI_TEXT.WEATHER_FORECAST}</div>
        <div className="weather-tooltip__forecast-list">
          {forecast?.map((day, index) => (
            <div
              key={day.date}
              className="weather-tooltip__forecast-day"
              data-testid="forecast-day"
            >
              <span className="weather-tooltip__day-name">{formatDay(day.date)}</span>
              <WeatherIcon code={day.weatherCode} size={16} />
              <span className="weather-tooltip__day-high">{day.high}°</span>
              <span className="weather-tooltip__day-low">{day.low}°</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
