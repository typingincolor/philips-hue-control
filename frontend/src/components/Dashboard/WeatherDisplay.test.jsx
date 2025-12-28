import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeatherDisplay } from './WeatherDisplay';
import { UI_TEXT } from '../../constants/uiText';

describe('WeatherDisplay', () => {
  const mockWeather = {
    current: {
      temperature: 22,
      condition: 'Mainly clear',
      windSpeed: 15,
    },
  };

  const mockLocation = {
    lat: 51.5074,
    lon: -0.1278,
    name: 'London',
  };

  describe('rendering weather data', () => {
    it('should display temperature', () => {
      render(
        <WeatherDisplay
          weather={mockWeather}
          location={mockLocation}
          isLoading={false}
          error={null}
          units="celsius"
        />
      );

      expect(screen.getByText('22°')).toBeInTheDocument();
    });

    it('should display location name', () => {
      render(
        <WeatherDisplay
          weather={mockWeather}
          location={mockLocation}
          isLoading={false}
          error={null}
          units="celsius"
        />
      );

      expect(screen.getByText('London')).toBeInTheDocument();
    });

    it('should display weather icon', () => {
      render(
        <WeatherDisplay
          weather={mockWeather}
          location={mockLocation}
          isLoading={false}
          error={null}
          units="celsius"
        />
      );

      // Icon should be rendered in the weather display
      expect(screen.getByTestId('weather-icon')).toBeInTheDocument();
    });

    it('should format temperature with fahrenheit', () => {
      const fahrenheitWeather = {
        current: {
          temperature: 72,
          condition: 'Clear sky',
          windSpeed: 10,
        },
      };

      render(
        <WeatherDisplay
          weather={fahrenheitWeather}
          location={mockLocation}
          isLoading={false}
          error={null}
          units="fahrenheit"
        />
      );

      expect(screen.getByText('72°')).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should show loading indicator when loading', () => {
      render(
        <WeatherDisplay
          weather={null}
          location={mockLocation}
          isLoading={true}
          error={null}
          units="celsius"
        />
      );

      expect(screen.getByTestId('weather-loading')).toBeInTheDocument();
    });

    it('should not show weather data when loading', () => {
      render(
        <WeatherDisplay
          weather={mockWeather}
          location={mockLocation}
          isLoading={true}
          error={null}
          units="celsius"
        />
      );

      expect(screen.queryByText('22°')).not.toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should show error indicator when error occurs', () => {
      render(
        <WeatherDisplay
          weather={null}
          location={mockLocation}
          isLoading={false}
          error="Failed to fetch weather"
          units="celsius"
        />
      );

      expect(screen.getByTestId('weather-error')).toBeInTheDocument();
    });

    it('should not show weather data when error', () => {
      render(
        <WeatherDisplay
          weather={null}
          location={mockLocation}
          isLoading={false}
          error="Failed to fetch weather"
          units="celsius"
        />
      );

      expect(screen.queryByText('London')).not.toBeInTheDocument();
    });
  });

  describe('no location state', () => {
    it('should show setup prompt when no location', () => {
      render(
        <WeatherDisplay
          weather={null}
          location={null}
          isLoading={false}
          error={null}
          units="celsius"
        />
      );

      expect(screen.getByText(UI_TEXT.WEATHER_SET_LOCATION)).toBeInTheDocument();
    });
  });

  describe('click handling', () => {
    it('should call onClick when clicked', async () => {
      const onClick = vi.fn();

      render(
        <WeatherDisplay
          weather={mockWeather}
          location={mockLocation}
          isLoading={false}
          error={null}
          units="celsius"
          onClick={onClick}
        />
      );

      const display = screen.getByRole('button');
      display.click();

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should be clickable even when loading', async () => {
      const onClick = vi.fn();

      render(
        <WeatherDisplay
          weather={null}
          location={mockLocation}
          isLoading={true}
          error={null}
          units="celsius"
          onClick={onClick}
        />
      );

      const display = screen.getByRole('button');
      display.click();

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });
});
