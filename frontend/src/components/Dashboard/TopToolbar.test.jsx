import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TopToolbar } from './TopToolbar';
import { UI_TEXT } from '../../constants/uiText';

// Mock DemoModeContext
vi.mock('../../context/DemoModeContext', () => ({
  useDemoMode: () => ({ isDemoMode: false }),
}));

describe('TopToolbar', () => {
  const mockSummary = {
    lightsOn: 5,
    roomCount: 3,
    sceneCount: 10,
  };

  const mockWeather = {
    current: {
      temperature: 18,
      condition: 'Cloudy',
      windSpeed: 12,
    },
    forecast: [
      { date: '2025-01-01', condition: 'Sunny', high: 20, low: 10 },
      { date: '2025-01-02', condition: 'Cloudy', high: 18, low: 8 },
    ],
  };

  const mockLocation = {
    lat: 51.5074,
    lon: -0.1278,
    name: 'London',
  };

  const defaultProps = {
    summary: mockSummary,
    isConnected: true,
    isReconnecting: false,
    weather: mockWeather,
    weatherLoading: false,
    weatherError: null,
    location: mockLocation,
    units: 'celsius',
    onOpenSettings: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render summary stats', () => {
      render(<TopToolbar {...defaultProps} />);

      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('should render connection status', () => {
      render(<TopToolbar {...defaultProps} />);

      expect(screen.getByText(UI_TEXT.STATUS_CONNECTED)).toBeInTheDocument();
    });

    it('should render settings button', () => {
      render(<TopToolbar {...defaultProps} />);

      expect(screen.getByLabelText('settings')).toBeInTheDocument();
    });
  });

  describe('weather display', () => {
    it('should show weather temperature when data available', () => {
      render(<TopToolbar {...defaultProps} />);

      expect(screen.getByText('18°')).toBeInTheDocument();
    });

    it('should show location name', () => {
      render(<TopToolbar {...defaultProps} />);

      expect(screen.getByText('London')).toBeInTheDocument();
    });
  });

  describe('weather dropdown on click', () => {
    it('should show weather dropdown when weather button is clicked', async () => {
      const user = userEvent.setup();
      render(<TopToolbar {...defaultProps} />);

      // Click on weather display
      const weatherButton = screen.getByText('18°').closest('button');
      await user.click(weatherButton);

      // Dropdown should now be visible
      expect(screen.getByText(UI_TEXT.WEATHER_FORECAST)).toBeInTheDocument();
    });

    it('should NOT open settings when weather is clicked (should show dropdown instead)', async () => {
      const user = userEvent.setup();
      render(<TopToolbar {...defaultProps} />);

      // Click on weather display
      const weatherButton = screen.getByText('18°').closest('button');
      await user.click(weatherButton);

      // Settings should NOT be called
      expect(defaultProps.onOpenSettings).not.toHaveBeenCalled();
    });

    it('should toggle weather dropdown on second click', async () => {
      const user = userEvent.setup();
      render(<TopToolbar {...defaultProps} />);

      const weatherButton = screen.getByText('18°').closest('button');

      // First click - show dropdown
      await user.click(weatherButton);
      expect(screen.getByText(UI_TEXT.WEATHER_FORECAST)).toBeInTheDocument();

      // Second click - hide dropdown
      await user.click(weatherButton);
      expect(screen.queryByText(UI_TEXT.WEATHER_FORECAST)).not.toBeInTheDocument();
    });

    it('should open settings when clicking weather with no location set', async () => {
      const user = userEvent.setup();
      render(<TopToolbar {...defaultProps} location={null} weather={null} />);

      // Click on "Set location" button
      const setLocationButton = screen.getByText(UI_TEXT.WEATHER_SET_LOCATION);
      await user.click(setLocationButton);

      // Settings should be opened
      expect(defaultProps.onOpenSettings).toHaveBeenCalledTimes(1);
    });

    it('should open settings when clicking weather in error state', async () => {
      const user = userEvent.setup();
      render(
        <TopToolbar {...defaultProps} weather={null} weatherError="Failed to fetch weather" />
      );

      // Click on error state weather button
      const errorButton = screen.getByTestId('weather-error');
      await user.click(errorButton);

      // Settings should be opened
      expect(defaultProps.onOpenSettings).toHaveBeenCalledTimes(1);
    });
  });

  describe('settings button', () => {
    it('should call onOpenSettings when settings button is clicked', async () => {
      const user = userEvent.setup();
      render(<TopToolbar {...defaultProps} />);

      await user.click(screen.getByLabelText('settings'));

      expect(defaultProps.onOpenSettings).toHaveBeenCalledTimes(1);
    });
  });
});
