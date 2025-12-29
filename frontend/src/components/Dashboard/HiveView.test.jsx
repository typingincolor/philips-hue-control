import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HiveView } from './HiveView';
import { UI_TEXT } from '../../constants/uiText';

describe('HiveView', () => {
  const defaultProps = {
    status: {
      heating: {
        currentTemperature: 19.5,
        targetTemperature: 21,
        isHeating: true,
        mode: 'schedule',
      },
      hotWater: {
        isOn: false,
        mode: 'schedule',
      },
    },
    schedules: [
      {
        id: '1',
        name: 'Morning Warmup',
        type: 'heating',
        time: '06:00',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      },
      {
        id: '2',
        name: 'Hot Water AM',
        type: 'hotWater',
        time: '07:00',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      },
    ],
    isLoading: false,
    error: null,
    onRetry: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Tile-Based Layout', () => {
    it('should render all tiles in single grid', () => {
      render(<HiveView {...defaultProps} />);

      const tilesGrid = screen.getByTestId('hive-tiles-grid');
      expect(tilesGrid).toBeInTheDocument();
      expect(tilesGrid).toHaveClass('tiles-grid');
    });

    it('should render heating tile', () => {
      render(<HiveView {...defaultProps} />);

      expect(screen.getByTestId('hive-tile-heating')).toBeInTheDocument();
    });

    it('should render hot water tile', () => {
      render(<HiveView {...defaultProps} />);

      expect(screen.getByTestId('hive-tile-hotwater')).toBeInTheDocument();
    });

    it('should render info tiles', () => {
      render(<HiveView {...defaultProps} />);

      const infoTiles = screen.getAllByTestId('hive-info-tile');
      expect(infoTiles).toHaveLength(2);
    });
  });

  describe('Heating Tile Display', () => {
    it('should display current temperature rounded to 1 decimal place', () => {
      render(<HiveView {...defaultProps} />);

      const currentTemp = screen.getByTestId('hive-tile-temp-current');
      expect(currentTemp).toHaveTextContent('19.5°');
    });

    it('should display target temperature with arrow', () => {
      render(<HiveView {...defaultProps} />);

      const targetTemp = screen.getByTestId('hive-tile-temp-target');
      expect(targetTemp).toHaveTextContent('→');
      expect(targetTemp).toHaveTextContent('21.0°');
    });

    it('should display mode badge', () => {
      render(<HiveView {...defaultProps} />);

      const heatingTile = screen.getByTestId('hive-tile-heating');
      const modeBadge = heatingTile.querySelector('[data-testid="hive-tile-mode"]');
      expect(modeBadge).toHaveTextContent('schedule');
    });

    it('should show heating tile with active class when heating is on', () => {
      render(<HiveView {...defaultProps} />);

      const heatingTile = screen.getByTestId('hive-tile-heating');
      expect(heatingTile).toHaveClass('active');
    });

    it('should show heating tile without active class when heating is off', () => {
      const propsWithHeatingOff = {
        ...defaultProps,
        status: {
          ...defaultProps.status,
          heating: { ...defaultProps.status.heating, isHeating: false },
        },
      };
      render(<HiveView {...propsWithHeatingOff} />);

      const heatingTile = screen.getByTestId('hive-tile-heating');
      expect(heatingTile).not.toHaveClass('active');
    });
  });

  describe('Hot Water Tile Display', () => {
    it('should display hot water label', () => {
      render(<HiveView {...defaultProps} />);

      const hotWaterTile = screen.getByTestId('hive-tile-hotwater');
      expect(hotWaterTile).toHaveTextContent(/hot water/i);
    });

    it('should show hot water tile without active class when off', () => {
      render(<HiveView {...defaultProps} />);

      const hotWaterTile = screen.getByTestId('hive-tile-hotwater');
      expect(hotWaterTile).not.toHaveClass('active');
    });

    it('should show hot water tile with active class when on', () => {
      const propsWithHotWaterOn = {
        ...defaultProps,
        status: {
          ...defaultProps.status,
          hotWater: { isOn: true, mode: 'on' },
        },
      };
      render(<HiveView {...propsWithHotWaterOn} />);

      const hotWaterTile = screen.getByTestId('hive-tile-hotwater');
      expect(hotWaterTile).toHaveClass('active');
    });
  });

  describe('Schedule Tiles Display', () => {
    it('should display schedule names', () => {
      render(<HiveView {...defaultProps} />);

      expect(screen.getByText('Morning Warmup')).toBeInTheDocument();
      expect(screen.getByText('Hot Water AM')).toBeInTheDocument();
    });

    it('should display schedule times', () => {
      render(<HiveView {...defaultProps} />);

      expect(screen.getByText('06:00')).toBeInTheDocument();
      expect(screen.getByText('07:00')).toBeInTheDocument();
    });

    it('should display info tile icons', () => {
      render(<HiveView {...defaultProps} />);

      const infoIcons = screen.getAllByTestId('hive-info-icon');
      expect(infoIcons).toHaveLength(2);
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator when loading', () => {
      render(<HiveView {...defaultProps} isLoading={true} status={null} />);

      expect(screen.getByText(UI_TEXT.HIVE_LOADING)).toBeInTheDocument();
    });

    it('should not show tiles when loading', () => {
      render(<HiveView {...defaultProps} isLoading={true} status={null} />);

      expect(screen.queryByTestId('hive-tile-heating')).not.toBeInTheDocument();
      expect(screen.queryByTestId('hive-tile-hotwater')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message on error', () => {
      render(<HiveView {...defaultProps} error="Failed to fetch Hive data" status={null} />);

      expect(screen.getByText(/Failed to fetch/)).toBeInTheDocument();
    });

    it('should show retry button on error', () => {
      render(<HiveView {...defaultProps} error="Connection failed" status={null} />);

      expect(screen.getByRole('button', { name: UI_TEXT.RETRY })).toBeInTheDocument();
    });

    it('should call onRetry when retry button clicked', async () => {
      const user = userEvent.setup();

      render(<HiveView {...defaultProps} error="Error" status={null} />);

      await user.click(screen.getByRole('button', { name: UI_TEXT.RETRY }));

      expect(defaultProps.onRetry).toHaveBeenCalled();
    });
  });

  // NOTE: Login Form and 2FA Form tests removed - demo mode assumes always connected.
  // Auth flows are tested manually.

  describe('Accessibility', () => {
    it('should have accessible heating tile with temperature info', () => {
      render(<HiveView {...defaultProps} />);

      const heatingTile = screen.getByTestId('hive-tile-heating');
      const ariaLabel = heatingTile.getAttribute('aria-label');
      expect(ariaLabel).toContain('degree');
    });

    it('should have accessible hot water tile', () => {
      render(<HiveView {...defaultProps} />);

      const hotWaterTile = screen.getByTestId('hive-tile-hotwater');
      const ariaLabel = hotWaterTile.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });

    it('should have accessible info tiles', () => {
      render(<HiveView {...defaultProps} />);

      const infoTiles = screen.getAllByTestId('hive-info-tile');
      infoTiles.forEach((tile) => {
        const ariaLabel = tile.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
      });
    });
  });
});
