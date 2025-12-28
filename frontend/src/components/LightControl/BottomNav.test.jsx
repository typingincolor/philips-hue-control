import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BottomNav } from './BottomNav';
import { UI_TEXT } from '../../constants/uiText';

// Mock useDragScroll hook
vi.mock('../../hooks/useDragScroll', () => ({
  useDragScroll: () => ({ current: null }),
}));

describe('BottomNav', () => {
  const mockRooms = [
    { id: 'room-1', name: 'Living Room', stats: { lightsOnCount: 2 } },
    { id: 'room-2', name: 'Kitchen', stats: { lightsOnCount: 0 } },
  ];

  const mockZones = [{ id: 'zone-1', name: 'All Lights' }];

  const defaultProps = {
    rooms: mockRooms,
    zones: mockZones,
    hasAutomations: true,
    selectedId: 'room-1',
    onSelect: vi.fn(),
    services: {
      hue: { enabled: true },
      hive: { enabled: false },
    },
    hueConnected: true, // Default to connected so existing tests pass
    hiveConnected: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render room tabs', () => {
      render(<BottomNav {...defaultProps} />);

      expect(screen.getByText('Living Room')).toBeInTheDocument();
      expect(screen.getByText('Kitchen')).toBeInTheDocument();
    });

    it('should render zones tab when zones exist', () => {
      render(<BottomNav {...defaultProps} />);

      expect(screen.getByText(UI_TEXT.NAV_ZONES)).toBeInTheDocument();
    });

    it('should render automations tab when hasAutomations', () => {
      render(<BottomNav {...defaultProps} />);

      expect(screen.getByText(UI_TEXT.NAV_AUTOMATIONS)).toBeInTheDocument();
    });

    it('should call onSelect when tab clicked', async () => {
      const user = userEvent.setup();
      render(<BottomNav {...defaultProps} />);

      await user.click(screen.getByText('Kitchen'));

      expect(defaultProps.onSelect).toHaveBeenCalledWith('room-2');
    });
  });

  // Note: "service-based visibility" tests removed - now using connection-based visibility
  // See "connection-based visibility - Hue" and "connection-based visibility - Hive" describes

  describe('connection-based visibility - Hive', () => {
    it('should show Hive tab when Hive is connected', () => {
      render(
        <BottomNav
          {...defaultProps}
          hiveConnected={true}
          services={{
            hue: { enabled: true },
            hive: { enabled: true },
          }}
        />
      );

      expect(screen.getByText(UI_TEXT.NAV_HIVE)).toBeInTheDocument();
    });

    it('should hide Hive tab when Hive is not connected', () => {
      render(<BottomNav {...defaultProps} hiveConnected={false} />);

      expect(screen.queryByText(UI_TEXT.NAV_HIVE)).not.toBeInTheDocument();
    });

    it('should hide Hive tab when hiveConnected prop is missing (undefined)', () => {
      const propsWithoutHiveConnected = { ...defaultProps };
      delete propsWithoutHiveConnected.hiveConnected;

      render(<BottomNav {...propsWithoutHiveConnected} />);

      expect(screen.queryByText(UI_TEXT.NAV_HIVE)).not.toBeInTheDocument();
    });
  });

  describe('connection-based visibility - Hue', () => {
    it('should show Hue tabs when hueConnected is true', () => {
      render(<BottomNav {...defaultProps} hueConnected={true} />);

      expect(screen.getByText('Living Room')).toBeInTheDocument();
      expect(screen.getByText('Kitchen')).toBeInTheDocument();
      expect(screen.getByText(UI_TEXT.NAV_ZONES)).toBeInTheDocument();
      expect(screen.getByText(UI_TEXT.NAV_AUTOMATIONS)).toBeInTheDocument();
    });

    it('should hide Hue tabs when hueConnected is false', () => {
      render(<BottomNav {...defaultProps} hueConnected={false} />);

      expect(screen.queryByText('Living Room')).not.toBeInTheDocument();
      expect(screen.queryByText('Kitchen')).not.toBeInTheDocument();
      expect(screen.queryByText(UI_TEXT.NAV_ZONES)).not.toBeInTheDocument();
      expect(screen.queryByText(UI_TEXT.NAV_AUTOMATIONS)).not.toBeInTheDocument();
    });
  });

  describe('empty states', () => {
    it('should render only Hive tab when only Hive is connected', () => {
      render(
        <BottomNav
          {...defaultProps}
          rooms={[]}
          zones={[]}
          hasAutomations={false}
          hueConnected={false}
          hiveConnected={true}
          services={{
            hue: { enabled: true },
            hive: { enabled: true },
          }}
        />
      );

      expect(screen.getByText(UI_TEXT.NAV_HIVE)).toBeInTheDocument();
      expect(screen.queryByText('Living Room')).not.toBeInTheDocument();
    });

    it('should render nothing when no services are connected', () => {
      render(
        <BottomNav
          {...defaultProps}
          rooms={[]}
          zones={[]}
          hasAutomations={false}
          hueConnected={false}
          hiveConnected={false}
        />
      );

      // Nav should exist but be empty
      expect(document.querySelector('.bottom-nav')).toBeInTheDocument();
      expect(document.querySelectorAll('.nav-tab').length).toBe(0);
    });
  });

  describe('backwards compatibility', () => {
    it('should show Hue tabs when hueConnected is true and services prop is missing', () => {
      const propsWithoutServices = { ...defaultProps };
      delete propsWithoutServices.services;

      render(<BottomNav {...propsWithoutServices} hueConnected={true} hiveConnected={false} />);

      expect(screen.getByText('Living Room')).toBeInTheDocument();
      expect(screen.queryByText(UI_TEXT.NAV_HIVE)).not.toBeInTheDocument();
    });
  });

  describe('enabled + connected visibility', () => {
    it('should hide Hue tabs when Hue is connected but disabled in settings', () => {
      render(
        <BottomNav
          {...defaultProps}
          hueConnected={true}
          services={{
            hue: { enabled: false },
            hive: { enabled: false },
          }}
        />
      );

      // Even though connected, should be hidden because disabled
      expect(screen.queryByText('Living Room')).not.toBeInTheDocument();
      expect(screen.queryByText('Kitchen')).not.toBeInTheDocument();
      expect(screen.queryByText(UI_TEXT.NAV_ZONES)).not.toBeInTheDocument();
      expect(screen.queryByText(UI_TEXT.NAV_AUTOMATIONS)).not.toBeInTheDocument();
    });

    it('should hide Hive tab when Hive is connected but disabled in settings', () => {
      render(
        <BottomNav
          {...defaultProps}
          hiveConnected={true}
          services={{
            hue: { enabled: true },
            hive: { enabled: false },
          }}
        />
      );

      // Even though connected, should be hidden because disabled
      expect(screen.queryByText(UI_TEXT.NAV_HIVE)).not.toBeInTheDocument();
    });

    it('should show Hue tabs when both enabled and connected', () => {
      render(
        <BottomNav
          {...defaultProps}
          hueConnected={true}
          services={{
            hue: { enabled: true },
            hive: { enabled: false },
          }}
        />
      );

      expect(screen.getByText('Living Room')).toBeInTheDocument();
      expect(screen.getByText(UI_TEXT.NAV_ZONES)).toBeInTheDocument();
      expect(screen.getByText(UI_TEXT.NAV_AUTOMATIONS)).toBeInTheDocument();
    });

    it('should show Hive tab when both enabled and connected', () => {
      render(
        <BottomNav
          {...defaultProps}
          hiveConnected={true}
          services={{
            hue: { enabled: true },
            hive: { enabled: true },
          }}
        />
      );

      expect(screen.getByText(UI_TEXT.NAV_HIVE)).toBeInTheDocument();
    });

    it('should hide Hue tabs when enabled but not connected', () => {
      render(
        <BottomNav
          {...defaultProps}
          hueConnected={false}
          services={{
            hue: { enabled: true },
            hive: { enabled: false },
          }}
        />
      );

      // Enabled but not connected - should be hidden
      expect(screen.queryByText('Living Room')).not.toBeInTheDocument();
    });

    it('should hide Hive tab when enabled but not connected', () => {
      render(
        <BottomNav
          {...defaultProps}
          hiveConnected={false}
          services={{
            hue: { enabled: true },
            hive: { enabled: true },
          }}
        />
      );

      // Enabled but not connected - should be hidden
      expect(screen.queryByText(UI_TEXT.NAV_HIVE)).not.toBeInTheDocument();
    });
  });

  describe('active state', () => {
    it('should mark selected room as active', () => {
      render(<BottomNav {...defaultProps} selectedId="room-1" />);

      const livingRoomTab = screen.getByText('Living Room').closest('.nav-tab');
      expect(livingRoomTab).toHaveClass('active');
    });

    it('should mark Hive tab as active when selected', () => {
      render(
        <BottomNav
          {...defaultProps}
          selectedId="hive"
          hiveConnected={true}
          services={{
            hue: { enabled: true },
            hive: { enabled: true },
          }}
        />
      );

      const hiveTab = screen.getByText(UI_TEXT.NAV_HIVE).closest('.nav-tab');
      expect(hiveTab).toHaveClass('active');
    });
  });

  describe('badges', () => {
    it('should show lights count badge on rooms', () => {
      render(<BottomNav {...defaultProps} />);

      const livingRoomTab = screen.getByText('Living Room').closest('.nav-tab');
      expect(livingRoomTab.querySelector('.nav-tab-badge')).toHaveTextContent('2');
    });

    it('should not show badge for rooms with 0 lights on', () => {
      render(<BottomNav {...defaultProps} />);

      const kitchenTab = screen.getByText('Kitchen').closest('.nav-tab');
      // Should not have a badge when 0 lights are on
      expect(kitchenTab.querySelector('.nav-tab-badge')).not.toBeInTheDocument();
    });
  });
});
