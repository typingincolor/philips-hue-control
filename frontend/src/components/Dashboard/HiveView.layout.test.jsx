import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HiveView } from './HiveView';
import { UI_TEXT } from '../../constants/uiText';
import { VIEWPORTS, setupViewport, resetViewport } from '../../test/layoutTestUtils';

/**
 * HiveView Layout Tests
 *
 * Tests the structural layout requirements for the Hive heating view:
 * - Tiles grid structure with correct CSS classes
 * - HiveTile components rendered correctly
 * - HiveInfoTile components for schedules
 * - Loading and error states layout
 *
 * Note: Auth flow tests removed - demo mode assumes always connected.
 * Auth flows are tested manually (see docs/MANUAL_TESTS.md)
 */

describe('HiveView Layout', () => {
  const mockStatus = {
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
  };

  const mockSchedules = [
    {
      id: 'schedule-1',
      name: 'Morning Warmup',
      type: 'heating',
      time: '06:00',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    },
    {
      id: 'schedule-2',
      name: 'Hot Water AM',
      type: 'hotWater',
      time: '07:00',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
  ];

  const defaultProps = {
    isConnected: true,
    status: mockStatus,
    schedules: mockSchedules,
    isLoading: false,
    error: null,
    onRetry: vi.fn(),
    onConnect: vi.fn(),
    onVerify2fa: vi.fn(),
    onCancel2fa: vi.fn(),
    onClearError: vi.fn(),
    requires2fa: false,
    isConnecting: false,
    isVerifying: false,
    pendingUsername: '',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetViewport();
  });

  describe('Core Structure', () => {
    it('should render hive-view container', () => {
      render(<HiveView {...defaultProps} />);

      const container = document.querySelector('.hive-view');
      expect(container).toBeInTheDocument();
    });

    it('should render tiles-grid for Hive tiles', () => {
      render(<HiveView {...defaultProps} />);

      const grid = screen.getByTestId('hive-tiles-grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass('tiles-grid');
    });

    it('should render heating tile', () => {
      render(<HiveView {...defaultProps} />);

      const heatingTile = screen.getByTestId('hive-tile-heating');
      expect(heatingTile).toBeInTheDocument();
    });

    it('should render hot water tile', () => {
      render(<HiveView {...defaultProps} />);

      const hotWaterTile = screen.getByTestId('hive-tile-hotwater');
      expect(hotWaterTile).toBeInTheDocument();
    });

    it('should render schedule info tiles', () => {
      render(<HiveView {...defaultProps} />);

      const infoTiles = screen.getAllByTestId('hive-info-tile');
      expect(infoTiles.length).toBe(2);
    });
  });

  describe('Loading State Layout', () => {
    it('should render hive-view container during loading', () => {
      render(<HiveView {...defaultProps} isLoading={true} status={null} />);

      const container = document.querySelector('.hive-view');
      expect(container).toBeInTheDocument();
    });

    it('should render hive-loading element', () => {
      render(<HiveView {...defaultProps} isLoading={true} status={null} />);

      const loading = document.querySelector('.hive-loading');
      expect(loading).toBeInTheDocument();
    });

    it('should show loading text', () => {
      render(<HiveView {...defaultProps} isLoading={true} status={null} />);

      expect(screen.getByText(UI_TEXT.HIVE_LOADING)).toBeInTheDocument();
    });
  });

  describe('Error State Layout', () => {
    it('should render hive-view container on error', () => {
      render(<HiveView {...defaultProps} error="Connection failed" status={null} />);

      const container = document.querySelector('.hive-view');
      expect(container).toBeInTheDocument();
    });

    it('should render hive-error element', () => {
      render(<HiveView {...defaultProps} error="Connection failed" status={null} />);

      const errorElement = document.querySelector('.hive-error');
      expect(errorElement).toBeInTheDocument();
    });

    it('should have retry button', () => {
      render(<HiveView {...defaultProps} error="Connection failed" status={null} />);

      const retryButton = screen.getByRole('button', { name: UI_TEXT.RETRY });
      expect(retryButton).toBeInTheDocument();
    });

    it('should have accessible error message', () => {
      render(<HiveView {...defaultProps} error="Connection failed" status={null} />);

      const errorElement = document.querySelector('.hive-error');
      expect(errorElement).toHaveAttribute('role', 'alert');
      expect(errorElement).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Tile Layout', () => {
    it('should render all tiles inside tiles-grid', () => {
      render(<HiveView {...defaultProps} />);

      const grid = screen.getByTestId('hive-tiles-grid');
      const heatingTile = grid.querySelector('[data-testid="hive-tile-heating"]');
      const hotWaterTile = grid.querySelector('[data-testid="hive-tile-hotwater"]');
      const infoTiles = grid.querySelectorAll('[data-testid="hive-info-tile"]');

      expect(heatingTile).toBeInTheDocument();
      expect(hotWaterTile).toBeInTheDocument();
      expect(infoTiles.length).toBe(2);
    });

    it('should render heating tile with temperature display', () => {
      render(<HiveView {...defaultProps} />);

      const currentTemp = screen.getByTestId('hive-tile-temp-current');
      expect(currentTemp).toHaveTextContent('19.5°');
    });

    it('should render target temperature', () => {
      render(<HiveView {...defaultProps} />);

      const targetTemp = screen.getByTestId('hive-tile-temp-target');
      expect(targetTemp).toHaveTextContent('21.0°');
    });

    it('should show active class on heating tile when heating is on', () => {
      render(<HiveView {...defaultProps} />);

      const heatingTile = screen.getByTestId('hive-tile-heating');
      expect(heatingTile).toHaveClass('active');
    });

    it('should not show active class on hot water tile when off', () => {
      render(<HiveView {...defaultProps} />);

      const hotWaterTile = screen.getByTestId('hive-tile-hotwater');
      expect(hotWaterTile).not.toHaveClass('active');
    });
  });

  describe('Schedule Tiles', () => {
    it('should render schedule names', () => {
      render(<HiveView {...defaultProps} />);

      expect(screen.getByText('Morning Warmup')).toBeInTheDocument();
      expect(screen.getByText('Hot Water AM')).toBeInTheDocument();
    });

    it('should render schedule times', () => {
      render(<HiveView {...defaultProps} />);

      expect(screen.getByText('06:00')).toBeInTheDocument();
      expect(screen.getByText('07:00')).toBeInTheDocument();
    });

    it('should render info icons', () => {
      render(<HiveView {...defaultProps} />);

      const infoIcons = screen.getAllByTestId('hive-info-icon');
      expect(infoIcons.length).toBe(2);
    });
  });

  describe('Viewport-Specific Layout', () => {
    Object.entries(VIEWPORTS).forEach(([key, viewport]) => {
      describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
        beforeEach(() => {
          setupViewport(key);
        });

        it('should render tiles-grid container', () => {
          render(<HiveView {...defaultProps} />);

          const grid = screen.getByTestId('hive-tiles-grid');
          expect(grid).toBeInTheDocument();
          expect(grid).toHaveClass('tiles-grid');
        });

        it('should render hive-view wrapper', () => {
          render(<HiveView {...defaultProps} />);

          const view = document.querySelector('.hive-view');
          expect(view).toBeInTheDocument();
        });

        it('should render all device tiles', () => {
          render(<HiveView {...defaultProps} />);

          expect(screen.getByTestId('hive-tile-heating')).toBeInTheDocument();
          expect(screen.getByTestId('hive-tile-hotwater')).toBeInTheDocument();
        });

        it('should render all schedule tiles', () => {
          render(<HiveView {...defaultProps} />);

          const infoTiles = screen.getAllByTestId('hive-info-tile');
          expect(infoTiles.length).toBe(mockSchedules.length);
        });
      });
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

  describe('Empty Schedules', () => {
    it('should render without schedule tiles when no schedules', () => {
      render(<HiveView {...defaultProps} schedules={[]} />);

      const infoTiles = screen.queryAllByTestId('hive-info-tile');
      expect(infoTiles.length).toBe(0);
    });

    it('should still render heating and hot water tiles', () => {
      render(<HiveView {...defaultProps} schedules={[]} />);

      expect(screen.getByTestId('hive-tile-heating')).toBeInTheDocument();
      expect(screen.getByTestId('hive-tile-hotwater')).toBeInTheDocument();
    });
  });
});
