import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ZoneCard } from './ZoneCard';

describe('ZoneCard', () => {
  const mockZone = {
    id: 'zone-1',
    name: 'Upstairs',
    stats: {
      lightsOnCount: 3,
      totalLights: 5,
      averageBrightness: 80.5
    },
    lights: [
      { id: 'light-1', name: 'Light 1', on: true, brightness: 80 },
      { id: 'light-2', name: 'Light 2', on: true, brightness: 75 },
      { id: 'light-3', name: 'Light 3', on: true, brightness: 86 },
      { id: 'light-4', name: 'Light 4', on: false, brightness: 0 },
      { id: 'light-5', name: 'Light 5', on: false, brightness: 0 }
    ],
    scenes: [
      { id: 'scene-1', name: 'Morning' },
      { id: 'scene-2', name: 'Evening' }
    ]
  };

  const defaultProps = {
    zoneName: 'Upstairs',
    zone: mockZone,
    onToggleZone: vi.fn(),
    onActivateScene: vi.fn(),
    togglingLights: new Set(),
    isActivating: false
  };

  it('should render zone name', () => {
    render(<ZoneCard {...defaultProps} />);
    expect(screen.getByText('Upstairs')).toBeInTheDocument();
  });

  it('should display pre-computed zone stats from backend', () => {
    render(<ZoneCard {...defaultProps} />);
    expect(screen.getByText('3/5')).toBeInTheDocument();
    expect(screen.getByText('81%')).toBeInTheDocument();
  });

  it('should show placeholder when no lights are on', () => {
    const zoneAllOff = {
      ...mockZone,
      stats: { lightsOnCount: 0, totalLights: 5, averageBrightness: 0 }
    };
    render(<ZoneCard {...defaultProps} zone={zoneAllOff} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('should render scene selector with scenes', () => {
    render(<ZoneCard {...defaultProps} />);
    expect(screen.getByText('Morning')).toBeInTheDocument();
    expect(screen.getByText('Evening')).toBeInTheDocument();
  });

  it('should show "Off" button when some lights are on', () => {
    render(<ZoneCard {...defaultProps} />);
    expect(screen.getByText('🌙 Off')).toBeInTheDocument();
  });

  it('should show "On" button when no lights are on', () => {
    const zoneAllOff = {
      ...mockZone,
      stats: { lightsOnCount: 0, totalLights: 5, averageBrightness: 0 },
      lights: mockZone.lights.map(l => ({ ...l, on: false, brightness: 0 }))
    };
    render(<ZoneCard {...defaultProps} zone={zoneAllOff} />);
    expect(screen.getByText('💡 On')).toBeInTheDocument();
  });

  it('should call onToggleZone with zone ID and light UUIDs when On clicked', async () => {
    const user = userEvent.setup();
    const onToggleZone = vi.fn();
    const zoneAllOff = {
      ...mockZone,
      stats: { lightsOnCount: 0, totalLights: 5, averageBrightness: 0 },
      lights: mockZone.lights.map(l => ({ ...l, on: false, brightness: 0 }))
    };
    render(<ZoneCard {...defaultProps} zone={zoneAllOff} onToggleZone={onToggleZone} />);

    const allButton = screen.getByText('💡 On');
    await user.click(allButton);

    expect(onToggleZone).toHaveBeenCalledWith(
      'zone-1',
      ['light-1', 'light-2', 'light-3', 'light-4', 'light-5'],
      true
    );
  });

  it('should call onToggleZone with false when Off clicked', async () => {
    const user = userEvent.setup();
    const onToggleZone = vi.fn();
    render(<ZoneCard {...defaultProps} onToggleZone={onToggleZone} />);

    const allButton = screen.getByText('🌙 Off');
    await user.click(allButton);

    expect(onToggleZone).toHaveBeenCalledWith(
      'zone-1',
      ['light-1', 'light-2', 'light-3', 'light-4', 'light-5'],
      false
    );
  });

  it('should disable All button when all lights are toggling', () => {
    const togglingLights = new Set(['light-1', 'light-2', 'light-3', 'light-4', 'light-5']);
    const { container } = render(<ZoneCard {...defaultProps} togglingLights={togglingLights} />);

    const allButton = container.querySelector('.zone-control-button');
    expect(allButton).toBeDisabled();
  });

  it('should show loading emoji when all lights toggling', () => {
    const togglingLights = new Set(['light-1', 'light-2', 'light-3', 'light-4', 'light-5']);
    render(<ZoneCard {...defaultProps} togglingLights={togglingLights} />);

    expect(screen.getByText('⏳')).toBeInTheDocument();
  });

  it('should call onActivateScene when scene button is clicked', async () => {
    const user = userEvent.setup();
    const onActivateScene = vi.fn();
    render(<ZoneCard {...defaultProps} onActivateScene={onActivateScene} />);

    const morningButton = screen.getByTitle('Morning');
    await user.click(morningButton);

    expect(onActivateScene).toHaveBeenCalledWith('scene-1');
  });

  it('should have correct structure', () => {
    const { container } = render(<ZoneCard {...defaultProps} />);

    expect(container.querySelector('.zone-bar')).toBeInTheDocument();
    expect(container.querySelector('.zone-bar-info')).toBeInTheDocument();
    expect(container.querySelector('.zone-bar-controls')).toBeInTheDocument();
    expect(container.querySelector('.zone-badges')).toBeInTheDocument();
  });

  it('should handle zone with no scenes', () => {
    const zoneNoScenes = { ...mockZone, scenes: [] };
    const { container } = render(<ZoneCard {...defaultProps} zone={zoneNoScenes} />);

    // SceneSelector returns null when no scenes
    expect(container.querySelector('.scene-selector')).not.toBeInTheDocument();
  });

  it('should use pre-computed stats for display', () => {
    const zone = {
      ...mockZone,
      stats: {
        lightsOnCount: 4,
        totalLights: 6,
        averageBrightness: 92.7
      }
    };
    render(<ZoneCard {...defaultProps} zone={zone} />);

    expect(screen.getByText('4/6')).toBeInTheDocument();
    expect(screen.getByText('93%')).toBeInTheDocument();
  });
});
