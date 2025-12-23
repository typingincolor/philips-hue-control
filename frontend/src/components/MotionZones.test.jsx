import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MotionZones } from './MotionZones';

// Mock the hooks
vi.mock('../hooks/useHueApi', () => ({
  useHueApi: vi.fn()
}));

import { useHueApi } from '../hooks/useHueApi';

describe('MotionZones', () => {
  const mockGetMotionZones = vi.fn();
  const mockApi = {
    getMotionZones: mockGetMotionZones
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useHueApi.mockReturnValue(mockApi);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return null when no zones have motion', () => {
    const zones = [
      { id: 'zone-1', name: 'Kitchen', motionDetected: false, reachable: true }
    ];

    const { container } = render(
      <MotionZones sessionToken="test-session-token" motionZones={zones} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should return null when zones array is empty', () => {
    const { container } = render(
      <MotionZones sessionToken="test-session-token" motionZones={[]} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should show alert when motion is detected', () => {
    const zones = [
      { id: 'zone-1', name: 'Kitchen', motionDetected: true, reachable: true }
    ];

    render(<MotionZones sessionToken="test-session-token" motionZones={zones} />);

    expect(screen.getByText(/Motion: Kitchen/)).toBeInTheDocument();
    expect(screen.getByText('🔴')).toBeInTheDocument();
  });

  it('should show multiple alerts for multiple motion zones', () => {
    const zones = [
      { id: 'zone-1', name: 'Kitchen', motionDetected: true, reachable: true },
      { id: 'zone-2', name: 'Living Room', motionDetected: true, reachable: true }
    ];

    render(<MotionZones sessionToken="test-session-token" motionZones={zones} />);

    expect(screen.getByText(/Motion: Kitchen/)).toBeInTheDocument();
    expect(screen.getByText(/Motion: Living Room/)).toBeInTheDocument();
  });

  it('should auto-dismiss alert after 3 seconds', async () => {
    vi.useFakeTimers();

    const zones = [
      { id: 'zone-1', name: 'Kitchen', motionDetected: true, reachable: true }
    ];

    render(<MotionZones sessionToken="test-session-token" motionZones={zones} />);

    expect(screen.getByText(/Motion: Kitchen/)).toBeInTheDocument();

    // Fast-forward 3 seconds
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByText(/Motion: Kitchen/)).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it('should not show alert for unreachable zones', () => {
    const zones = [
      { id: 'zone-1', name: 'Kitchen', motionDetected: true, reachable: false }
    ];

    const { container } = render(
      <MotionZones sessionToken="test-session-token" motionZones={zones} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should fetch from API when no motionZones prop provided', async () => {
    mockGetMotionZones.mockResolvedValue({
      zones: [{ id: 'zone-1', name: 'Kitchen', motionDetected: true, reachable: true }]
    });

    render(<MotionZones sessionToken="test-session-token" />);

    await waitFor(() => {
      expect(mockGetMotionZones).toHaveBeenCalledWith('test-session-token');
    });

    await waitFor(() => {
      expect(screen.getByText(/Motion: Kitchen/)).toBeInTheDocument();
    });
  });

  it('should not fetch when sessionToken is empty', () => {
    render(<MotionZones sessionToken="" />);

    expect(mockGetMotionZones).not.toHaveBeenCalled();
  });

  it('should have correct alert structure', () => {
    const zones = [
      { id: 'zone-1', name: 'Kitchen', motionDetected: true, reachable: true }
    ];

    const { container } = render(
      <MotionZones sessionToken="test-session-token" motionZones={zones} />
    );

    expect(container.querySelector('.motion-alert-container')).toBeInTheDocument();
    expect(container.querySelector('.motion-alert')).toBeInTheDocument();
    expect(container.querySelector('.motion-alert-dot')).toBeInTheDocument();
    expect(container.querySelector('.motion-alert-text')).toBeInTheDocument();
  });
});
