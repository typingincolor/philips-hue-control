import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeatherTooltip } from './WeatherTooltip';
import { UI_TEXT } from '../../constants/uiText';

describe('WeatherTooltip', () => {
  const mockWeather = {
    current: {
      temperature: 22,
      weatherCode: 1,
      windSpeed: 15,
    },
    forecast: [
      { date: '2024-01-01', weatherCode: 0, high: 24, low: 18 },
      { date: '2024-01-02', weatherCode: 2, high: 22, low: 16 },
      { date: '2024-01-03', weatherCode: 61, high: 18, low: 12 },
      { date: '2024-01-04', weatherCode: 3, high: 20, low: 14 },
      { date: '2024-01-05', weatherCode: 1, high: 23, low: 17 },
    ],
  };

  const mockLocation = {
    lat: 51.5074,
    lon: -0.1278,
    name: 'London',
  };

  describe('current weather section', () => {
    it('should display location name', () => {
      render(
        <WeatherTooltip
          weather={mockWeather}
          location={mockLocation}
          units="celsius"
        />
      );

      expect(screen.getByText('London')).toBeInTheDocument();
    });

    it('should display current temperature', () => {
      render(
        <WeatherTooltip
          weather={mockWeather}
          location={mockLocation}
          units="celsius"
        />
      );

      // Check the main temp display has the current temperature
      const mainTemp = screen.getByText('22°', { selector: '.weather-tooltip__temp-main' });
      expect(mainTemp).toBeInTheDocument();
    });

    it('should display wind speed', () => {
      render(
        <WeatherTooltip
          weather={mockWeather}
          location={mockLocation}
          units="celsius"
        />
      );

      expect(screen.getByText(/15/)).toBeInTheDocument();
    });
  });

  describe('forecast section', () => {
    it('should display forecast heading', () => {
      render(
        <WeatherTooltip
          weather={mockWeather}
          location={mockLocation}
          units="celsius"
        />
      );

      expect(screen.getByText(UI_TEXT.WEATHER_FORECAST)).toBeInTheDocument();
    });

    it('should display 5 forecast days', () => {
      render(
        <WeatherTooltip
          weather={mockWeather}
          location={mockLocation}
          units="celsius"
        />
      );

      const forecastItems = screen.getAllByTestId('forecast-day');
      expect(forecastItems).toHaveLength(5);
    });

    it('should display high and low temperatures for each day', () => {
      render(
        <WeatherTooltip
          weather={mockWeather}
          location={mockLocation}
          units="celsius"
        />
      );

      // Check forecast has high/low temp elements
      const highTemps = screen.getAllByText(/\d+°/, { selector: '.weather-tooltip__day-high' });
      const lowTemps = screen.getAllByText(/\d+°/, { selector: '.weather-tooltip__day-low' });
      expect(highTemps).toHaveLength(5);
      expect(lowTemps).toHaveLength(5);
    });

    it('should display day names', () => {
      render(
        <WeatherTooltip
          weather={mockWeather}
          location={mockLocation}
          units="celsius"
        />
      );

      // Should have day abbreviations
      const forecastItems = screen.getAllByTestId('forecast-day');
      expect(forecastItems[0]).toHaveTextContent(/Mon|Tue|Wed|Thu|Fri|Sat|Sun/);
    });
  });

  describe('no weather data', () => {
    it('should render nothing when no weather data', () => {
      const { container } = render(
        <WeatherTooltip
          weather={null}
          location={mockLocation}
          units="celsius"
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render nothing when no location', () => {
      const { container } = render(
        <WeatherTooltip
          weather={mockWeather}
          location={null}
          units="celsius"
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('units display', () => {
    it('should show C for celsius', () => {
      render(
        <WeatherTooltip
          weather={mockWeather}
          location={mockLocation}
          units="celsius"
        />
      );

      expect(screen.getByText(/km\/h/)).toBeInTheDocument();
    });

    it('should show mph for fahrenheit', () => {
      render(
        <WeatherTooltip
          weather={mockWeather}
          location={mockLocation}
          units="fahrenheit"
        />
      );

      expect(screen.getByText(/mph/)).toBeInTheDocument();
    });
  });
});
