import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dashboard } from './index';
import { UI_TEXT } from '../../constants/uiText';

// Create mutable reference for mock API
let mockApi = {
  getDashboard: vi.fn(),
  updateLight: vi.fn(),
  updateRoomLights: vi.fn(),
  updateZoneLights: vi.fn(),
  activateSceneV1: vi.fn(),
};
let mockDashboardData;
let mockHiveState;

const baseDashboard = {
  summary: {
    lightsOn: 2,
    totalLights: 4,
    roomCount: 2,
    sceneCount: 3,
  },
  rooms: [
    {
      id: 'room-1',
      name: 'Living Room',
      stats: { lightsOnCount: 1, totalLights: 2, averageBrightness: 75 },
      lights: [
        { id: 'light-1', name: 'Lamp', on: true, brightness: 80, color: '#ffffff', shadow: 'none' },
        {
          id: 'light-2',
          name: 'Ceiling',
          on: false,
          brightness: 0,
          color: '#ffffff',
          shadow: 'none',
        },
      ],
      scenes: [{ id: 'scene-1', name: 'Bright' }],
    },
  ],
  zones: [],
  motionZones: [],
};

const mockHiveStatus = {
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

const mockHiveSchedules = [
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

// Mock the homeAdapter
vi.mock('../../services/homeAdapter', () => ({
  getDashboardFromHome: vi.fn().mockImplementation(() => Promise.resolve(mockDashboardData)),
}));

// Mock the DemoModeContext
vi.mock('../../context/DemoModeContext', () => ({
  useDemoMode: () => ({
    isDemoMode: true,
    api: mockApi,
  }),
}));

vi.mock('../../hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    isConnected: false,
    dashboard: null,
    error: null,
  }),
}));

vi.mock('../../hooks/useHive', () => ({
  useHive: () => mockHiveState,
}));

