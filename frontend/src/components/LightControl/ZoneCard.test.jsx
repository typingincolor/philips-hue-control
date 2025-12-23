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
      {
        id: 'light-1',
        name: 'Light 1',
        on: true,
        brightness: 80,
        color: 'rgb(255, 200, 100)',
        shadow: '0 0 20px rgba(255, 200, 100, 0.4)',
        colorSource: 'xy'
      },
      {
        id: 'light-2',
        name: 'Light 2',
        on: true,
        brightness: 75,
        color: 'rgb(255, 180, 120)',
        shadow: '0 0 18px rgba(255, 180, 120, 0.38)',
        colorSource: 'temperature'
      },
      {
        id: 'light-3',
        name: 'Light 3',
        on: true,
        brightness: 86,
        color: 'rgb(255, 220, 140)',
        shadow: '0 0 22px rgba(255, 220, 140, 0.45)',
        colorSource: 'xy'
      },
      {
        id: 'light-4',
        name: 'Light 4',
        on: false,
        brightness: 0,
        color: null,
        shadow: null,
        colorSource: null
      },
      {
        id: 'light-5',
        name: 'Light 5',
        on: false,
        brightness: 0,
        color: null,
        shadow: null,
        colorSource: null
      }
    ],
    scenes: [
      { id: 'scene-1', name: 'Morning' },
      { id: 'scene-2', name: 'Evening' }
    ]
  };

  const defaultProps = {
    zoneName: 'Upstairs',
    zone: mockZone,
    onToggleLight: vi.fn(),
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
    expect(screen.getByText('3 of 5 on')).toBeInTheDocument();
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

  it('should render all lights', () => {
    render(<ZoneCard {...defaultProps} />);
    expect(screen.getByText('Light 1')).toBeInTheDocument();
    expect(screen.getByText('Light 2')).toBeInTheDocument();
    expect(screen.getByText('Light 3')).toBeInTheDocument();
    expect(screen.getByText('Light 4')).toBeInTheDocument();
    expect(screen.getByText('Light 5')).toBeInTheDocument();
  });

  it('should render scene selector with scenes', () => {
    render(<ZoneCard {...defaultProps} />);
    expect(screen.getByText('Morning')).toBeInTheDocument();
    expect(screen.getByText('Evening')).toBeInTheDocument();
  });

  it('should show "All Off" button when some lights are on', () => {
    render(<ZoneCard {...defaultProps} />);
    expect(screen.getByText('🌙 All Off')).toBeInTheDocument();
  });

  it('should show "All On" button when no lights are on', () => {
    const zoneAllOff = {
      ...mockZone,
      stats: { lightsOnCount: 0, totalLights: 5, averageBrightness: 0 },
      lights: mockZone.lights.map(l => ({ ...l, on: false, brightness: 0 }))
    };
    render(<ZoneCard {...defaultProps} zone={zoneAllOff} />);
    expect(screen.getByText('💡 All On')).toBeInTheDocument();
  });

  it('should call onToggleZone with zone ID and light UUIDs when All On clicked', async () => {
    const user = userEvent.setup();
    const onToggleZone = vi.fn();
    const zoneAllOff = {
      ...mockZone,
      stats: { lightsOnCount: 0, totalLights: 5, averageBrightness: 0 },
      lights: mockZone.lights.map(l => ({ ...l, on: false, brightness: 0 }))
    };
    render(<ZoneCard {...defaultProps} zone={zoneAllOff} onToggleZone={onToggleZone} />);

    const allButton = screen.getByText('💡 All On');
    await user.click(allButton);

    expect(onToggleZone).toHaveBeenCalledWith(
      'zone-1',
      ['light-1', 'light-2', 'light-3', 'light-4', 'light-5'],
      true
    );
  });

  it('should call onToggleZone with false when All Off clicked', async () => {
    const user = userEvent.setup();
    const onToggleZone = vi.fn();
    render(<ZoneCard {...defaultProps} onToggleZone={onToggleZone} />);

    const allButton = screen.getByText('🌙 All Off');
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

    const loadingEmojis = screen.getAllByText('⏳');
    expect(loadingEmojis.length).toBeGreaterThan(0);
  });

  it('should call onToggleLight when light is clicked', async () => {
    const user = userEvent.setup();
    const onToggleLight = vi.fn();
    render(<ZoneCard {...defaultProps} onToggleLight={onToggleLight} />);

    const lightButtons = screen.getAllByRole('button');
    const firstLightButton = lightButtons.find(btn =>
      btn.querySelector('.bulb-icon')
    );

    if (firstLightButton) {
      await user.click(firstLightButton);
      expect(onToggleLight).toHaveBeenCalled();
    }
  });

  it('should call onActivateScene when scene is selected', async () => {
    const user = userEvent.setup();
    const onActivateScene = vi.fn();
    render(<ZoneCard {...defaultProps} onActivateScene={onActivateScene} />);

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'scene-1');

    expect(onActivateScene).toHaveBeenCalledWith('scene-1');
  });

  it('should have correct structure', () => {
    const { container } = render(<ZoneCard {...defaultProps} />);

    expect(container.querySelector('.zone-group')).toBeInTheDocument();
    expect(container.querySelector('.zone-header')).toBeInTheDocument();
    expect(container.querySelector('.zone-title-row')).toBeInTheDocument();
    expect(container.querySelector('.zone-badges')).toBeInTheDocument();
    expect(container.querySelector('.zone-controls')).toBeInTheDocument();
    expect(container.querySelector('.zone-lights-grid')).toBeInTheDocument();
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

    expect(screen.getByText('4 of 6 on')).toBeInTheDocument();
    expect(screen.getByText('93%')).toBeInTheDocument();
  });
});
