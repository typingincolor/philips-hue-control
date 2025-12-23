import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoomCard } from './RoomCard';

describe('RoomCard', () => {
  const mockRoom = {
    id: 'room-1',
    name: 'Living Room',
    stats: {
      lightsOnCount: 2,
      totalLights: 4,
      averageBrightness: 75.5
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
        brightness: 71,
        color: 'rgb(255, 180, 120)',
        shadow: '0 0 18px rgba(255, 180, 120, 0.38)',
        colorSource: 'temperature'
      },
      {
        id: 'light-3',
        name: 'Light 3',
        on: false,
        brightness: 0,
        color: null,
        shadow: null,
        colorSource: null
      },
      {
        id: 'light-4',
        name: 'Light 4',
        on: false,
        brightness: 0,
        color: null,
        shadow: null,
        colorSource: null
      }
    ],
    scenes: [
      { id: 'scene-1', name: 'Bright' },
      { id: 'scene-2', name: 'Relax' }
    ]
  };

  const defaultProps = {
    roomName: 'Living Room',
    room: mockRoom,
    onToggleLight: vi.fn(),
    onToggleRoom: vi.fn(),
    onActivateScene: vi.fn(),
    togglingLights: new Set(),
    isActivating: false
  };

  it('should render room name', () => {
    render(<RoomCard {...defaultProps} />);
    expect(screen.getByText('Living Room')).toBeInTheDocument();
  });

  it('should display pre-computed room stats from backend', () => {
    render(<RoomCard {...defaultProps} />);
    expect(screen.getByText('2 of 4 on')).toBeInTheDocument();
    expect(screen.getByText('76%')).toBeInTheDocument();
  });

  it('should show placeholder when no lights are on', () => {
    const roomAllOff = {
      ...mockRoom,
      stats: { lightsOnCount: 0, totalLights: 4, averageBrightness: 0 }
    };
    render(<RoomCard {...defaultProps} room={roomAllOff} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('should render all lights', () => {
    render(<RoomCard {...defaultProps} />);
    expect(screen.getByText('Light 1')).toBeInTheDocument();
    expect(screen.getByText('Light 2')).toBeInTheDocument();
    expect(screen.getByText('Light 3')).toBeInTheDocument();
    expect(screen.getByText('Light 4')).toBeInTheDocument();
  });

  it('should render scene selector with scenes', () => {
    render(<RoomCard {...defaultProps} />);
    expect(screen.getByText('Bright')).toBeInTheDocument();
    expect(screen.getByText('Relax')).toBeInTheDocument();
  });

  it('should show "All Off" button when some lights are on', () => {
    render(<RoomCard {...defaultProps} />);
    // Since 2 lights are on, should show "All Off"
    expect(screen.getByText('🌙 All Off')).toBeInTheDocument();
  });

  it('should show "All Off" button when all lights are on', () => {
    const roomAllOn = {
      ...mockRoom,
      stats: { lightsOnCount: 4, totalLights: 4, averageBrightness: 75 },
      lights: mockRoom.lights.map(l => ({ ...l, on: true, brightness: 75 }))
    };
    render(<RoomCard {...defaultProps} room={roomAllOn} />);
    expect(screen.getByText('🌙 All Off')).toBeInTheDocument();
  });

  it('should call onToggleRoom with room ID and light UUIDs when All On clicked', async () => {
    const user = userEvent.setup();
    const onToggleRoom = vi.fn();
    const roomAllOff = {
      ...mockRoom,
      stats: { lightsOnCount: 0, totalLights: 4, averageBrightness: 0 },
      lights: mockRoom.lights.map(l => ({ ...l, on: false, brightness: 0 }))
    };
    render(<RoomCard {...defaultProps} room={roomAllOff} onToggleRoom={onToggleRoom} />);

    const allButton = screen.getByText('💡 All On');
    await user.click(allButton);

    expect(onToggleRoom).toHaveBeenCalledWith(
      'room-1',
      ['light-1', 'light-2', 'light-3', 'light-4'],
      true
    );
  });

  it('should call onToggleRoom with false when All Off clicked', async () => {
    const user = userEvent.setup();
    const onToggleRoom = vi.fn();
    const roomAllOn = {
      ...mockRoom,
      stats: { lightsOnCount: 4, totalLights: 4, averageBrightness: 75 },
      lights: mockRoom.lights.map(l => ({ ...l, on: true, brightness: 75 }))
    };
    render(<RoomCard {...defaultProps} room={roomAllOn} onToggleRoom={onToggleRoom} />);

    const allButton = screen.getByText('🌙 All Off');
    await user.click(allButton);

    expect(onToggleRoom).toHaveBeenCalledWith(
      'room-1',
      ['light-1', 'light-2', 'light-3', 'light-4'],
      false
    );
  });

  it('should disable All button when all lights are toggling', () => {
    const togglingLights = new Set(['light-1', 'light-2', 'light-3', 'light-4']);
    const { container } = render(<RoomCard {...defaultProps} togglingLights={togglingLights} />);

    const allButton = container.querySelector('.room-control-button');
    expect(allButton).toBeDisabled();
  });

  it('should show loading emoji when all lights toggling', () => {
    const togglingLights = new Set(['light-1', 'light-2', 'light-3', 'light-4']);
    render(<RoomCard {...defaultProps} togglingLights={togglingLights} />);

    const loadingEmojis = screen.getAllByText('⏳');
    expect(loadingEmojis.length).toBeGreaterThan(0);
  });

  it('should call onToggleLight when light is clicked', async () => {
    const user = userEvent.setup();
    const onToggleLight = vi.fn();
    render(<RoomCard {...defaultProps} onToggleLight={onToggleLight} />);

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
    render(<RoomCard {...defaultProps} onActivateScene={onActivateScene} />);

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'scene-1');

    expect(onActivateScene).toHaveBeenCalledWith('scene-1');
  });

  it('should have correct structure', () => {
    const { container } = render(<RoomCard {...defaultProps} />);

    expect(container.querySelector('.room-group')).toBeInTheDocument();
    expect(container.querySelector('.room-header')).toBeInTheDocument();
    expect(container.querySelector('.room-title-row')).toBeInTheDocument();
    expect(container.querySelector('.room-badges')).toBeInTheDocument();
    expect(container.querySelector('.room-controls')).toBeInTheDocument();
    expect(container.querySelector('.room-lights-grid')).toBeInTheDocument();
  });

  it('should handle room with no scenes', () => {
    const roomNoScenes = { ...mockRoom, scenes: [] };
    const { container } = render(<RoomCard {...defaultProps} room={roomNoScenes} />);

    // SceneSelector returns null when no scenes
    expect(container.querySelector('.scene-selector')).not.toBeInTheDocument();
  });

  it('should use pre-computed stats for display', () => {
    const room = {
      ...mockRoom,
      stats: {
        lightsOnCount: 3,
        totalLights: 5,
        averageBrightness: 82.3
      }
    };
    render(<RoomCard {...defaultProps} room={room} />);

    expect(screen.getByText('3 of 5 on')).toBeInTheDocument();
    expect(screen.getByText('82%')).toBeInTheDocument();
  });
});
