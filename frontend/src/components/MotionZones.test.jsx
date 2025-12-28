import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MotionZones } from './MotionZones';

// Mock the context - MotionZones feature is currently disabled
// These tests are kept for when the feature is re-enabled
vi.mock('../context/DemoModeContext', () => ({
  useDemoMode: () => ({
    isDemoMode: false,
  }),
}));

describe('MotionZones', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return null when no zones have motion', () => {
    const zones = [{ id: 'zone-1', name: 'Kitchen', motionDetected: false, reachable: true }];

    const { container } = render(<MotionZones motionZones={zones} />);

    expect(container.firstChild).toBeNull();
  });

  it('should return null when zones array is empty', () => {
    const { container } = render(<MotionZones motionZones={[]} />);

    expect(container.firstChild).toBeNull();
  });

  it('should show alert when motion is detected', () => {
    const zones = [{ id: 'zone-1', name: 'Kitchen', motionDetected: true, reachable: true }];

    render(<MotionZones motionZones={zones} />);

    expect(screen.getByText(/Motion: Kitchen/)).toBeInTheDocument();
    expect(screen.getByText('🔴')).toBeInTheDocument();
  });

  it('should show multiple alerts for multiple motion zones', () => {
    const zones = [
      { id: 'zone-1', name: 'Kitchen', motionDetected: true, reachable: true },
      { id: 'zone-2', name: 'Living Room', motionDetected: true, reachable: true },
    ];

    render(<MotionZones motionZones={zones} />);

    expect(screen.getByText(/Motion: Kitchen/)).toBeInTheDocument();
    expect(screen.getByText(/Motion: Living Room/)).toBeInTheDocument();
  });

  it('should auto-dismiss alert after 3 seconds', async () => {
    vi.useFakeTimers();

    const zones = [{ id: 'zone-1', name: 'Kitchen', motionDetected: true, reachable: true }];

    render(<MotionZones motionZones={zones} />);

    expect(screen.getByText(/Motion: Kitchen/)).toBeInTheDocument();

    // Fast-forward 3 seconds
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByText(/Motion: Kitchen/)).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it('should not show alert for unreachable zones', () => {
    const zones = [{ id: 'zone-1', name: 'Kitchen', motionDetected: true, reachable: false }];

    const { container } = render(<MotionZones motionZones={zones} />);

    expect(container.firstChild).toBeNull();
  });

  // Note: API fetch test removed - MotionZones feature is disabled
  // When re-enabled, the component will need to be updated to use the new V2 API

  it('should have correct alert structure', () => {
    const zones = [{ id: 'zone-1', name: 'Kitchen', motionDetected: true, reachable: true }];

    const { container } = render(<MotionZones motionZones={zones} />);

    expect(container.querySelector('.motion-alert-container')).toBeInTheDocument();
    expect(container.querySelector('.motion-alert')).toBeInTheDocument();
    expect(container.querySelector('.motion-alert-dot')).toBeInTheDocument();
    expect(container.querySelector('.motion-alert-text')).toBeInTheDocument();
  });
});
