import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LightControl } from './index';

// Create mutable reference for mock API
let mockApi;
let mockDashboardData;

const baseDashboard = {
  summary: {
    lightsOn: 3,
    totalLights: 6,
    roomCount: 2,
    sceneCount: 4
  },
  rooms: [
    {
      id: 'room-1',
      name: 'Living Room',
      stats: { lightsOnCount: 2, totalLights: 3, averageBrightness: 75 },
      lights: [
        { id: 'light-1', name: 'Light 1', on: true, brightness: 80 },
        { id: 'light-2', name: 'Light 2', on: true, brightness: 70 },
        { id: 'light-3', name: 'Light 3', on: false, brightness: 0 }
      ],
      scenes: [{ id: 'scene-1', name: 'Bright' }]
    }
  ],
  zones: [
    {
      id: 'zone-1',
      name: 'Upstairs',
      stats: { lightsOnCount: 2, totalLights: 4, averageBrightness: 80 },
      lights: [
        { id: 'light-1', name: 'Light 1', on: true, brightness: 80 },
        { id: 'light-4', name: 'Light 4', on: true, brightness: 80 }
      ],
      scenes: [{ id: 'scene-2', name: 'Evening' }]
    },
    {
      id: 'zone-2',
      name: 'Downstairs',
      stats: { lightsOnCount: 1, totalLights: 2, averageBrightness: 70 },
      lights: [
        { id: 'light-2', name: 'Light 2', on: true, brightness: 70 },
        { id: 'light-5', name: 'Light 5', on: false, brightness: 0 }
      ],
      scenes: [{ id: 'scene-3', name: 'Morning' }]
    }
  ],
  motionZones: []
};

// Mock hooks
vi.mock('../../hooks/useHueApi', () => ({
  useHueApi: () => mockApi
}));

vi.mock('../../hooks/useDemoMode', () => ({
  useDemoMode: () => true // Always demo mode for tests
}));

vi.mock('../../hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    isConnected: false,
    dashboard: null,
    error: null
  })
}));

describe('LightControl - Zones', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDashboardData = { ...baseDashboard };
    mockApi = {
      getDashboard: vi.fn().mockImplementation(() => Promise.resolve(mockDashboardData)),
      updateLight: vi.fn().mockResolvedValue({ light: {} }),
      updateRoomLights: vi.fn().mockResolvedValue({ updatedLights: [] }),
      updateZoneLights: vi.fn().mockResolvedValue({ updatedLights: [] }),
      activateSceneV1: vi.fn().mockResolvedValue({ affectedLights: [] })
    };
  });

  it('should render zones section when zones are present', async () => {
    render(<LightControl sessionToken="test-token" />);

    await waitFor(() => {
      expect(screen.getByText('Zones')).toBeInTheDocument();
    });
  });

  it('should render zone cards for each zone', async () => {
    render(<LightControl sessionToken="test-token" />);

    await waitFor(() => {
      expect(screen.getByText('Upstairs')).toBeInTheDocument();
      expect(screen.getByText('Downstairs')).toBeInTheDocument();
    });
  });

  it('should display zone stats', async () => {
    render(<LightControl sessionToken="test-token" />);

    await waitFor(() => {
      // Check for zone stats
      expect(screen.getByText('2 of 4 on')).toBeInTheDocument();
      expect(screen.getByText('1 of 2 on')).toBeInTheDocument();
    });
  });

  it('should not render zones section when no zones exist', async () => {
    mockDashboardData = { ...baseDashboard, zones: [] };

    render(<LightControl sessionToken="test-token" />);

    await waitFor(() => {
      expect(screen.getByText('Lights (6)')).toBeInTheDocument();
    });

    expect(screen.queryByText('Zones')).not.toBeInTheDocument();
  });

  it('should not render zones section when zones is undefined', async () => {
    const dashboardWithoutZones = { ...baseDashboard };
    delete dashboardWithoutZones.zones;
    mockDashboardData = dashboardWithoutZones;

    render(<LightControl sessionToken="test-token" />);

    await waitFor(() => {
      expect(screen.getByText('Lights (6)')).toBeInTheDocument();
    });

    expect(screen.queryByText('Zones')).not.toBeInTheDocument();
  });

  it('should render zone scenes', async () => {
    render(<LightControl sessionToken="test-token" />);

    await waitFor(() => {
      expect(screen.getByText('Evening')).toBeInTheDocument();
      expect(screen.getByText('Morning')).toBeInTheDocument();
    });
  });

  it('should render zone toggle buttons', async () => {
    render(<LightControl sessionToken="test-token" />);

    await waitFor(() => {
      // Zones have lights on, so should show "All Off" buttons
      const allOffButtons = screen.getAllByText('🌙 All Off');
      expect(allOffButtons.length).toBeGreaterThanOrEqual(2); // At least 2 zones
    });
  });

  it('should call toggleZone when zone All Off clicked', async () => {
    const user = userEvent.setup();

    render(<LightControl sessionToken="test-token" />);

    await waitFor(() => {
      expect(screen.getByText('Upstairs')).toBeInTheDocument();
    });

    // Find the zone control button in the Upstairs zone
    const zoneCards = document.querySelectorAll('.zone-group');
    const upstairsCard = Array.from(zoneCards).find(card =>
      card.textContent.includes('Upstairs')
    );

    expect(upstairsCard).toBeTruthy();

    const allOffButton = upstairsCard.querySelector('.zone-control-button');
    expect(allOffButton).toBeTruthy();

    await user.click(allOffButton);

    expect(mockApi.updateZoneLights).toHaveBeenCalledWith(
      'test-token',
      'zone-1',
      { on: false }
    );
  });
});
