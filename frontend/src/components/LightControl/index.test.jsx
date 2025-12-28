import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LightControl } from './index';

// Create mutable references for mocks (initialized with defaults for hoisted vi.mock)
let mockApi = {
  getDashboard: vi.fn(),
  updateLight: vi.fn(),
  updateRoomLights: vi.fn(),
  updateZoneLights: vi.fn(),
  activateSceneV1: vi.fn(),
};
let mockDashboardData;
let mockWebSocketState;
let mockIsDemoMode = true;

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
      scenes: [
        { id: 'scene-1', name: 'Bright' },
        { id: 'scene-2', name: 'Dim' },
      ],
    },
    {
      id: 'room-2',
      name: 'Bedroom',
      stats: { lightsOnCount: 1, totalLights: 2, averageBrightness: 50 },
      lights: [
        {
          id: 'light-3',
          name: 'Bedside',
          on: true,
          brightness: 50,
          color: '#ffaa00',
          shadow: 'none',
        },
        {
          id: 'light-4',
          name: 'Overhead',
          on: false,
          brightness: 0,
          color: '#ffffff',
          shadow: 'none',
        },
      ],
      scenes: [{ id: 'scene-3', name: 'Night' }],
    },
  ],
  zones: [],
  motionZones: [],
};

// Mock the DemoModeContext
vi.mock('../../context/DemoModeContext', () => ({
  useDemoMode: () => ({
    isDemoMode: mockIsDemoMode,
    api: mockApi,
  }),
}));

vi.mock('../../hooks/useWebSocket', () => ({
  useWebSocket: () => mockWebSocketState,
}));

// Mock window.alert
const mockAlert = vi.fn();
global.alert = mockAlert;

