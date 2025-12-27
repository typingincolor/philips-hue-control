import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsDrawer } from './SettingsDrawer';
import { UI_TEXT } from '../../constants/uiText';

describe('SettingsDrawer', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    location: { lat: 51.5074, lon: -0.1278, name: 'London' },
    settings: { units: 'celsius', weatherEnabled: true },
    onUpdateSettings: vi.fn(),
    onDetectLocation: vi.fn(),
    isDetecting: false,
    locationError: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('visibility', () => {
    it('should render when isOpen is true', () => {
      render(<SettingsDrawer {...defaultProps} />);

      expect(screen.getByText(UI_TEXT.SETTINGS_TITLE)).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<SettingsDrawer {...defaultProps} isOpen={false} />);

      expect(screen.queryByText(UI_TEXT.SETTINGS_TITLE)).not.toBeInTheDocument();
    });
  });

  describe('location section', () => {
    it('should display current location', () => {
      render(<SettingsDrawer {...defaultProps} />);

      expect(screen.getByText('London')).toBeInTheDocument();
    });

    it('should display detect location button', () => {
      render(<SettingsDrawer {...defaultProps} />);

      expect(screen.getByText(UI_TEXT.SETTINGS_DETECT_LOCATION)).toBeInTheDocument();
    });

    it('should call onDetectLocation when detect button clicked', async () => {
      const user = userEvent.setup();
      render(<SettingsDrawer {...defaultProps} />);

      await user.click(screen.getByText(UI_TEXT.SETTINGS_DETECT_LOCATION));

      expect(defaultProps.onDetectLocation).toHaveBeenCalledTimes(1);
    });

    it('should show detecting state', () => {
      render(<SettingsDrawer {...defaultProps} isDetecting={true} />);

      expect(screen.getByText(UI_TEXT.SETTINGS_DETECTING)).toBeInTheDocument();
    });

    it('should disable detect button when detecting', () => {
      render(<SettingsDrawer {...defaultProps} isDetecting={true} />);

      const button = screen.getByRole('button', { name: UI_TEXT.SETTINGS_DETECTING });
      expect(button).toBeDisabled();
    });

    it('should show location error', () => {
      render(<SettingsDrawer {...defaultProps} locationError="Location access denied" />);

      expect(screen.getByText('Location access denied')).toBeInTheDocument();
    });

    it('should show placeholder when no location', () => {
      render(<SettingsDrawer {...defaultProps} location={null} />);

      expect(screen.getByText(UI_TEXT.WEATHER_SET_LOCATION)).toBeInTheDocument();
    });
  });

  describe('units section', () => {
    it('should display celsius as selected', () => {
      render(<SettingsDrawer {...defaultProps} />);

      const celsiusButton = screen.getByRole('button', { name: UI_TEXT.SETTINGS_CELSIUS });
      expect(celsiusButton).toHaveClass('selected');
    });

    it('should display fahrenheit as not selected', () => {
      render(<SettingsDrawer {...defaultProps} />);

      const fahrenheitButton = screen.getByRole('button', { name: UI_TEXT.SETTINGS_FAHRENHEIT });
      expect(fahrenheitButton).not.toHaveClass('selected');
    });

    it('should call onUpdateSettings with fahrenheit when clicked', async () => {
      const user = userEvent.setup();
      render(<SettingsDrawer {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: UI_TEXT.SETTINGS_FAHRENHEIT }));

      expect(defaultProps.onUpdateSettings).toHaveBeenCalledWith({ units: 'fahrenheit' });
    });

    it('should show fahrenheit as selected when units is fahrenheit', () => {
      render(
        <SettingsDrawer
          {...defaultProps}
          settings={{ units: 'fahrenheit', weatherEnabled: true }}
        />
      );

      const fahrenheitButton = screen.getByRole('button', { name: UI_TEXT.SETTINGS_FAHRENHEIT });
      expect(fahrenheitButton).toHaveClass('selected');
    });
  });

  describe('close behavior', () => {
    it('should call onClose when close button clicked', async () => {
      const user = userEvent.setup();
      render(<SettingsDrawer {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /close/i }));

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when overlay clicked', async () => {
      const user = userEvent.setup();
      render(<SettingsDrawer {...defaultProps} />);

      await user.click(screen.getByTestId('settings-drawer-overlay'));

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Escape key pressed', () => {
      render(<SettingsDrawer {...defaultProps} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('hive section', () => {
    const hiveProps = {
      ...defaultProps,
      hiveConnected: false,
      hiveConnecting: false,
      hiveError: null,
      onHiveConnect: vi.fn(),
      onHiveDisconnect: vi.fn(),
    };

    it('should display Hive section label', () => {
      render(<SettingsDrawer {...hiveProps} />);

      expect(screen.getByText(UI_TEXT.SETTINGS_HIVE)).toBeInTheDocument();
    });

    it('should show username input when disconnected', () => {
      render(<SettingsDrawer {...hiveProps} />);

      expect(screen.getByPlaceholderText(UI_TEXT.HIVE_USERNAME_PLACEHOLDER)).toBeInTheDocument();
    });

    it('should show password input when disconnected', () => {
      render(<SettingsDrawer {...hiveProps} />);

      expect(screen.getByPlaceholderText(UI_TEXT.HIVE_PASSWORD_PLACEHOLDER)).toBeInTheDocument();
    });

    it('should show Connect button when disconnected', () => {
      render(<SettingsDrawer {...hiveProps} />);

      expect(screen.getByRole('button', { name: UI_TEXT.HIVE_CONNECT })).toBeInTheDocument();
    });

    it('should call onHiveConnect with credentials when Connect clicked', async () => {
      const user = userEvent.setup();
      render(<SettingsDrawer {...hiveProps} />);

      await user.type(
        screen.getByPlaceholderText(UI_TEXT.HIVE_USERNAME_PLACEHOLDER),
        'test@hive.com'
      );
      await user.type(
        screen.getByPlaceholderText(UI_TEXT.HIVE_PASSWORD_PLACEHOLDER),
        'password123'
      );
      await user.click(screen.getByRole('button', { name: UI_TEXT.HIVE_CONNECT }));

      expect(hiveProps.onHiveConnect).toHaveBeenCalledWith('test@hive.com', 'password123');
    });

    it('should disable inputs while connecting', () => {
      render(<SettingsDrawer {...hiveProps} hiveConnecting={true} />);

      expect(screen.getByPlaceholderText(UI_TEXT.HIVE_USERNAME_PLACEHOLDER)).toBeDisabled();
      expect(screen.getByPlaceholderText(UI_TEXT.HIVE_PASSWORD_PLACEHOLDER)).toBeDisabled();
    });

    it('should show connecting state on button', () => {
      render(<SettingsDrawer {...hiveProps} hiveConnecting={true} />);

      expect(screen.getByRole('button', { name: UI_TEXT.HIVE_CONNECTING })).toBeInTheDocument();
    });

    it('should show error message when hiveError is set', () => {
      render(<SettingsDrawer {...hiveProps} hiveError="Invalid credentials" />);

      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    it('should show Connected status when connected', () => {
      render(<SettingsDrawer {...hiveProps} hiveConnected={true} />);

      expect(screen.getByText(UI_TEXT.HIVE_CONNECTED)).toBeInTheDocument();
    });

    it('should show Disconnect button when connected', () => {
      render(<SettingsDrawer {...hiveProps} hiveConnected={true} />);

      expect(screen.getByRole('button', { name: UI_TEXT.HIVE_DISCONNECT })).toBeInTheDocument();
    });

    it('should hide credential inputs when connected', () => {
      render(<SettingsDrawer {...hiveProps} hiveConnected={true} />);

      expect(
        screen.queryByPlaceholderText(UI_TEXT.HIVE_USERNAME_PLACEHOLDER)
      ).not.toBeInTheDocument();
      expect(
        screen.queryByPlaceholderText(UI_TEXT.HIVE_PASSWORD_PLACEHOLDER)
      ).not.toBeInTheDocument();
    });

    it('should call onHiveDisconnect when Disconnect clicked', async () => {
      const user = userEvent.setup();
      render(<SettingsDrawer {...hiveProps} hiveConnected={true} />);

      await user.click(screen.getByRole('button', { name: UI_TEXT.HIVE_DISCONNECT }));

      expect(hiveProps.onHiveDisconnect).toHaveBeenCalled();
    });
  });
});
