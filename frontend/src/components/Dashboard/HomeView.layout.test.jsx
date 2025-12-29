import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HomeView } from './HomeView';
import { UI_TEXT } from '../../constants/uiText';
import { VIEWPORTS, setupViewport, resetViewport } from '../../test/layoutTestUtils';

/**
 * HomeView Layout Tests
 *
 * Tests the structural layout requirements for the Home view:
 * - Container structure with correct CSS classes
 * - Empty state layout
 * - Integration with HiveView when Hive devices present
 *
 * Note: Auth flow tests removed - demo mode assumes always connected.
 * Auth flows are tested manually (see docs/MANUAL_TESTS.md)
 */

describe('HomeView Layout', () => {
  const mockHiveStatus = {
    heating: {
      currentTemperature: 21,
      targetTemperature: 22,
      isHeating: true,
      mode: 'auto',
    },
    hotWater: {
      isOn: false,
      mode: 'scheduled',
    },
  };

  const mockHiveSchedules = [
    { id: '1', name: 'Morning', type: 'heating', time: '06:00', days: ['Mon', 'Tue', 'Wed'] },
  ];

  const mockHomeDevices = [
    { id: 'hive:heating', type: 'thermostat', name: 'Heating', source: 'hive' },
    { id: 'hive:hotwater', type: 'hotWater', name: 'Hot Water', source: 'hive' },
  ];

  const defaultProps = {
    homeDevices: mockHomeDevices,
    hiveConnected: true,
    hiveStatus: mockHiveStatus,
    hiveSchedules: mockHiveSchedules,
    hiveLoading: false,
    hiveError: null,
    onHiveRetry: vi.fn(),
    onHiveConnect: vi.fn(),
    onHiveVerify2fa: vi.fn(),
    onHiveCancel2fa: vi.fn(),
    onHiveClearError: vi.fn(),
    hiveRequires2fa: false,
    hiveConnecting: false,
    hiveVerifying: false,
    hivePendingUsername: '',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetViewport();
  });

  describe('Core Structure', () => {
    it('should render home-view container', () => {
      render(<HomeView {...defaultProps} />);

      const container = document.querySelector('.home-view');
      expect(container).toBeInTheDocument();
    });

    it('should render home-devices wrapper when devices present', () => {
      render(<HomeView {...defaultProps} />);

      const devices = document.querySelector('.home-devices');
      expect(devices).toBeInTheDocument();
    });
  });

  describe('Empty State Layout', () => {
    it('should render home-view container for empty state', () => {
      render(<HomeView {...defaultProps} homeDevices={[]} />);

      const container = document.querySelector('.home-view');
      expect(container).toBeInTheDocument();
    });

    it('should render home-empty-state element', () => {
      render(<HomeView {...defaultProps} homeDevices={[]} />);

      const emptyState = document.querySelector('.home-empty-state');
      expect(emptyState).toBeInTheDocument();
    });

    it('should show empty state message', () => {
      render(<HomeView {...defaultProps} homeDevices={[]} />);

      expect(screen.getByText(UI_TEXT.HOME_NO_DEVICES)).toBeInTheDocument();
    });
  });

  describe('With Hive Devices', () => {
    it('should render HiveView when Hive devices present', () => {
      render(<HomeView {...defaultProps} />);

      // HiveView renders .hive-view
      const hiveView = document.querySelector('.hive-view');
      expect(hiveView).toBeInTheDocument();
    });

    it('should render heating tile from HiveView', () => {
      render(<HomeView {...defaultProps} />);

      expect(screen.getByTestId('hive-tile-heating')).toBeInTheDocument();
    });

    it('should render hot water tile from HiveView', () => {
      render(<HomeView {...defaultProps} />);

      expect(screen.getByTestId('hive-tile-hotwater')).toBeInTheDocument();
    });

    it('should display current temperature', () => {
      render(<HomeView {...defaultProps} />);

      // Verify temperature is displayed (rounded to 1 decimal)
      expect(screen.getByText('21.0°')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should render home-view container during loading', () => {
      render(<HomeView {...defaultProps} hiveLoading={true} hiveStatus={null} />);

      const container = document.querySelector('.home-view');
      expect(container).toBeInTheDocument();
    });

    it('should show loading text from HiveView', () => {
      render(<HomeView {...defaultProps} hiveLoading={true} hiveStatus={null} />);

      expect(screen.getByText(UI_TEXT.HIVE_LOADING)).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should render home-view container on error', () => {
      render(<HomeView {...defaultProps} hiveError="Connection failed" hiveStatus={null} />);

      const container = document.querySelector('.home-view');
      expect(container).toBeInTheDocument();
    });

    it('should show error message', () => {
      render(<HomeView {...defaultProps} hiveError="Connection failed" hiveStatus={null} />);

      expect(screen.getByText('Connection failed')).toBeInTheDocument();
    });

    it('should show retry button', () => {
      render(<HomeView {...defaultProps} hiveError="Connection failed" hiveStatus={null} />);

      expect(screen.getByText(UI_TEXT.RETRY)).toBeInTheDocument();
    });
  });

  describe('Viewport-Specific Layout', () => {
    Object.entries(VIEWPORTS).forEach(([key, viewport]) => {
      describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
        beforeEach(() => {
          setupViewport(key);
        });

        it('should render home-view container', () => {
          render(<HomeView {...defaultProps} />);

          const container = document.querySelector('.home-view');
          expect(container).toBeInTheDocument();
        });

        it('should render HiveView with tiles-grid', () => {
          render(<HomeView {...defaultProps} />);

          const grid = screen.getByTestId('hive-tiles-grid');
          expect(grid).toBeInTheDocument();
        });

        it('should render all Hive tiles', () => {
          render(<HomeView {...defaultProps} />);

          expect(screen.getByTestId('hive-tile-heating')).toBeInTheDocument();
          expect(screen.getByTestId('hive-tile-hotwater')).toBeInTheDocument();
        });

        it('should render empty state correctly', () => {
          render(<HomeView {...defaultProps} homeDevices={[]} />);

          const emptyState = document.querySelector('.home-empty-state');
          expect(emptyState).toBeInTheDocument();
        });
      });
    });
  });

  describe('Non-Hive Devices', () => {
    it('should not render HiveView for non-Hive devices', () => {
      const nonHiveDevices = [{ id: 'other:device', type: 'sensor', name: 'Temp Sensor' }];

      render(<HomeView {...defaultProps} homeDevices={nonHiveDevices} />);

      // HiveView should not be rendered
      const hiveView = document.querySelector('.hive-view');
      expect(hiveView).not.toBeInTheDocument();
    });
  });

  describe('Component Hierarchy', () => {
    it('should have home-view as root', () => {
      const { container } = render(<HomeView {...defaultProps} />);

      expect(container.firstChild).toHaveClass('home-view');
    });

    it('should nest home-devices inside home-view', () => {
      render(<HomeView {...defaultProps} />);

      const homeView = document.querySelector('.home-view');
      const homeDevices = homeView.querySelector('.home-devices');
      expect(homeDevices).toBeInTheDocument();
    });

    it('should nest hive-view inside home-devices', () => {
      render(<HomeView {...defaultProps} />);

      const homeDevices = document.querySelector('.home-devices');
      const hiveView = homeDevices.querySelector('.hive-view');
      expect(hiveView).toBeInTheDocument();
    });
  });
});