describe('LightControl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDashboardData = JSON.parse(JSON.stringify(baseDashboard));
    mockIsDemoMode = true;
    mockWebSocketState = {
      isConnected: false,
      dashboard: null,
      error: null,
    };
    mockApi = {
      getDashboard: vi.fn().mockImplementation(() => Promise.resolve(mockDashboardData)),
      updateLight: vi.fn().mockImplementation((lightId, state) =>
        Promise.resolve({
          light: { id: lightId, on: state.on, brightness: state.on ? 100 : 0 },
        })
      ),
      updateRoomLights: vi.fn().mockImplementation((roomId, state) =>
        Promise.resolve({
          updatedLights:
            mockDashboardData.rooms
              .find((r) => r.id === roomId)
              ?.lights.map((l) => ({ ...l, on: state.on })) || [],
        })
      ),
      updateZoneLights: vi.fn().mockResolvedValue({ updatedLights: [] }),
      activateSceneV1: vi.fn().mockImplementation(() =>
        Promise.resolve({
          affectedLights: [
            { id: 'light-1', on: true, brightness: 100, color: '#ffffff' },
            { id: 'light-2', on: true, brightness: 100, color: '#ffffff' },
          ],
        })
      ),
    };
  });

  afterEach(() => {
    document.body.classList.remove('dark-theme');
  });

  describe('Loading state', () => {
    it('should show loading state initially', async () => {
      mockApi.getDashboard.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<LightControl sessionToken="test-token" />);

      expect(screen.getByText('Connecting to bridge...')).toBeInTheDocument();
    });

    it('should hide loading when dashboard loads', async () => {
      render(<LightControl sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.queryByText('Connecting to bridge...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error state', () => {
    it('should show error state when fetch fails', async () => {
      mockApi.getDashboard.mockRejectedValue(new Error('Network error'));

      render(<LightControl sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText(/Connection failed/)).toBeInTheDocument();
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });
    });

    it('should show TopToolbar in error state with logout option', async () => {
      const onLogout = vi.fn();
      mockApi.getDashboard.mockRejectedValue(new Error('Network error'));

      render(<LightControl sessionToken="test-token" onLogout={onLogout} />);

      await waitFor(() => {
        expect(screen.getByText(/Connection failed/)).toBeInTheDocument();
      });

      // TopToolbar should still be present with logout button
      expect(document.querySelector('.toolbar-logout')).toBeInTheDocument();
    });
  });

  describe('Demo mode', () => {
    it('should fetch dashboard in demo mode', async () => {
      mockIsDemoMode = true;

      render(<LightControl sessionToken="test-token" />);

      await waitFor(() => {
        expect(mockApi.getDashboard).toHaveBeenCalledWith();
      });
    });
  });

  describe('WebSocket mode (non-demo)', () => {
    beforeEach(() => {
      mockIsDemoMode = false;
    });

    it('should use WebSocket dashboard when connected', async () => {
      mockWebSocketState = {
        isConnected: true,
        dashboard: mockDashboardData,
        error: null,
      };

      render(<LightControl sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText('Living Room')).toBeInTheDocument();
      });

      // Should not fetch in non-demo mode
      expect(mockApi.getDashboard).not.toHaveBeenCalled();
    });

    it('should show connection status from WebSocket', async () => {
      mockWebSocketState = {
        isConnected: true,
        dashboard: mockDashboardData,
        error: null,
      };

      render(<LightControl sessionToken="test-token" onLogout={() => {}} />);

      await waitFor(() => {
        // Should show 'Connected' status when WebSocket is connected
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });
    });
  });

  describe('Dark theme', () => {
    it('should add dark-theme class to body on mount', async () => {
      render(<LightControl sessionToken="test-token" />);

      await waitFor(() => {
        expect(document.body.classList.contains('dark-theme')).toBe(true);
      });
    });

    it('should remove dark-theme class from body on unmount', async () => {
      const { unmount } = render(<LightControl sessionToken="test-token" />);

      await waitFor(() => {
        expect(document.body.classList.contains('dark-theme')).toBe(true);
      });

      unmount();

      expect(document.body.classList.contains('dark-theme')).toBe(false);
    });
  });

  describe('Room navigation', () => {
    it('should select first room by default', async () => {
      render(<LightControl sessionToken="test-token" />);

      await waitFor(() => {
        // First room's lights should be visible
        expect(screen.getByText('Lamp')).toBeInTheDocument();
      });
    });

    it('should switch rooms when nav tab is clicked', async () => {
      const user = userEvent.setup();
      render(<LightControl sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText('Living Room')).toBeInTheDocument();
      });

      // Click on Bedroom tab
      await user.click(screen.getByText('Bedroom'));

      await waitFor(() => {
        expect(screen.getByText('Bedside')).toBeInTheDocument();
      });
    });
  });

  describe('Toggle light', () => {
    it('should toggle light on click', async () => {
      const user = userEvent.setup();
      render(<LightControl sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText('Lamp')).toBeInTheDocument();
      });

      // Find and click the light tile button
      const lightTiles = document.querySelectorAll('.light-tile');
      const lampTile = Array.from(lightTiles).find((tile) => tile.textContent.includes('Lamp'));
      expect(lampTile).toBeTruthy();

      await user.click(lampTile);

      expect(mockApi.updateLight).toHaveBeenCalledWith(
        'light-1',
        { on: false } // Light was on, so turning off
      );
    });

    it('should show error alert when toggle fails', async () => {
      const user = userEvent.setup();
      mockApi.updateLight.mockRejectedValue(new Error('Bridge unreachable'));

      render(<LightControl sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText('Lamp')).toBeInTheDocument();
      });

      const lightTiles = document.querySelectorAll('.light-tile');
      const lampTile = Array.from(lightTiles).find((tile) => tile.textContent.includes('Lamp'));
      await user.click(lampTile);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(expect.stringContaining('Bridge unreachable'));
      });
    });
  });

  describe('Toggle room (via drawer)', () => {
    it('should toggle all lights in room when room toggle clicked in drawer', async () => {
      const user = userEvent.setup();
      render(<LightControl sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText('Living Room')).toBeInTheDocument();
      });

      // Open the scene drawer
      const drawerTrigger = document.querySelector('.scene-drawer-trigger');
      expect(drawerTrigger).toBeTruthy();
      await user.click(drawerTrigger);

      // Find toggle button in drawer
      const toggleButton = document.querySelector('.scene-drawer-toggle');
      expect(toggleButton).toBeTruthy();

      await user.click(toggleButton);

      expect(mockApi.updateRoomLights).toHaveBeenCalledWith(
        'room-1',
        { on: false } // Room has lights on, so turning off
      );
    });

    it('should show error alert when room toggle fails', async () => {
      const user = userEvent.setup();
      mockApi.updateRoomLights.mockRejectedValue(new Error('Room toggle failed'));

      render(<LightControl sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText('Living Room')).toBeInTheDocument();
      });

      // Open the scene drawer
      const drawerTrigger = document.querySelector('.scene-drawer-trigger');
      await user.click(drawerTrigger);

      const toggleButton = document.querySelector('.scene-drawer-toggle');
      await user.click(toggleButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(expect.stringContaining('Room toggle failed'));
      });
    });
  });

  describe('Scene activation (via drawer)', () => {
    it('should activate scene when selected from drawer', async () => {
      const user = userEvent.setup();
      render(<LightControl sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText('Living Room')).toBeInTheDocument();
      });

      // Open the scene drawer
      const drawerTrigger = document.querySelector('.scene-drawer-trigger');
      await user.click(drawerTrigger);

      // Find scene button in drawer
      const sceneItems = document.querySelectorAll('.scene-drawer-item');
      expect(sceneItems.length).toBeGreaterThan(0);

      // Click first scene
      await user.click(sceneItems[0]);

      expect(mockApi.activateSceneV1).toHaveBeenCalledWith('scene-1');
    });

    it('should update lights after scene activation', async () => {
      const user = userEvent.setup();
      render(<LightControl sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText('Living Room')).toBeInTheDocument();
      });

      // Open the scene drawer
      const drawerTrigger = document.querySelector('.scene-drawer-trigger');
      await user.click(drawerTrigger);

      const sceneItems = document.querySelectorAll('.scene-drawer-item');
      await user.click(sceneItems[0]);

      await waitFor(() => {
        expect(mockApi.activateSceneV1).toHaveBeenCalled();
      });
    });

    it('should show error alert when scene activation fails', async () => {
      const user = userEvent.setup();
      mockApi.activateSceneV1.mockRejectedValue(new Error('Scene not found'));

      render(<LightControl sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText('Living Room')).toBeInTheDocument();
      });

      // Open the scene drawer
      const drawerTrigger = document.querySelector('.scene-drawer-trigger');
      await user.click(drawerTrigger);

      const sceneItems = document.querySelectorAll('.scene-drawer-item');
      await user.click(sceneItems[0]);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(expect.stringContaining('Scene not found'));
      });
    });
  });

  describe('TopToolbar', () => {
    it('should display summary stats', async () => {
      render(<LightControl sessionToken="test-token" onLogout={() => {}} />);

      await waitFor(() => {
        // Check that stats are rendered in toolbar
        const statValues = document.querySelectorAll('.toolbar-stat-value');
        expect(statValues.length).toBeGreaterThanOrEqual(3);
        // First stat should be lightsOn (2)
        expect(statValues[0].textContent).toBe('2');
      });
    });

    it('should call onLogout when logout clicked', async () => {
      const user = userEvent.setup();
      const onLogout = vi.fn();

      render(<LightControl sessionToken="test-token" onLogout={onLogout} />);

      await waitFor(() => {
        expect(screen.getByText('Living Room')).toBeInTheDocument();
      });

      // Find logout button by class
      const logoutButton = document.querySelector('.toolbar-logout');
      expect(logoutButton).toBeTruthy();

      await user.click(logoutButton);

      expect(onLogout).toHaveBeenCalled();
    });
  });

  describe('MotionZones', () => {
    it('should render MotionZones component', async () => {
      mockDashboardData.motionZones = [{ id: 'motion-1', name: 'Hallway', motionDetected: true }];

      render(<LightControl sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText('Living Room')).toBeInTheDocument();
      });

      // MotionZones component should be rendered
      // It may or may not show visible content depending on motion zones
    });
  });

  describe('getLightByUuid helper', () => {
    it('should find light across rooms', async () => {
      const user = userEvent.setup();
      render(<LightControl sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText('Lamp')).toBeInTheDocument();
      });

      // Toggle a light - this internally uses getLightByUuid
      const lampTile = screen.getByText('Lamp').closest('.light-tile');
      await user.click(lampTile);

      // If getLightByUuid works, updateLight should be called
      expect(mockApi.updateLight).toHaveBeenCalled();
    });

    it('should handle light not found', async () => {
      const user = userEvent.setup();

      // Make updateLight return a non-existent light ID
      mockApi.updateLight.mockImplementation(() => {
        throw new Error('Light not found');
      });

      render(<LightControl sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText('Lamp')).toBeInTheDocument();
      });

      const lampTile = screen.getByText('Lamp').closest('.light-tile');
      await user.click(lampTile);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalled();
      });
    });
  });

  describe('Empty states', () => {
    it('should handle empty rooms array', async () => {
      mockDashboardData = {
        ...baseDashboard,
        rooms: [],
      };

      render(<LightControl sessionToken="test-token" />);

      await waitFor(() => {
        // Should not crash, component should render
        expect(screen.queryByText('Connecting to bridge...')).not.toBeInTheDocument();
      });
    });

    it('should handle null dashboard gracefully', async () => {
      mockApi.getDashboard.mockResolvedValue(null);

      render(<LightControl sessionToken="test-token" />);

      // Should show loading since dashboard is null
      await waitFor(() => {
        expect(screen.getByText('Connecting to bridge...')).toBeInTheDocument();
      });
    });
  });

  describe('Settings navigation', () => {
    it('should open settings page when gear icon clicked', async () => {
      const user = userEvent.setup();
      render(<LightControl sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText('Living Room')).toBeInTheDocument();
      });

      // Click gear icon to open settings
      await user.click(screen.getByRole('button', { name: /settings/i }));

      await waitFor(() => {
        expect(document.querySelector('.settings-page')).toBeInTheDocument();
      });
    });

    it('should close settings page when gear icon clicked while settings is open', async () => {
      const user = userEvent.setup();
      render(<LightControl sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText('Living Room')).toBeInTheDocument();
      });

      // Open settings
      await user.click(screen.getByRole('button', { name: /settings/i }));

      await waitFor(() => {
        expect(document.querySelector('.settings-page')).toBeInTheDocument();
      });

      // Click gear icon again to close settings
      await user.click(screen.getByRole('button', { name: /settings/i }));

      await waitFor(() => {
        expect(document.querySelector('.settings-page')).not.toBeInTheDocument();
      });
    });

    it('should close settings page when nav tab clicked', async () => {
      const user = userEvent.setup();
      render(<LightControl sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText('Living Room')).toBeInTheDocument();
      });

      // Open settings
      await user.click(screen.getByRole('button', { name: /settings/i }));

      await waitFor(() => {
        expect(document.querySelector('.settings-page')).toBeInTheDocument();
      });

      // Click a room tab in bottom nav
      await user.click(screen.getByText('Bedroom'));

      await waitFor(() => {
        // Settings should be closed
        expect(document.querySelector('.settings-page')).not.toBeInTheDocument();
        // And Bedroom content should be visible
        expect(screen.getByText('Bedside')).toBeInTheDocument();
      });
    });

    it('should close settings page when back button clicked', async () => {
      const user = userEvent.setup();
      render(<LightControl sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText('Living Room')).toBeInTheDocument();
      });

      // Open settings
      await user.click(screen.getByRole('button', { name: /settings/i }));

      await waitFor(() => {
        expect(document.querySelector('.settings-page')).toBeInTheDocument();
      });

      // Click back button
      await user.click(screen.getByRole('button', { name: /back/i }));

      await waitFor(() => {
        expect(document.querySelector('.settings-page')).not.toBeInTheDocument();
      });
    });
  });
});
