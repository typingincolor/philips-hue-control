import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsPage } from './SettingsPage';
import { UI_TEXT } from '../../constants/uiText';

describe('SettingsPage', () => {
  const defaultProps = {
    onBack: vi.fn(),
    location: { lat: 51.5074, lon: -0.1278, name: 'London' },
    settings: {
      units: 'celsius',
      services: {
        hue: { enabled: true },
        hive: { enabled: false },
      },
    },
    onUpdateSettings: vi.fn(),
    onDetectLocation: vi.fn(),
    isDetecting: false,
    locationError: null,
    hueConnected: true,
    hiveConnected: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('layout', () => {
    it('should render settings page with header', () => {
      render(<SettingsPage {...defaultProps} />);

      expect(screen.getByText(UI_TEXT.SETTINGS_TITLE)).toBeInTheDocument();
    });

    it('should render close button when Hue is connected', () => {
      render(<SettingsPage {...defaultProps} hueConnected={true} hiveConnected={false} />);

      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });

    it('should render close button when Hive is connected', () => {
      render(<SettingsPage {...defaultProps} hueConnected={false} hiveConnected={true} />);

      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });

    it('should render close button when both services are connected', () => {
      render(<SettingsPage {...defaultProps} hueConnected={true} hiveConnected={true} />);

      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });

    it('should NOT render close button when no services are connected', () => {
      render(<SettingsPage {...defaultProps} hueConnected={false} hiveConnected={false} />);

      expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
    });

    it('should call onBack when close button clicked', async () => {
      const user = userEvent.setup();
      render(<SettingsPage {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /close/i }));

      expect(defaultProps.onBack).toHaveBeenCalledTimes(1);
    });

    it('should have settings-page class', () => {
      render(<SettingsPage {...defaultProps} />);

      expect(document.querySelector('.settings-page')).toBeInTheDocument();
    });
  });

  describe('service activation', () => {
    it('should display Services section', () => {
      render(<SettingsPage {...defaultProps} />);

      expect(screen.getByText(UI_TEXT.SETTINGS_SERVICES)).toBeInTheDocument();
    });

    it('should display Hue service toggle', () => {
      render(<SettingsPage {...defaultProps} />);

      expect(screen.getByText(UI_TEXT.SETTINGS_HUE_SERVICE)).toBeInTheDocument();
    });

    it('should display Hive service toggle', () => {
      render(<SettingsPage {...defaultProps} />);

      expect(screen.getByText(UI_TEXT.SETTINGS_HIVE_SERVICE)).toBeInTheDocument();
    });

    it('should show Hue toggle as enabled by default', () => {
      render(<SettingsPage {...defaultProps} />);

      const hueToggle = screen.getByRole('switch', { name: /hue/i });
      expect(hueToggle).toBeChecked();
    });

    it('should show Hive toggle as disabled by default', () => {
      render(<SettingsPage {...defaultProps} />);

      const hiveToggle = screen.getByRole('switch', { name: /hive/i });
      expect(hiveToggle).not.toBeChecked();
    });

    it('should call onUpdateSettings when Hive toggle clicked', async () => {
      const user = userEvent.setup();
      render(<SettingsPage {...defaultProps} />);

      await user.click(screen.getByRole('switch', { name: /hive/i }));

      expect(defaultProps.onUpdateSettings).toHaveBeenCalledWith({
        services: { hive: { enabled: true } },
      });
    });

    it('should call onUpdateSettings when Hue toggle clicked', async () => {
      const user = userEvent.setup();
      render(<SettingsPage {...defaultProps} />);

      await user.click(screen.getByRole('switch', { name: /hue/i }));

      expect(defaultProps.onUpdateSettings).toHaveBeenCalledWith({
        services: { hue: { enabled: false } },
      });
    });

    it('should show Hive toggle as enabled when services.hive.enabled is true', () => {
      const props = {
        ...defaultProps,
        settings: {
          ...defaultProps.settings,
          services: {
            hue: { enabled: true },
            hive: { enabled: true },
          },
        },
      };
      render(<SettingsPage {...props} />);

      const hiveToggle = screen.getByRole('switch', { name: /hive/i });
      expect(hiveToggle).toBeChecked();
    });
  });

  describe('location section', () => {
    it('should display current location', () => {
      render(<SettingsPage {...defaultProps} />);

      expect(screen.getByText('London')).toBeInTheDocument();
    });

    it('should display detect location button with icon', () => {
      render(<SettingsPage {...defaultProps} />);

      // Button is now an icon button with aria-label
      const detectButton = screen.getByRole('button', { name: UI_TEXT.SETTINGS_DETECT_LOCATION });
      expect(detectButton).toBeInTheDocument();
    });

    it('should call onDetectLocation when detect button clicked', async () => {
      const user = userEvent.setup();
      render(<SettingsPage {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: UI_TEXT.SETTINGS_DETECT_LOCATION }));

      expect(defaultProps.onDetectLocation).toHaveBeenCalledTimes(1);
    });

    it('should show spinner icon when detecting', () => {
      render(<SettingsPage {...defaultProps} isDetecting={true} />);

      // Button shows spinner icon instead of locate icon when detecting
      const detectButton = document.querySelector('.settings-detect-btn');
      const spinner = detectButton.querySelector('.icon-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should disable detect button when detecting', () => {
      render(<SettingsPage {...defaultProps} isDetecting={true} />);

      const button = screen.getByRole('button', { name: UI_TEXT.SETTINGS_DETECT_LOCATION });
      expect(button).toBeDisabled();
    });

    it('should show location error', () => {
      render(<SettingsPage {...defaultProps} locationError="Location access denied" />);

      expect(screen.getByText('Location access denied')).toBeInTheDocument();
    });

    it('should show placeholder when no location', () => {
      render(<SettingsPage {...defaultProps} location={null} />);

      expect(screen.getByText(UI_TEXT.WEATHER_SET_LOCATION)).toBeInTheDocument();
    });
  });

  describe('units section', () => {
    it('should display temperature toggle with celsius selected', () => {
      render(<SettingsPage {...defaultProps} />);

      // Toggle is checked when celsius is selected
      const toggle = document.querySelector('.settings-units-toggle input');
      expect(toggle).toBeChecked();
    });

    it('should display ℉ and ℃ labels', () => {
      render(<SettingsPage {...defaultProps} />);

      expect(screen.getByText('℉')).toBeInTheDocument();
      expect(screen.getByText('℃')).toBeInTheDocument();
    });

    it('should call onUpdateSettings with fahrenheit when toggle unchecked', async () => {
      const user = userEvent.setup();
      render(<SettingsPage {...defaultProps} />);

      // Toggle is currently checked (celsius), clicking unchecks it (fahrenheit)
      const toggle = document.querySelector('.settings-units-toggle input');
      await user.click(toggle);

      expect(defaultProps.onUpdateSettings).toHaveBeenCalledWith({ units: 'fahrenheit' });
    });

    it('should show toggle unchecked when units is fahrenheit', () => {
      render(
        <SettingsPage
          {...defaultProps}
          settings={{
            ...defaultProps.settings,
            units: 'fahrenheit',
          }}
        />
      );

      const toggle = document.querySelector('.settings-units-toggle input');
      expect(toggle).not.toBeChecked();
    });

    it('should call onUpdateSettings with celsius when toggle checked', async () => {
      const user = userEvent.setup();
      render(
        <SettingsPage
          {...defaultProps}
          settings={{
            ...defaultProps.settings,
            units: 'fahrenheit',
          }}
        />
      );

      // Toggle is currently unchecked (fahrenheit), clicking checks it (celsius)
      const toggle = document.querySelector('.settings-units-toggle input');
      await user.click(toggle);

      expect(defaultProps.onUpdateSettings).toHaveBeenCalledWith({ units: 'celsius' });
    });
  });

  describe('auto-save indicator', () => {
    it('should display auto-saved message', () => {
      render(<SettingsPage {...defaultProps} />);

      expect(screen.getByText(UI_TEXT.SETTINGS_AUTO_SAVED)).toBeInTheDocument();
    });
  });

  describe('keyboard navigation', () => {
    it('should call onBack when Escape key pressed and close is allowed', () => {
      render(<SettingsPage {...defaultProps} hueConnected={true} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(defaultProps.onBack).toHaveBeenCalledTimes(1);
    });

    it('should NOT call onBack when Escape pressed if no services connected', () => {
      render(<SettingsPage {...defaultProps} hueConnected={false} hiveConnected={false} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(defaultProps.onBack).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have accessible toggle switches', () => {
      render(<SettingsPage {...defaultProps} />);

      const hueToggle = screen.getByRole('switch', { name: /hue/i });
      const hiveToggle = screen.getByRole('switch', { name: /hive/i });

      expect(hueToggle).toBeInTheDocument();
      expect(hiveToggle).toBeInTheDocument();
    });

    it('should have close button with accessible name when services connected', () => {
      render(<SettingsPage {...defaultProps} hueConnected={true} />);

      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });
  });

  describe('deferred service activation', () => {
    it('should call onEnableHue when Hue toggle turned ON while not connected', async () => {
      const user = userEvent.setup();
      const onEnableHue = vi.fn();
      const props = {
        ...defaultProps,
        hueConnected: false,
        onEnableHue,
        settings: {
          ...defaultProps.settings,
          services: {
            hue: { enabled: false },
            hive: { enabled: false },
          },
        },
      };
      render(<SettingsPage {...props} />);

      await user.click(screen.getByRole('switch', { name: /hue/i }));

      expect(onEnableHue).toHaveBeenCalledTimes(1);
      // Should NOT call onUpdateSettings when triggering auth flow
      expect(props.onUpdateSettings).not.toHaveBeenCalled();
    });

    it('should call onEnableHive when Hive toggle turned ON while not connected', async () => {
      const user = userEvent.setup();
      const onEnableHive = vi.fn();
      const props = {
        ...defaultProps,
        hiveConnected: false,
        onEnableHive,
        settings: {
          ...defaultProps.settings,
          services: {
            hue: { enabled: true },
            hive: { enabled: false },
          },
        },
      };
      render(<SettingsPage {...props} />);

      await user.click(screen.getByRole('switch', { name: /hive/i }));

      expect(onEnableHive).toHaveBeenCalledTimes(1);
      // Should NOT call onUpdateSettings when triggering auth flow
      expect(props.onUpdateSettings).not.toHaveBeenCalled();
    });

    it('should call onDisableHue when disabling Hue service', async () => {
      const user = userEvent.setup();
      const onDisableHue = vi.fn();
      const props = {
        ...defaultProps,
        hueConnected: true,
        onDisableHue,
        settings: {
          ...defaultProps.settings,
          services: {
            hue: { enabled: true },
            hive: { enabled: false },
          },
        },
      };
      render(<SettingsPage {...props} />);

      await user.click(screen.getByRole('switch', { name: /hue/i }));

      // When disabling Hue, should call onDisableHue callback
      expect(onDisableHue).toHaveBeenCalledTimes(1);
      // Should NOT call onUpdateSettings - the callback handles it
      expect(props.onUpdateSettings).not.toHaveBeenCalled();
    });

    it('should call onDisableHive when disabling Hive service', async () => {
      const user = userEvent.setup();
      const onDisableHive = vi.fn();
      const props = {
        ...defaultProps,
        hiveConnected: true,
        onDisableHive,
        settings: {
          ...defaultProps.settings,
          services: {
            hue: { enabled: true },
            hive: { enabled: true },
          },
        },
      };
      render(<SettingsPage {...props} />);

      await user.click(screen.getByRole('switch', { name: /hive/i }));

      // When disabling Hive, should call onDisableHive callback
      expect(onDisableHive).toHaveBeenCalledTimes(1);
      // Should NOT call onUpdateSettings - the callback handles it
      expect(props.onUpdateSettings).not.toHaveBeenCalled();
    });

    it('should call onUpdateSettings when disabling Hue without onDisableHue callback', async () => {
      const user = userEvent.setup();
      const props = {
        ...defaultProps,
        hueConnected: true,
        // onDisableHue not provided
        settings: {
          ...defaultProps.settings,
          services: {
            hue: { enabled: true },
            hive: { enabled: false },
          },
        },
      };
      render(<SettingsPage {...props} />);

      await user.click(screen.getByRole('switch', { name: /hue/i }));

      // Fallback: When disabling without callback, should update settings
      expect(props.onUpdateSettings).toHaveBeenCalledWith({
        services: { hue: { enabled: false } },
      });
    });

    it('should call onUpdateSettings when disabling Hive without onDisableHive callback', async () => {
      const user = userEvent.setup();
      const props = {
        ...defaultProps,
        hiveConnected: true,
        // onDisableHive not provided
        settings: {
          ...defaultProps.settings,
          services: {
            hue: { enabled: true },
            hive: { enabled: true },
          },
        },
      };
      render(<SettingsPage {...props} />);

      await user.click(screen.getByRole('switch', { name: /hive/i }));

      // Fallback: When disabling without callback, should update settings
      expect(props.onUpdateSettings).toHaveBeenCalledWith({
        services: { hive: { enabled: false } },
      });
    });

    it('should show connected indicator for Hue service', () => {
      render(<SettingsPage {...defaultProps} hueConnected={true} />);

      // Find the Hue toggle's parent and check for connected status
      const hueToggle = screen.getByRole('switch', { name: /hue/i });
      const toggleWrapper = hueToggle.closest('.service-toggle');
      const statusIndicator = toggleWrapper.querySelector('.service-status');
      expect(statusIndicator).toHaveClass('connected');
    });

    it('should show disconnected indicator for Hue service when not connected', () => {
      render(<SettingsPage {...defaultProps} hueConnected={false} />);

      const hueToggle = screen.getByRole('switch', { name: /hue/i });
      const toggleWrapper = hueToggle.closest('.service-toggle');
      const statusIndicator = toggleWrapper.querySelector('.service-status');
      expect(statusIndicator).toHaveClass('disconnected');
    });
  });
});
