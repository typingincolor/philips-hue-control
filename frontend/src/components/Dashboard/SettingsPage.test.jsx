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
    hiveConnected: false,
    onHiveDisconnect: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('layout', () => {
    it('should render settings page with header', () => {
      render(<SettingsPage {...defaultProps} />);

      expect(screen.getByText(UI_TEXT.SETTINGS_TITLE)).toBeInTheDocument();
    });

    it('should render back button', () => {
      render(<SettingsPage {...defaultProps} />);

      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    it('should call onBack when back button clicked', async () => {
      const user = userEvent.setup();
      render(<SettingsPage {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /back/i }));

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

    it('should display detect location button', () => {
      render(<SettingsPage {...defaultProps} />);

      expect(screen.getByText(UI_TEXT.SETTINGS_DETECT_LOCATION)).toBeInTheDocument();
    });

    it('should call onDetectLocation when detect button clicked', async () => {
      const user = userEvent.setup();
      render(<SettingsPage {...defaultProps} />);

      await user.click(screen.getByText(UI_TEXT.SETTINGS_DETECT_LOCATION));

      expect(defaultProps.onDetectLocation).toHaveBeenCalledTimes(1);
    });

    it('should show detecting state', () => {
      render(<SettingsPage {...defaultProps} isDetecting={true} />);

      expect(screen.getByText(UI_TEXT.SETTINGS_DETECTING)).toBeInTheDocument();
    });

    it('should disable detect button when detecting', () => {
      render(<SettingsPage {...defaultProps} isDetecting={true} />);

      const button = screen.getByRole('button', { name: UI_TEXT.SETTINGS_DETECTING });
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
    it('should display celsius as selected', () => {
      render(<SettingsPage {...defaultProps} />);

      const celsiusButton = screen.getByRole('button', { name: UI_TEXT.SETTINGS_CELSIUS });
      expect(celsiusButton).toHaveClass('selected');
    });

    it('should display fahrenheit as not selected', () => {
      render(<SettingsPage {...defaultProps} />);

      const fahrenheitButton = screen.getByRole('button', { name: UI_TEXT.SETTINGS_FAHRENHEIT });
      expect(fahrenheitButton).not.toHaveClass('selected');
    });

    it('should call onUpdateSettings with fahrenheit when clicked', async () => {
      const user = userEvent.setup();
      render(<SettingsPage {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: UI_TEXT.SETTINGS_FAHRENHEIT }));

      expect(defaultProps.onUpdateSettings).toHaveBeenCalledWith({ units: 'fahrenheit' });
    });

    it('should show fahrenheit as selected when units is fahrenheit', () => {
      render(
        <SettingsPage
          {...defaultProps}
          settings={{
            ...defaultProps.settings,
            units: 'fahrenheit',
          }}
        />
      );

      const fahrenheitButton = screen.getByRole('button', { name: UI_TEXT.SETTINGS_FAHRENHEIT });
      expect(fahrenheitButton).toHaveClass('selected');
    });
  });

  describe('hive section', () => {
    it('should display Hive section when Hive service is enabled', () => {
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

      // Use querySelector for the section since SETTINGS_HIVE text appears in toggle too
      const hiveSection = document.querySelector('.settings-hive-section');
      expect(hiveSection).toBeInTheDocument();
    });

    it('should hide Hive section when Hive service is disabled', () => {
      render(<SettingsPage {...defaultProps} />);

      // Hive section should not be visible when service is disabled
      const hiveSection = document.querySelector('.settings-hive-section');
      expect(hiveSection).not.toBeInTheDocument();
    });

    it('should show Connected status when connected', () => {
      const props = {
        ...defaultProps,
        hiveConnected: true,
        settings: {
          ...defaultProps.settings,
          services: {
            hue: { enabled: true },
            hive: { enabled: true },
          },
        },
      };
      render(<SettingsPage {...props} />);

      expect(screen.getByText(UI_TEXT.HIVE_CONNECTED)).toBeInTheDocument();
    });

    it('should show Disconnect button when connected', () => {
      const props = {
        ...defaultProps,
        hiveConnected: true,
        settings: {
          ...defaultProps.settings,
          services: {
            hue: { enabled: true },
            hive: { enabled: true },
          },
        },
      };
      render(<SettingsPage {...props} />);

      expect(screen.getByRole('button', { name: UI_TEXT.HIVE_DISCONNECT })).toBeInTheDocument();
    });

    it('should call onHiveDisconnect when Disconnect clicked', async () => {
      const user = userEvent.setup();
      const props = {
        ...defaultProps,
        hiveConnected: true,
        settings: {
          ...defaultProps.settings,
          services: {
            hue: { enabled: true },
            hive: { enabled: true },
          },
        },
      };
      render(<SettingsPage {...props} />);

      await user.click(screen.getByRole('button', { name: UI_TEXT.HIVE_DISCONNECT }));

      expect(props.onHiveDisconnect).toHaveBeenCalled();
    });
  });

  describe('auto-save indicator', () => {
    it('should display auto-saved message', () => {
      render(<SettingsPage {...defaultProps} />);

      expect(screen.getByText(UI_TEXT.SETTINGS_AUTO_SAVED)).toBeInTheDocument();
    });
  });

  describe('keyboard navigation', () => {
    it('should call onBack when Escape key pressed', () => {
      render(<SettingsPage {...defaultProps} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(defaultProps.onBack).toHaveBeenCalledTimes(1);
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

    it('should have back button with accessible name', () => {
      render(<SettingsPage {...defaultProps} />);

      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
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
