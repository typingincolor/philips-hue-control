import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SettingsPage } from './SettingsPage';
import { UI_TEXT } from '../../constants/uiText';
import { VIEWPORTS, setupViewport, resetViewport } from '../../test/layoutTestUtils';

/**
 * SettingsPage Layout Tests
 *
 * Tests the structural layout requirements for the Settings page:
 * - Header with back button and title
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
    it('should render back button', () => {
      render(<SettingsPage {...defaultProps} />);

      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toBeInTheDocument();
      expect(backButton).toHaveClass('settings-back-btn');
    });

    it('should render title', () => {
      render(<SettingsPage {...defaultProps} />);

      const title = document.querySelector('.settings-header-title');
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent(UI_TEXT.SETTINGS_TITLE);
    });

    it('should have back button before title in DOM order', () => {
      render(<SettingsPage {...defaultProps} />);

      const header = document.querySelector('.settings-header');
      const backButton = header.querySelector('.settings-back-btn');
      const title = header.querySelector('.settings-header-title');

      // Back button should come before title (DOCUMENT_POSITION_FOLLOWING = 4)
      expect(backButton.compareDocumentPosition(title) & 4).toBeTruthy();
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

      const switches = screen.getAllByRole('switch');
      expect(switches.length).toBe(2);
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

    it('should render settings-units container', () => {
      render(<SettingsPage {...defaultProps} />);

      const units = document.querySelector('.settings-units');
      expect(units).toBeInTheDocument();
    });

    it('should render celsius button', () => {
      render(<SettingsPage {...defaultProps} />);

      const celsiusBtn = screen.getByText(UI_TEXT.SETTINGS_CELSIUS);
      expect(celsiusBtn).toBeInTheDocument();
      expect(celsiusBtn).toHaveClass('settings-unit-btn');
    });

    it('should render fahrenheit button', () => {
      render(<SettingsPage {...defaultProps} />);

      const fahrenheitBtn = screen.getByText(UI_TEXT.SETTINGS_FAHRENHEIT);
      expect(fahrenheitBtn).toBeInTheDocument();
      expect(fahrenheitBtn).toHaveClass('settings-unit-btn');
    });

    it('should mark selected unit as selected', () => {
      render(<SettingsPage {...defaultProps} />);

      const celsiusBtn = screen.getByText(UI_TEXT.SETTINGS_CELSIUS);
      const fahrenheitBtn = screen.getByText(UI_TEXT.SETTINGS_FAHRENHEIT);

      expect(celsiusBtn).toHaveClass('selected');
      expect(fahrenheitBtn).not.toHaveClass('selected');
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
    it('should show spinner during location detection', () => {
      render(<SettingsPage {...defaultProps} isDetecting={true} />);

      expect(screen.getByText(UI_TEXT.SETTINGS_DETECTING)).toBeInTheDocument();
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

        it('should render header with back button', () => {
          render(<SettingsPage {...defaultProps} />);

          const header = document.querySelector('.settings-header');
          const backButton = header.querySelector('.settings-back-btn');
          expect(header).toBeInTheDocument();
          expect(backButton).toBeInTheDocument();
        });

        it('should render footer', () => {
          render(<SettingsPage {...defaultProps} />);

          const footer = document.querySelector('.settings-footer');
          expect(footer).toBeInTheDocument();
        });

        it('should render both service toggles', () => {
          render(<SettingsPage {...defaultProps} />);

          const toggles = screen.getAllByRole('switch');
          expect(toggles.length).toBe(2);
        });

        it('should render both unit buttons', () => {
          render(<SettingsPage {...defaultProps} />);

          const unitButtons = document.querySelectorAll('.settings-unit-btn');
          expect(unitButtons.length).toBe(2);
        });
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible back button', () => {
      render(<SettingsPage {...defaultProps} />);

      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toHaveAttribute('aria-label', 'back');
    });

    it('should have proper heading', () => {
      render(<SettingsPage {...defaultProps} />);

      const title = document.querySelector('.settings-header-title');
      expect(title.tagName.toLowerCase()).toBe('h2');
    });

    it('should have accessible service toggles', () => {
      render(<SettingsPage {...defaultProps} />);

      const toggles = screen.getAllByRole('switch');
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
