import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LightControl } from './index';
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

describe('LightControl - Hive Integration', () => {
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
    it('should hide Hive tab when not connected', async () => {
      render(<LightControl sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText('Living Room')).toBeInTheDocument();
      });

      // Hive tab should NOT be visible when not connected (connection-based visibility)
      expect(screen.queryByText(UI_TEXT.NAV_HIVE)).not.toBeInTheDocument();
    });

    it('should show Hive tab when connected', async () => {
      mockHiveState = {
        ...mockHiveState,
        isConnected: true,
        status: mockHiveStatus,
        schedules: mockHiveSchedules,
      };

      render(<LightControl sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText(UI_TEXT.NAV_HIVE)).toBeInTheDocument();
      });
    });

    it('should navigate to Hive view when Hive tab is clicked', async () => {
      const user = userEvent.setup();
      mockHiveState = {
        ...mockHiveState,
        isConnected: true,
        status: mockHiveStatus,
        schedules: mockHiveSchedules,
      };

      render(<LightControl sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText(UI_TEXT.NAV_HIVE)).toBeInTheDocument();
      });

      await user.click(screen.getByText(UI_TEXT.NAV_HIVE));

      await waitFor(() => {
        // Should show current temperature
        expect(screen.getByText('19.5°')).toBeInTheDocument();
      });
    });

    it('should highlight Hive tab when selected', async () => {
      const user = userEvent.setup();
      mockHiveState = {
        ...mockHiveState,
        isConnected: true,
        status: mockHiveStatus,
        schedules: mockHiveSchedules,
      };

      render(<LightControl sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText(UI_TEXT.NAV_HIVE)).toBeInTheDocument();
      });

      await user.click(screen.getByText(UI_TEXT.NAV_HIVE));

      const hiveTab = screen.getByText(UI_TEXT.NAV_HIVE).closest('.nav-tab');
      expect(hiveTab).toHaveClass('active');
    });

    it('should hide Hive tab after disconnect (connection-based visibility)', async () => {
      const disconnectFn = vi.fn();
      mockHiveState = {
        ...mockHiveState,
        isConnected: true,
        status: mockHiveStatus,
        schedules: mockHiveSchedules,
        disconnect: disconnectFn,
      };

      const { rerender } = render(<LightControl sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText(UI_TEXT.NAV_HIVE)).toBeInTheDocument();
      });

      // Simulate disconnect
      mockHiveState = {
        ...mockHiveState,
        isConnected: false,
        status: null,
        schedules: [],
      };

      rerender(<LightControl sessionToken="test-token" />);

      // Hive tab should be hidden after disconnect (connection-based visibility)
      await waitFor(() => {
        expect(screen.queryByText(UI_TEXT.NAV_HIVE)).not.toBeInTheDocument();
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
      render(<LightControl sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText(UI_TEXT.NAV_HIVE)).toBeInTheDocument();
      });

      await user.click(screen.getByText(UI_TEXT.NAV_HIVE));

      await waitFor(() => {
        expect(screen.getByText('19.5°')).toBeInTheDocument();
      });
    });

    it('should display heating status indicator', async () => {
      const user = userEvent.setup();
      render(<LightControl sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText(UI_TEXT.NAV_HIVE)).toBeInTheDocument();
      });

      await user.click(screen.getByText(UI_TEXT.NAV_HIVE));

      await waitFor(() => {
        expect(screen.getByLabelText(UI_TEXT.HIVE_HEATING_STATUS)).toBeInTheDocument();
      });
    });

    it('should display hot water status indicator', async () => {
      const user = userEvent.setup();
      render(<LightControl sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText(UI_TEXT.NAV_HIVE)).toBeInTheDocument();
      });

      await user.click(screen.getByText(UI_TEXT.NAV_HIVE));

      await waitFor(() => {
        expect(screen.getByLabelText(UI_TEXT.HIVE_HOT_WATER_STATUS)).toBeInTheDocument();
      });
    });

    it('should display schedule list', async () => {
      const user = userEvent.setup();
      render(<LightControl sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText(UI_TEXT.NAV_HIVE)).toBeInTheDocument();
      });

      await user.click(screen.getByText(UI_TEXT.NAV_HIVE));

      await waitFor(() => {
        expect(screen.getByText('Morning Warmup')).toBeInTheDocument();
        expect(screen.getByText('Hot Water AM')).toBeInTheDocument();
      });
    });

    it('should show heating indicator as active when heating is on', async () => {
      const user = userEvent.setup();
      render(<LightControl sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText(UI_TEXT.NAV_HIVE)).toBeInTheDocument();
      });

      await user.click(screen.getByText(UI_TEXT.NAV_HIVE));

      await waitFor(() => {
        const heatingIndicator = screen.getByLabelText(UI_TEXT.HIVE_HEATING_STATUS);
        expect(heatingIndicator).toHaveClass('active');
      });
    });
  });

  describe('Settings Integration', () => {
    it('should pass Hive state to SettingsPage', async () => {
      const user = userEvent.setup();
      render(<LightControl sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText('Living Room')).toBeInTheDocument();
      });

      // Open settings
      await user.click(screen.getByLabelText('settings'));

      // Use querySelector for the hive section since text appears multiple times
      await waitFor(() => {
        const hiveSection = document.querySelector('.settings-hive-section');
        expect(hiveSection).toBeInTheDocument();
      });
    });

    it('should show link to Hive tab in settings when not connected', async () => {
      const user = userEvent.setup();
      render(<LightControl sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText('Living Room')).toBeInTheDocument();
      });

      await user.click(screen.getByLabelText('settings'));

      await waitFor(() => {
        expect(screen.getByText(UI_TEXT.HIVE_TAB_LINK)).toBeInTheDocument();
      });
    });

    it('should show Disconnect button in settings when connected', async () => {
      const user = userEvent.setup();
      mockHiveState = {
        ...mockHiveState,
        isConnected: true,
        status: mockHiveStatus,
        schedules: mockHiveSchedules,
      };

      render(<LightControl sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText('Living Room')).toBeInTheDocument();
      });

      await user.click(screen.getByLabelText('settings'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: UI_TEXT.HIVE_DISCONNECT })).toBeInTheDocument();
      });
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading state in Hive view', async () => {
      const user = userEvent.setup();
      mockHiveState = {
        ...mockHiveState,
        isConnected: true,
        isLoading: true,
        status: null,
        schedules: [],
      };

      render(<LightControl sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText(UI_TEXT.NAV_HIVE)).toBeInTheDocument();
      });

      await user.click(screen.getByText(UI_TEXT.NAV_HIVE));

      await waitFor(() => {
        expect(screen.getByText(UI_TEXT.HIVE_LOADING)).toBeInTheDocument();
      });
    });

    it('should show error state in Hive view', async () => {
      const user = userEvent.setup();
      mockHiveState = {
        ...mockHiveState,
        isConnected: true,
        error: 'Failed to fetch Hive data',
        status: null,
        schedules: [],
      };

      render(<LightControl sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText(UI_TEXT.NAV_HIVE)).toBeInTheDocument();
      });

      await user.click(screen.getByText(UI_TEXT.NAV_HIVE));

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

      render(<LightControl sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText(UI_TEXT.NAV_HIVE)).toBeInTheDocument();
      });

      await user.click(screen.getByText(UI_TEXT.NAV_HIVE));

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

      render(<LightControl sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText(UI_TEXT.NAV_HIVE)).toBeInTheDocument();
      });

      await user.click(screen.getByText(UI_TEXT.NAV_HIVE));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: UI_TEXT.RETRY })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: UI_TEXT.RETRY }));

      expect(refreshFn).toHaveBeenCalled();
    });
  });
});