describe('Dashboard - Hive Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDashboardData = { ...baseDashboard };
    mockApi = {
      getDashboard: vi.fn().mockImplementation(() => Promise.resolve(mockDashboardData)),
      updateLight: vi.fn().mockResolvedValue({ light: {} }),
      updateRoomLights: vi.fn().mockResolvedValue({ updatedLights: [] }),
      updateZoneLights: vi.fn().mockResolvedValue({ updatedLights: [] }),
      activateSceneV1: vi.fn().mockResolvedValue({ affectedLights: [] }),
    };
    mockHiveState = {
      isConnected: false,
      isConnecting: false,
      isLoading: false,
      status: null,
      schedules: [],
      error: null,
      requires2fa: false,
      twoFaSession: null,
      pendingUsername: null,
      isVerifying: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      refresh: vi.fn(),
      checkConnection: vi.fn(),
      submit2faCode: vi.fn(),
      cancel2fa: vi.fn(),
    };
  });

  describe('Navigation', () => {
    it('should hide Home tab when Hive not connected', async () => {
      render(<Dashboard sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText('Living Room')).toBeInTheDocument();
      });

      // Home tab should NOT be visible when Hive not connected (no home devices)
      expect(screen.queryByText(UI_TEXT.NAV_HOME)).not.toBeInTheDocument();
    });

    it('should show Home tab when Hive connected', async () => {
      mockHiveState = {
        ...mockHiveState,
        isConnected: true,
        status: mockHiveStatus,
        schedules: mockHiveSchedules,
      };

      render(<Dashboard sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText(UI_TEXT.NAV_HOME)).toBeInTheDocument();
      });
    });

    it('should navigate to Home view when Home tab is clicked', async () => {
      const user = userEvent.setup();
      mockHiveState = {
        ...mockHiveState,
        isConnected: true,
        status: mockHiveStatus,
        schedules: mockHiveSchedules,
      };

      render(<Dashboard sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText(UI_TEXT.NAV_HOME)).toBeInTheDocument();
      });

      await user.click(screen.getByText(UI_TEXT.NAV_HOME));

      await waitFor(() => {
        // Should show current temperature (Hive is inside Home view)
        expect(screen.getByText('19.5°')).toBeInTheDocument();
      });
    });

    it('should highlight Home tab when selected', async () => {
      const user = userEvent.setup();
      mockHiveState = {
        ...mockHiveState,
        isConnected: true,
        status: mockHiveStatus,
        schedules: mockHiveSchedules,
      };

      render(<Dashboard sessionToken="test-token" />);

      // Wait for Home tab to appear and click it
      const homeTab = await waitFor(() => {
        const tab = document.querySelector('.nav-tab');
        expect(tab).toBeInTheDocument();
        expect(tab).toHaveTextContent(UI_TEXT.NAV_HOME);
        return tab;
      });

      await user.click(homeTab);

      // Verify tab is active
      await waitFor(() => {
        expect(homeTab).toHaveClass('active');
      });
    });

    it('should hide Home tab after disconnect (connection-based visibility)', async () => {
      const disconnectFn = vi.fn();
      mockHiveState = {
        ...mockHiveState,
        isConnected: true,
        status: mockHiveStatus,
        schedules: mockHiveSchedules,
        disconnect: disconnectFn,
      };

      const { rerender } = render(<Dashboard sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText(UI_TEXT.NAV_HOME)).toBeInTheDocument();
      });

      // Simulate disconnect
      mockHiveState = {
        ...mockHiveState,
        isConnected: false,
        status: null,
        schedules: [],
      };

      rerender(<Dashboard sessionToken="test-token" />);

      // Home tab should be hidden after disconnect (no home devices)
      await waitFor(() => {
        expect(screen.queryByText(UI_TEXT.NAV_HOME)).not.toBeInTheDocument();
      });
    });
  });

  describe('Hive View Display', () => {
    beforeEach(() => {
      mockHiveState = {
        ...mockHiveState,
        isConnected: true,
        status: mockHiveStatus,
        schedules: mockHiveSchedules,
      };
    });

    it('should display current temperature', async () => {
      const user = userEvent.setup();
      render(<Dashboard sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText(UI_TEXT.NAV_HOME)).toBeInTheDocument();
      });

      await user.click(screen.getByText(UI_TEXT.NAV_HOME));

      await waitFor(() => {
        expect(screen.getByText('19.5°')).toBeInTheDocument();
      });
    });

    it('should display heating status indicator', async () => {
      const user = userEvent.setup();
      render(<Dashboard sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText(UI_TEXT.NAV_HOME)).toBeInTheDocument();
      });

      await user.click(screen.getByText(UI_TEXT.NAV_HOME));

      await waitFor(() => {
        expect(screen.getByLabelText(UI_TEXT.HIVE_HEATING_STATUS)).toBeInTheDocument();
      });
    });

    it('should display hot water status indicator', async () => {
      const user = userEvent.setup();
      render(<Dashboard sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText(UI_TEXT.NAV_HOME)).toBeInTheDocument();
      });

      await user.click(screen.getByText(UI_TEXT.NAV_HOME));

      await waitFor(() => {
        expect(screen.getByLabelText(UI_TEXT.HIVE_HOT_WATER_STATUS)).toBeInTheDocument();
      });
    });

    it('should display schedule list', async () => {
      const user = userEvent.setup();
      render(<Dashboard sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText(UI_TEXT.NAV_HOME)).toBeInTheDocument();
      });

      await user.click(screen.getByText(UI_TEXT.NAV_HOME));

      await waitFor(() => {
        expect(screen.getByText('Morning Warmup')).toBeInTheDocument();
        expect(screen.getByText('Hot Water AM')).toBeInTheDocument();
      });
    });

    it('should show heating indicator as active when heating is on', async () => {
      const user = userEvent.setup();
      render(<Dashboard sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText(UI_TEXT.NAV_HOME)).toBeInTheDocument();
      });

      await user.click(screen.getByText(UI_TEXT.NAV_HOME));

      await waitFor(() => {
        const heatingIndicator = screen.getByLabelText(UI_TEXT.HIVE_HEATING_STATUS);
        expect(heatingIndicator).toHaveClass('active');
      });
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading state in Home view', async () => {
      const user = userEvent.setup();
      mockHiveState = {
        ...mockHiveState,
        isConnected: true,
        isLoading: true,
        status: null,
        schedules: [],
      };

      render(<Dashboard sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText(UI_TEXT.NAV_HOME)).toBeInTheDocument();
      });

      await user.click(screen.getByText(UI_TEXT.NAV_HOME));

      await waitFor(() => {
        expect(screen.getByText(UI_TEXT.HIVE_LOADING)).toBeInTheDocument();
      });
    });

    it('should show error state in Home view', async () => {
      const user = userEvent.setup();
      mockHiveState = {
        ...mockHiveState,
        isConnected: true,
        error: 'Failed to fetch Hive data',
        status: null,
        schedules: [],
      };

      render(<Dashboard sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText(UI_TEXT.NAV_HOME)).toBeInTheDocument();
      });

      await user.click(screen.getByText(UI_TEXT.NAV_HOME));

      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch/)).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      const user = userEvent.setup();
      mockHiveState = {
        ...mockHiveState,
        isConnected: true,
        error: 'Connection lost',
        status: null,
        schedules: [],
      };

      render(<Dashboard sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText(UI_TEXT.NAV_HOME)).toBeInTheDocument();
      });

      await user.click(screen.getByText(UI_TEXT.NAV_HOME));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: UI_TEXT.RETRY })).toBeInTheDocument();
      });
    });

    it('should call refresh when retry is clicked', async () => {
      const user = userEvent.setup();
      const refreshFn = vi.fn();
      mockHiveState = {
        ...mockHiveState,
        isConnected: true,
        error: 'Connection lost',
        status: null,
        schedules: [],
        refresh: refreshFn,
      };

      render(<Dashboard sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText(UI_TEXT.NAV_HOME)).toBeInTheDocument();
      });

      await user.click(screen.getByText(UI_TEXT.NAV_HOME));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: UI_TEXT.RETRY })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: UI_TEXT.RETRY }));

      expect(refreshFn).toHaveBeenCalled();
    });
  });
});
