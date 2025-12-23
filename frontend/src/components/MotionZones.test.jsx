import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MotionZones } from './MotionZones';

// Mock the hooks
vi.mock('../hooks/useHueApi', () => ({
  useHueApi: vi.fn()
}));

vi.mock('../hooks/useDemoMode', () => ({
  useDemoMode: vi.fn()
}));

vi.mock('../hooks/usePolling', () => ({
  usePolling: vi.fn()
}));

import { useHueApi } from '../hooks/useHueApi';
import { useDemoMode } from '../hooks/useDemoMode';
import { usePolling } from '../hooks/usePolling';

describe('MotionZones', () => {
  const mockGetMotionZones = vi.fn();
  const mockApi = {
    getMotionZones: mockGetMotionZones
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useHueApi.mockReturnValue(mockApi);
    useDemoMode.mockReturnValue(false);
    usePolling.mockImplementation((callback) => {
      // Don't actually poll in tests
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const mockZones = [
    {
      id: 'zone-1',
      name: 'Hallway MotionAware',
      motionDetected: false,
      enabled: true,
      reachable: true,
      lastChanged: '2025-12-23T10:30:00Z'
    },
    {
      id: 'zone-2',
      name: 'Bedroom MotionAware',
      motionDetected: true,
      enabled: true,
      reachable: true,
      lastChanged: '2025-12-23T10:45:00Z'
    }
  ];

  it('should render motion zones', async () => {
    mockGetMotionZones.mockResolvedValue({ zones: mockZones });

    render(<MotionZones sessionToken="test-session-token" />);

    await waitFor(() => {
      expect(screen.getByText('Motion Zones')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Hallway MotionAware')).toBeInTheDocument();
      expect(screen.getByText('Bedroom MotionAware')).toBeInTheDocument();
    });
  });

  it('should show green dot when no motion detected', async () => {
    mockGetMotionZones.mockResolvedValue({ zones: mockZones });

    render(<MotionZones sessionToken="test-session-token" />);

    await waitFor(() => {
      expect(screen.getByText('Hallway MotionAware')).toBeInTheDocument();
    });

    const motionZones = screen.getAllByText('🟢');
    expect(motionZones.length).toBeGreaterThan(0);
  });

  it('should show red dot when motion detected', async () => {
    mockGetMotionZones.mockResolvedValue({ zones: mockZones });

    render(<MotionZones sessionToken="test-session-token" />);

    await waitFor(() => {
      expect(screen.getByText('Bedroom MotionAware')).toBeInTheDocument();
    });

    const motionZones = screen.getAllByText('🔴');
    expect(motionZones.length).toBeGreaterThan(0);
  });

  it('should return null when no zones found', async () => {
    mockGetMotionZones.mockResolvedValue({ zones: [] });

    const { container } = render(
      <MotionZones sessionToken="test-session-token" />
    );

    await waitFor(() => {
      expect(mockGetMotionZones).toHaveBeenCalled();
    });

    expect(container.firstChild).toBeNull();
  });

  it('should show loading state initially', () => {
    mockGetMotionZones.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<MotionZones sessionToken="test-session-token" />);

    expect(screen.getByText('Loading sensors...')).toBeInTheDocument();
  });

  it('should show error message on fetch failure', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGetMotionZones.mockRejectedValue(new Error('Network error'));

    render(<MotionZones sessionToken="test-session-token" />);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        '[MotionZones] Failed to fetch MotionAware data:',
        expect.any(Error)
      );
    });

    // Error is logged but component returns null when no zones
    expect(mockGetMotionZones).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('should call API with correct parameters', async () => {
    mockGetMotionZones.mockResolvedValue({ zones: mockZones });

    render(<MotionZones sessionToken="test-session-token" />);

    await waitFor(() => {
      expect(mockGetMotionZones).toHaveBeenCalledWith('test-session-token');
    });
  });

  it('should mark unreachable zones', async () => {
    const zonesWithUnreachable = [
      { ...mockZones[0], reachable: false }
    ];
    mockGetMotionZones.mockResolvedValue({ zones: zonesWithUnreachable });

    const { container } = render(
      <MotionZones sessionToken="test-session-token" />
    );

    await waitFor(() => {
      expect(screen.getByText('Hallway MotionAware')).toBeInTheDocument();
    });

    const unreachableZone = container.querySelector('.unreachable');
    expect(unreachableZone).toBeInTheDocument();
  });

  it('should setup polling with correct interval', () => {
    mockGetMotionZones.mockResolvedValue({ zones: mockZones });

    render(<MotionZones sessionToken="test-session-token" />);

    expect(usePolling).toHaveBeenCalled();
    const pollingArgs = usePolling.mock.calls[0];
    expect(pollingArgs[1]).toBeDefined(); // Interval
    expect(pollingArgs[2]).toBe(true); // Should be enabled (not in demo mode)
  });

  it('should not poll in demo mode', () => {
    useDemoMode.mockReturnValue(true);
    mockGetMotionZones.mockResolvedValue({ zones: mockZones });

    render(<MotionZones sessionToken="test-session-token" />);

    expect(usePolling).toHaveBeenCalled();
    const pollingArgs = usePolling.mock.calls[0];
    expect(pollingArgs[2]).toBe(false); // Should be disabled in demo mode
  });

  it('should handle zones without motion data gracefully', async () => {
    const incompleteZones = [
      {
        id: 'zone-1',
        name: 'Test Zone',
        enabled: true,
        reachable: true
      }
    ];
    mockGetMotionZones.mockResolvedValue({ zones: incompleteZones });

    render(<MotionZones sessionToken="test-session-token" />);

    await waitFor(() => {
      expect(screen.getByText('Test Zone')).toBeInTheDocument();
    });
  });

  it('should have correct structure', async () => {
    mockGetMotionZones.mockResolvedValue({ zones: mockZones });

    const { container } = render(
      <MotionZones sessionToken="test-session-token" />
    );

    await waitFor(() => {
      expect(screen.getByText('Motion Zones')).toBeInTheDocument();
    });

    expect(container.querySelector('.motion-zones')).toBeInTheDocument();
    expect(container.querySelector('.motion-zones-header')).toBeInTheDocument();
    expect(container.querySelector('.motion-zones-row')).toBeInTheDocument();
  });

  it('should not render when missing credentials', () => {
    const { container } = render(
      <MotionZones sessionToken="" />
    );

    // Should not make API call without credentials
    expect(mockGetMotionZones).not.toHaveBeenCalled();
  });
});
