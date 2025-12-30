import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SettingsPage } from './SettingsPage';
import { UI_TEXT } from '../../constants/uiText';
import { VIEWPORTS, setupViewport, resetViewport } from '../../test/layoutTestUtils';

/**
 * SettingsPage Layout Tests
 *
 * Tests the structural layout requirements for the Settings page:
 * - Header with title and close button (when services connected)
 * - Content sections (Services, Location, Units)
 * - Footer with auto-save message
 * - Proper CSS classes for styling
 */

describe('SettingsPage Layout', () => {
  const defaultProps = {
    onBack: vi.fn(),
    location: { lat: 51.5, lon: -0.1, name: 'London, UK' },
    settings: {
      units: 'celsius',
      services: {
        hue: { enabled: true },
        hive: { enabled: true },
      },
    },
    onUpdateSettings: vi.fn(),
    onDetectLocation: vi.fn(),
    isDetecting: false,
    locationError: null,
    hueConnected: true,
    hiveConnected: true,
    onEnableHue: vi.fn(),
    onEnableHive: vi.fn(),
    onDisableHue: vi.fn(),
    onDisableHive: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetViewport();
  });

  describe('Core Structure', () => {
    it('should render settings-page container', () => {
      render(<SettingsPage {...defaultProps} />);

      const container = document.querySelector('.settings-page');
      expect(container).toBeInTheDocument();
    });

    it('should render settings-header', () => {
      render(<SettingsPage {...defaultProps} />);

      const header = document.querySelector('.settings-header');
      expect(header).toBeInTheDocument();
    });

    it('should render settings-content', () => {
      render(<SettingsPage {...defaultProps} />);

      const content = document.querySelector('.settings-content');
      expect(content).toBeInTheDocument();
    });

    it('should render settings-footer', () => {
      render(<SettingsPage {...defaultProps} />);

      const footer = document.querySelector('.settings-footer');
      expect(footer).toBeInTheDocument();
    });
  });

  describe('Header Layout', () => {
    it('should render close button when services connected', () => {
      render(<SettingsPage {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveClass('settings-close-btn');
    });

    it('should NOT render close button when no services connected', () => {
      render(<SettingsPage {...defaultProps} hueConnected={false} hiveConnected={false} />);

      expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
    });

    it('should render title', () => {
      render(<SettingsPage {...defaultProps} />);

      const title = document.querySelector('.settings-header-title');
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent(UI_TEXT.SETTINGS_TITLE);
    });

    it('should have title before close button in DOM order', () => {
      render(<SettingsPage {...defaultProps} />);

      const header = document.querySelector('.settings-header');
      const title = header.querySelector('.settings-header-title');
      const closeButton = header.querySelector('.settings-close-btn');

      // Title should come before close button (DOCUMENT_POSITION_FOLLOWING = 4)
      expect(title.compareDocumentPosition(closeButton) & 4).toBeTruthy();
    });
  });

  describe('Services Section Layout', () => {
    it('should render services section', () => {
      render(<SettingsPage {...defaultProps} />);

      expect(screen.getByText(UI_TEXT.SETTINGS_SERVICES)).toBeInTheDocument();
    });

    it('should render settings-services container', () => {
      render(<SettingsPage {...defaultProps} />);

      const services = document.querySelector('.settings-services');
      expect(services).toBeInTheDocument();
    });

    it('should render Hue service toggle', () => {
      render(<SettingsPage {...defaultProps} />);

      expect(screen.getByText(UI_TEXT.SETTINGS_HUE_SERVICE)).toBeInTheDocument();
    });

    it('should render Hive service toggle', () => {
      render(<SettingsPage {...defaultProps} />);

      expect(screen.getByText(UI_TEXT.SETTINGS_HIVE_SERVICE)).toBeInTheDocument();
    });

    it('should render service toggles with checkbox role=switch', () => {
      render(<SettingsPage {...defaultProps} />);

      // 2 service toggles + 1 temperature toggle = 3 switches
      const switches = screen.getAllByRole('switch');
      expect(switches.length).toBe(3);
    });

    it('should show connection status indicators', () => {
      render(<SettingsPage {...defaultProps} />);

      const statusIndicators = document.querySelectorAll('.service-status');
      expect(statusIndicators.length).toBe(2);
    });
  });

  describe('Location Section Layout', () => {
    it('should render location section', () => {
      render(<SettingsPage {...defaultProps} />);

      expect(screen.getByText(UI_TEXT.SETTINGS_LOCATION)).toBeInTheDocument();
    });

    it('should render settings-location container', () => {
      render(<SettingsPage {...defaultProps} />);

      const location = document.querySelector('.settings-location');
      expect(location).toBeInTheDocument();
    });

    it('should render current location display', () => {
      render(<SettingsPage {...defaultProps} />);

      const locationCurrent = document.querySelector('.settings-location-current');
      expect(locationCurrent).toBeInTheDocument();
      expect(locationCurrent).toHaveTextContent('London, UK');
    });

    it('should render detect location button', () => {
      render(<SettingsPage {...defaultProps} />);

      const detectButton = document.querySelector('.settings-detect-btn');
      expect(detectButton).toBeInTheDocument();
    });

    it('should show placeholder when no location set', () => {
      render(<SettingsPage {...defaultProps} location={null} />);

      expect(screen.getByText(UI_TEXT.WEATHER_SET_LOCATION)).toBeInTheDocument();
    });
  });

  describe('Units Section Layout', () => {
    it('should render units section', () => {
      render(<SettingsPage {...defaultProps} />);

      expect(screen.getByText(UI_TEXT.SETTINGS_UNITS)).toBeInTheDocument();
    });

    it('should render settings-units-toggle container', () => {
      render(<SettingsPage {...defaultProps} />);

      const toggle = document.querySelector('.settings-units-toggle');
      expect(toggle).toBeInTheDocument();
    });

    it('should render temperature toggle with ℉ and ℃ labels', () => {
      render(<SettingsPage {...defaultProps} />);

      expect(screen.getByText('℉')).toBeInTheDocument();
      expect(screen.getByText('℃')).toBeInTheDocument();
    });

    it('should have toggle checked when celsius selected', () => {
      render(<SettingsPage {...defaultProps} />);

      const toggle = document.querySelector('.settings-units-toggle input');
      expect(toggle).toBeChecked();
    });

    it('should have toggle unchecked when fahrenheit selected', () => {
      render(
        <SettingsPage
          {...defaultProps}
          settings={{ ...defaultProps.settings, units: 'fahrenheit' }}
        />
      );

      const toggle = document.querySelector('.settings-units-toggle input');
      expect(toggle).not.toBeChecked();
    });
  });

  describe('Footer Layout', () => {
    it('should render auto-saved message', () => {
      render(<SettingsPage {...defaultProps} />);

      const autoSaved = document.querySelector('.settings-auto-saved');
      expect(autoSaved).toBeInTheDocument();
      expect(autoSaved).toHaveTextContent(UI_TEXT.SETTINGS_AUTO_SAVED);
    });
  });

  describe('Section Order', () => {
    it('should render sections in correct order', () => {
      render(<SettingsPage {...defaultProps} />);

      const sections = document.querySelectorAll('.settings-section');
      expect(sections.length).toBe(3);

      // Verify order: Services, Location, Units
      expect(sections[0]).toHaveTextContent(UI_TEXT.SETTINGS_SERVICES);
      expect(sections[1]).toHaveTextContent(UI_TEXT.SETTINGS_LOCATION);
      expect(sections[2]).toHaveTextContent(UI_TEXT.SETTINGS_UNITS);
    });
  });

  describe('Loading State', () => {
    it('should show spinner icon during location detection', () => {
      render(<SettingsPage {...defaultProps} isDetecting={true} />);

      // Button shows spinner icon instead of locate icon when detecting
      const detectButton = document.querySelector('.settings-detect-btn');
      const spinner = detectButton.querySelector('.icon-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should disable detect button during detection', () => {
      render(<SettingsPage {...defaultProps} isDetecting={true} />);

      const detectButton = document.querySelector('.settings-detect-btn');
      expect(detectButton).toBeDisabled();
    });
  });

  describe('Error State', () => {
    it('should render error message when location error', () => {
      render(<SettingsPage {...defaultProps} locationError="Unable to detect location" />);

      const error = document.querySelector('.settings-error');
      expect(error).toBeInTheDocument();
      expect(error).toHaveTextContent('Unable to detect location');
    });
  });

  describe('Viewport-Specific Layout', () => {
    Object.entries(VIEWPORTS).forEach(([key, viewport]) => {
      describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
        beforeEach(() => {
          setupViewport(key);
        });

        it('should render settings-page container', () => {
          render(<SettingsPage {...defaultProps} />);

          const container = document.querySelector('.settings-page');
          expect(container).toBeInTheDocument();
        });

        it('should render all three sections', () => {
          render(<SettingsPage {...defaultProps} />);

          const sections = document.querySelectorAll('.settings-section');
          expect(sections.length).toBe(3);
        });

        it('should render header with close button', () => {
          render(<SettingsPage {...defaultProps} />);

          const header = document.querySelector('.settings-header');
          const closeButton = header.querySelector('.settings-close-btn');
          expect(header).toBeInTheDocument();
          expect(closeButton).toBeInTheDocument();
        });

        it('should render footer', () => {
          render(<SettingsPage {...defaultProps} />);

          const footer = document.querySelector('.settings-footer');
          expect(footer).toBeInTheDocument();
        });

        it('should render all toggles (services + temperature)', () => {
          render(<SettingsPage {...defaultProps} />);

          // 2 service toggles + 1 temperature toggle = 3 switches
          const toggles = screen.getAllByRole('switch');
          expect(toggles.length).toBe(3);
        });

        it('should render temperature toggle', () => {
          render(<SettingsPage {...defaultProps} />);

          const unitsToggle = document.querySelector('.settings-units-toggle');
          expect(unitsToggle).toBeInTheDocument();
        });
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible close button when services connected', () => {
      render(<SettingsPage {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toHaveAttribute('aria-label', 'close');
    });

    it('should have proper heading', () => {
      render(<SettingsPage {...defaultProps} />);

      const title = document.querySelector('.settings-header-title');
      expect(title.tagName.toLowerCase()).toBe('h2');
    });

    it('should have accessible toggles', () => {
      render(<SettingsPage {...defaultProps} />);

      // All toggles (services + temperature) should be checkboxes
      const toggles = screen.getAllByRole('switch');
      expect(toggles.length).toBe(3);
      toggles.forEach((toggle) => {
        expect(toggle).toHaveAttribute('type', 'checkbox');
      });
    });
  });

  describe('Component Hierarchy', () => {
    it('should have settings-page as root', () => {
      const { container } = render(<SettingsPage {...defaultProps} />);

      expect(container.firstChild).toHaveClass('settings-page');
    });

    it('should have header, content, footer as direct children', () => {
      render(<SettingsPage {...defaultProps} />);

      const page = document.querySelector('.settings-page');
      const children = Array.from(page.children);

      expect(children[0]).toHaveClass('settings-header');
      expect(children[1]).toHaveClass('settings-content');
      expect(children[2]).toHaveClass('settings-footer');
    });
  });
});
