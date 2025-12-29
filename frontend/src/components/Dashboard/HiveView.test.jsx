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

  describe('Login Form (Not Connected)', () => {
    const loginProps = {
      isConnected: false,
      status: null,
      schedules: [],
      isLoading: false,
      error: null,
      onConnect: vi.fn(),
      onVerify2fa: vi.fn(),
      onCancel2fa: vi.fn(),
      requires2fa: false,
      isConnecting: false,
      isVerifying: false,
    };

    it('should display login form when not connected', () => {
      render(<HiveView {...loginProps} />);

      expect(screen.getByText(UI_TEXT.HIVE_LOGIN_TITLE)).toBeInTheDocument();
    });

    it('should show email input', () => {
      render(<HiveView {...loginProps} />);

      expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    });

    it('should show password input', () => {
      render(<HiveView {...loginProps} />);

      expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    });

    it('should show Connect button', () => {
      render(<HiveView {...loginProps} />);

      expect(screen.getByRole('button', { name: UI_TEXT.HIVE_CONNECT })).toBeInTheDocument();
    });

    it('should call onConnect with credentials when form submitted', async () => {
      const user = userEvent.setup();
      render(<HiveView {...loginProps} />);

      await user.type(screen.getByPlaceholderText(/email/i), 'test@hive.com');
      await user.type(screen.getByPlaceholderText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: UI_TEXT.HIVE_CONNECT }));

      expect(loginProps.onConnect).toHaveBeenCalledWith('test@hive.com', 'password123');
    });

    it('should show Connecting... button when connecting', () => {
      render(<HiveView {...loginProps} isConnecting={true} />);

      expect(screen.getByRole('button', { name: UI_TEXT.HIVE_CONNECTING })).toBeInTheDocument();
    });

    it('should disable inputs when connecting', () => {
      render(<HiveView {...loginProps} isConnecting={true} />);

      expect(screen.getByPlaceholderText(/email/i)).toBeDisabled();
      expect(screen.getByPlaceholderText(/password/i)).toBeDisabled();
    });

    it('should show error message on login failure', () => {
      render(<HiveView {...loginProps} error={UI_TEXT.HIVE_INVALID_CREDENTIALS} />);

      expect(screen.getByText(UI_TEXT.HIVE_INVALID_CREDENTIALS)).toBeInTheDocument();
    });

    it('should have error with aria-live for screen readers', () => {
      render(<HiveView {...loginProps} error="Login failed" />);

      expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('2FA Form', () => {
    const twoFaProps = {
      isConnected: false,
      status: null,
      schedules: [],
      isLoading: false,
      error: null,
      onConnect: vi.fn(),
      onVerify2fa: vi.fn(),
      onCancel2fa: vi.fn(),
      requires2fa: true,
      isConnecting: false,
      isVerifying: false,
      pendingUsername: 'user@hive.com',
    };

    it('should display 2FA form when requires2fa is true', () => {
      render(<HiveView {...twoFaProps} />);

      expect(screen.getByText(UI_TEXT.HIVE_2FA_TITLE)).toBeInTheDocument();
    });

    it('should show 2FA description', () => {
      render(<HiveView {...twoFaProps} />);

      expect(screen.getByText(UI_TEXT.HIVE_2FA_DESCRIPTION)).toBeInTheDocument();
    });

    it('should show code input', () => {
      render(<HiveView {...twoFaProps} />);

      expect(screen.getByPlaceholderText(UI_TEXT.HIVE_2FA_PLACEHOLDER)).toBeInTheDocument();
    });

    it('should show Verify button', () => {
      render(<HiveView {...twoFaProps} />);

      expect(screen.getByRole('button', { name: UI_TEXT.HIVE_VERIFY })).toBeInTheDocument();
    });

    it('should show back to login link', () => {
      render(<HiveView {...twoFaProps} />);

      expect(screen.getByText(UI_TEXT.HIVE_BACK_TO_LOGIN)).toBeInTheDocument();
    });

    it('should hide login form when showing 2FA', () => {
      render(<HiveView {...twoFaProps} />);

      expect(screen.queryByPlaceholderText(/password/i)).not.toBeInTheDocument();
    });

    it('should call onVerify2fa with code when submitted', async () => {
      const user = userEvent.setup();
      render(<HiveView {...twoFaProps} />);

      await user.type(screen.getByPlaceholderText(UI_TEXT.HIVE_2FA_PLACEHOLDER), '123456');
      await user.click(screen.getByRole('button', { name: UI_TEXT.HIVE_VERIFY }));

      expect(twoFaProps.onVerify2fa).toHaveBeenCalledWith('123456');
    });

    it('should show Verifying... button when verifying', () => {
      render(<HiveView {...twoFaProps} isVerifying={true} />);

      expect(screen.getByRole('button', { name: UI_TEXT.HIVE_VERIFYING })).toBeInTheDocument();
    });

    it('should disable code input when verifying', () => {
      render(<HiveView {...twoFaProps} isVerifying={true} />);

      expect(screen.getByPlaceholderText(UI_TEXT.HIVE_2FA_PLACEHOLDER)).toBeDisabled();
    });

    it('should call onCancel2fa when back link clicked', async () => {
      const user = userEvent.setup();
      render(<HiveView {...twoFaProps} />);

      await user.click(screen.getByText(UI_TEXT.HIVE_BACK_TO_LOGIN));

      expect(twoFaProps.onCancel2fa).toHaveBeenCalled();
    });

    it('should show error message for invalid code', () => {
      render(<HiveView {...twoFaProps} error={UI_TEXT.HIVE_INVALID_CODE} />);

      expect(screen.getByText(UI_TEXT.HIVE_INVALID_CODE)).toBeInTheDocument();
    });

    it('should focus code input when 2FA form appears', () => {
      render(<HiveView {...twoFaProps} />);

      expect(screen.getByPlaceholderText(UI_TEXT.HIVE_2FA_PLACEHOLDER)).toHaveFocus();
    });
  });

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
