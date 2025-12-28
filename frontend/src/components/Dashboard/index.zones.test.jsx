import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dashboard } from './index';
import {
  getDashboardFromHome,
  updateLight,
  updateRoomLights,
  updateZoneLights,
  activateSceneV1,
} from '../../services/homeAdapter';

let mockDashboardData;

const baseDashboard = {
  summary: {
    lightsOn: 3,
    totalLights: 6,
    roomCount: 2,
    sceneCount: 4,
  },
  rooms: [
    {
      id: 'room-1',
      name: 'Living Room',
      stats: { lightsOnCount: 2, totalLights: 3, averageBrightness: 75 },
      lights: [
        { id: 'light-1', name: 'Light 1', on: true, brightness: 80 },
        { id: 'light-2', name: 'Light 2', on: true, brightness: 70 },
        { id: 'light-3', name: 'Light 3', on: false, brightness: 0 },
      ],
      scenes: [{ id: 'scene-1', name: 'Bright' }],
    },
  ],
  zones: [
    {
      id: 'zone-1',
      name: 'Upstairs',
      stats: { lightsOnCount: 2, totalLights: 4, averageBrightness: 80 },
      lights: [
        { id: 'light-1', name: 'Light 1', on: true, brightness: 80 },
        { id: 'light-4', name: 'Light 4', on: true, brightness: 80 },
      ],
      scenes: [{ id: 'scene-2', name: 'Evening' }],
    },
    {
      id: 'zone-2',
      name: 'Downstairs',
      stats: { lightsOnCount: 1, totalLights: 2, averageBrightness: 70 },
      lights: [
        { id: 'light-2', name: 'Light 2', on: true, brightness: 70 },
        { id: 'light-5', name: 'Light 5', on: false, brightness: 0 },
      ],
      scenes: [{ id: 'scene-3', name: 'Morning' }],
    },
  ],
  motionZones: [],
};

// Mock the homeAdapter
vi.mock('../../services/homeAdapter', () => ({
  getDashboardFromHome: vi.fn(),
  updateLight: vi.fn(),
  updateRoomLights: vi.fn(),
  updateZoneLights: vi.fn(),
  activateSceneV1: vi.fn(),
}));

// Mock the DemoModeContext
vi.mock('../../context/DemoModeContext', () => ({
  useDemoMode: () => ({
    isDemoMode: true,
  }),
}));

vi.mock('../../hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    isConnected: false,
    dashboard: null,
    error: null,
  }),
}));

describe('Dashboard - Zones (Navigation)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDashboardData = { ...baseDashboard };
    // Reset homeAdapter mocks
    getDashboardFromHome.mockImplementation(() => Promise.resolve(mockDashboardData));
    updateLight.mockResolvedValue({ light: {} });
    updateRoomLights.mockResolvedValue({ updatedLights: [] });
    updateZoneLights.mockResolvedValue({ updatedLights: [] });
    activateSceneV1.mockResolvedValue({ affectedLights: [] });
  });

  it('should render Zones tab in bottom nav when zones are present', async () => {
    render(<Dashboard sessionToken="test-token" />);

    await waitFor(() => {
      // Look for Zones tab in bottom navigation
      expect(screen.getByText('Zones')).toBeInTheDocument();
    });
  });

  it('should show zones view when Zones tab is clicked', async () => {
    const user = userEvent.setup();
    render(<Dashboard sessionToken="test-token" />);

    // Wait for dashboard to load
    await waitFor(() => {
      expect(screen.getByText('Zones')).toBeInTheDocument();
    });

    // Click Zones tab
    await user.click(screen.getByText('Zones'));

    await waitFor(() => {
      expect(screen.getByText('Upstairs')).toBeInTheDocument();
      expect(screen.getByText('Downstairs')).toBeInTheDocument();
    });
  });

  it('should display zone stats in zones view', async () => {
    const user = userEvent.setup();
    render(<Dashboard sessionToken="test-token" />);

    await waitFor(() => {
      expect(screen.getByText('Zones')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Zones'));

    await waitFor(() => {
      // Check for zone stats format "X of Y on"
      expect(screen.getByText(/2 of 4 on/)).toBeInTheDocument();
      expect(screen.getByText(/1 of 2 on/)).toBeInTheDocument();
    });
  });

  it('should not render Zones tab when no zones exist', async () => {
    mockDashboardData = { ...baseDashboard, zones: [] };

    render(<Dashboard sessionToken="test-token" />);

    await waitFor(() => {
      // Dashboard should load - check for room name in nav
      expect(screen.getByText('Living Room')).toBeInTheDocument();
    });

    // Zones tab should not be present
    expect(screen.queryByText('Zones')).not.toBeInTheDocument();
  });

  it('should not render Zones tab when zones is undefined', async () => {
    const dashboardWithoutZones = { ...baseDashboard };
    delete dashboardWithoutZones.zones;
    mockDashboardData = dashboardWithoutZones;

    render(<Dashboard sessionToken="test-token" />);

    await waitFor(() => {
      expect(screen.getByText('Living Room')).toBeInTheDocument();
    });

    expect(screen.queryByText('Zones')).not.toBeInTheDocument();
  });

  it('should render zone scenes in zones view', async () => {
    const user = userEvent.setup();
    render(<Dashboard sessionToken="test-token" />);

    await waitFor(() => {
      expect(screen.getByText('Zones')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Zones'));

    await waitFor(() => {
      expect(screen.getByText('Evening')).toBeInTheDocument();
      expect(screen.getByText('Morning')).toBeInTheDocument();
    });
  });

  it('should render zone toggle buttons in zones view', async () => {
    const user = userEvent.setup();
    render(<Dashboard sessionToken="test-token" />);

    await waitFor(() => {
      expect(screen.getByText('Zones')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Zones'));

    await waitFor(() => {
      // Zones have lights on, so should show "Off" buttons
      const offButtons = screen.getAllByText(/Off/);
      expect(offButtons.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('should call toggleZone when zone Off button is clicked', async () => {
    const user = userEvent.setup();

    render(<Dashboard sessionToken="test-token" />);

    await waitFor(() => {
      expect(screen.getByText('Zones')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Zones'));

    await waitFor(() => {
      expect(screen.getByText('Upstairs')).toBeInTheDocument();
    });

    // Find zone items and click the first Off button
    const zoneItems = document.querySelectorAll('.zone-item-dark');
    expect(zoneItems.length).toBe(2);

    const upstairsZone = Array.from(zoneItems).find((item) =>
      item.textContent.includes('Upstairs')
    );
    expect(upstairsZone).toBeTruthy();

    const offButton = upstairsZone.querySelector('.zone-toggle-btn');
    expect(offButton).toBeTruthy();

    await user.click(offButton);

    expect(updateZoneLights).toHaveBeenCalledWith('zone-1', { on: false }, true);
  });

  it('should show zone count badge on Zones tab', async () => {
    render(<Dashboard sessionToken="test-token" />);

    await waitFor(() => {
      expect(screen.getByText('Zones')).toBeInTheDocument();
    });

    // The badge shows the zone count
    const zonesTab = screen.getByText('Zones').closest('.nav-tab');
    expect(zonesTab).toBeTruthy();
    expect(zonesTab.textContent).toContain('2');
  });
});
