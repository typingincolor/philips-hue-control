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
});
