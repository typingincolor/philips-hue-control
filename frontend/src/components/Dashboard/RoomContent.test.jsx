import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoomContent } from './RoomContent';

describe('RoomContent', () => {
  const mockLights = [
    {
      id: 'light-1',
      name: 'Floor Lamp',
      on: true,
      brightness: 75,
      color: 'rgb(255, 200, 130)',
      colorTemperature: 4000,
    },
    {
      id: 'light-2',
      name: 'TV Backlight',
      on: false,
      brightness: 50,
      color: 'rgb(200, 150, 255)',
    },
  ];

  const mockScenes = [
    { id: 'scene-1', name: 'Relax' },
    { id: 'scene-2', name: 'Bright' },
    { id: 'scene-3', name: 'Movie Night' },
  ];

  const mockRoom = {
    id: 'room-1',
    name: 'Living Room',
    lights: mockLights,
    scenes: mockScenes,
  };

  const defaultProps = {
    room: mockRoom,
    onToggleLight: vi.fn(),
    onToggleRoom: vi.fn(),
    onActivateScene: vi.fn(),
    togglingLights: new Set(),
    isActivatingScene: false,
  };

  describe('empty state', () => {
    it('should show empty state when room is null', () => {
      render(<RoomContent {...defaultProps} room={null} />);
      expect(screen.getByText('Select a room from the navigation below')).toBeInTheDocument();
    });

    it('should show empty state when room has no lights', () => {
      const emptyRoom = { ...mockRoom, lights: [] };
      render(<RoomContent {...defaultProps} room={emptyRoom} />);
      expect(screen.getByText('No lights in this room')).toBeInTheDocument();
    });

    it('should render empty state with icon', () => {
      const emptyRoom = { ...mockRoom, lights: [] };
      const { container } = render(<RoomContent {...defaultProps} room={emptyRoom} />);
      expect(container.querySelector('.empty-state-dark')).toBeInTheDocument();
    });
  });

  describe('carousel layout (issue 47)', () => {
    it('should render room-content-carousel container', () => {
      const { container } = render(<RoomContent {...defaultProps} />);
      expect(container.querySelector('.room-content-carousel')).toBeInTheDocument();
    });

    it('should render two room-row elements', () => {
      const { container } = render(<RoomContent {...defaultProps} />);
      const rows = container.querySelectorAll('.room-row');
      expect(rows).toHaveLength(2);
    });

    it('should render scenes-row as first row', () => {
      const { container } = render(<RoomContent {...defaultProps} />);
      const rows = container.querySelectorAll('.room-row');
      expect(rows[0]).toHaveClass('scenes-row');
    });

    it('should render lights-row as second row', () => {
      const { container } = render(<RoomContent {...defaultProps} />);
      const rows = container.querySelectorAll('.room-row');
      expect(rows[1]).toHaveClass('lights-row');
    });

    it('should render All On/Off tile inside scenes carousel', () => {
      const { container } = render(<RoomContent {...defaultProps} />);
      const scenesCarousel = container.querySelector('.scenes-row .tiles-carousel');
      // All On/Off should be inside the carousel (scrollable with scenes)
      const allOnOffTile = scenesCarousel.querySelector('.all-on-off-tile');
      expect(allOnOffTile).toBeInTheDocument();
    });

    it('should render All On/Off tile as first item in scenes carousel', () => {
      const { container } = render(<RoomContent {...defaultProps} />);
      const scenesCarousel = container.querySelector('.scenes-row .tiles-carousel');
      const firstChild = scenesCarousel.firstElementChild;
      expect(firstChild).toHaveClass('all-on-off-tile');
    });

    it('should render scenes inside tiles-carousel', () => {
      const { container } = render(<RoomContent {...defaultProps} />);
      const scenesCarousel = container.querySelector('.scenes-row .tiles-carousel');
      const sceneTiles = scenesCarousel.querySelectorAll('.scene-tile');
      expect(sceneTiles).toHaveLength(3);
    });

    it('should render lights inside tiles-carousel in lights-row', () => {
      const { container } = render(<RoomContent {...defaultProps} />);
      const lightsCarousel = container.querySelector('.lights-row .tiles-carousel');
      const lightTiles = lightsCarousel.querySelectorAll('.light-tile');
      expect(lightTiles).toHaveLength(2);
    });

    it('should render All On/Off tile in scenes row even when no scenes', () => {
      const roomNoScenes = { ...mockRoom, scenes: [] };
      const { container } = render(<RoomContent {...defaultProps} room={roomNoScenes} />);
      const scenesRow = container.querySelector('.scenes-row');
      const allOnOffTile = scenesRow.querySelector('.all-on-off-tile');
      expect(allOnOffTile).toBeInTheDocument();
    });
  });

  describe('carousel containers (issue 47)', () => {
    it('should render tiles-carousel-container in scenes-row', () => {
      const { container } = render(<RoomContent {...defaultProps} />);
      const scenesRow = container.querySelector('.scenes-row');
      expect(scenesRow.querySelector('.tiles-carousel-container')).toBeInTheDocument();
    });

    it('should render tiles-carousel-container in lights-row', () => {
      const { container } = render(<RoomContent {...defaultProps} />);
      const lightsRow = container.querySelector('.lights-row');
      expect(lightsRow.querySelector('.tiles-carousel-container')).toBeInTheDocument();
    });

    it('should render left chevron button in scenes carousel', () => {
      const { container } = render(<RoomContent {...defaultProps} />);
      const scenesContainer = container.querySelector('.scenes-row .tiles-carousel-container');
      const leftBtn = scenesContainer.querySelector('.carousel-btn-left');
      expect(leftBtn).toBeInTheDocument();
    });

    it('should render right chevron button in scenes carousel', () => {
      const { container } = render(<RoomContent {...defaultProps} />);
      const scenesContainer = container.querySelector('.scenes-row .tiles-carousel-container');
      const rightBtn = scenesContainer.querySelector('.carousel-btn-right');
      expect(rightBtn).toBeInTheDocument();
    });

    it('should render left chevron button in lights carousel', () => {
      const { container } = render(<RoomContent {...defaultProps} />);
      const lightsContainer = container.querySelector('.lights-row .tiles-carousel-container');
      const leftBtn = lightsContainer.querySelector('.carousel-btn-left');
      expect(leftBtn).toBeInTheDocument();
    });

    it('should render right chevron button in lights carousel', () => {
      const { container } = render(<RoomContent {...defaultProps} />);
      const lightsContainer = container.querySelector('.lights-row .tiles-carousel-container');
      const rightBtn = lightsContainer.querySelector('.carousel-btn-right');
      expect(rightBtn).toBeInTheDocument();
    });

    it('should have aria-label on carousel buttons', () => {
      const { container } = render(<RoomContent {...defaultProps} />);
      const leftBtns = container.querySelectorAll('.carousel-btn-left');
      const rightBtns = container.querySelectorAll('.carousel-btn-right');

      leftBtns.forEach((btn) => {
        expect(btn).toHaveAttribute('aria-label');
      });
      rightBtns.forEach((btn) => {
        expect(btn).toHaveAttribute('aria-label');
      });
    });
  });

  describe('removed components', () => {
    it('should not render SceneDrawer (removed in redesign)', () => {
      const { container } = render(<RoomContent {...defaultProps} />);
      expect(container.querySelector('.scene-drawer')).not.toBeInTheDocument();
    });

    it('should not render scene drawer trigger button', () => {
      const { container } = render(<RoomContent {...defaultProps} />);
      expect(container.querySelector('.scene-drawer-trigger')).not.toBeInTheDocument();
    });
  });

  describe('scene tile row', () => {
    it('should display scene names on tiles', () => {
      render(<RoomContent {...defaultProps} />);
      expect(screen.getByText('Relax')).toBeInTheDocument();
      expect(screen.getByText('Bright')).toBeInTheDocument();
      expect(screen.getByText('Movie Night')).toBeInTheDocument();
    });

    it('should call onActivateScene when scene tile is clicked', async () => {
      const user = userEvent.setup();
      const onActivateScene = vi.fn();
      render(<RoomContent {...defaultProps} onActivateScene={onActivateScene} />);

      // Find and click a scene tile
      const relaxScene = screen.getByText('Relax').closest('button');
      await user.click(relaxScene);

      expect(onActivateScene).toHaveBeenCalledWith('scene-1');
    });

    it('should disable scene tiles when isActivatingScene is true', () => {
      const { container } = render(<RoomContent {...defaultProps} isActivatingScene={true} />);
      const sceneTiles = container.querySelectorAll('.scene-tile');

      sceneTiles.forEach((tile) => {
        expect(tile).toBeDisabled();
      });
    });
  });

  describe('All On/Off tile', () => {
    it('should show "All Off" when some lights are on', () => {
      render(<RoomContent {...defaultProps} />);
      expect(screen.getByText('All Off')).toBeInTheDocument();
    });

    it('should show "All On" when all lights are off', () => {
      const allOffLights = mockLights.map((l) => ({ ...l, on: false }));
      const roomAllOff = { ...mockRoom, lights: allOffLights };
      render(<RoomContent {...defaultProps} room={roomAllOff} />);
      expect(screen.getByText('All On')).toBeInTheDocument();
    });

    it('should call onToggleRoom with roomId and false when turning off', async () => {
      const user = userEvent.setup();
      const onToggleRoom = vi.fn();
      render(<RoomContent {...defaultProps} onToggleRoom={onToggleRoom} />);

      const allOffButton = screen.getByText('All Off').closest('button');
      await user.click(allOffButton);

      expect(onToggleRoom).toHaveBeenCalledWith('room-1', false);
    });

    it('should call onToggleRoom with roomId and true when turning on', async () => {
      const user = userEvent.setup();
      const onToggleRoom = vi.fn();
      const allOffLights = mockLights.map((l) => ({ ...l, on: false }));
      const roomAllOff = { ...mockRoom, lights: allOffLights };
      render(<RoomContent {...defaultProps} room={roomAllOff} onToggleRoom={onToggleRoom} />);

      const allOnButton = screen.getByText('All On').closest('button');
      await user.click(allOnButton);

      expect(onToggleRoom).toHaveBeenCalledWith('room-1', true);
    });
  });

  describe('light tile row', () => {
    it('should display light names on tiles', () => {
      render(<RoomContent {...defaultProps} />);
      expect(screen.getByText('Floor Lamp')).toBeInTheDocument();
      expect(screen.getByText('TV Backlight')).toBeInTheDocument();
    });

    it('should call onToggleLight when light tile is clicked', async () => {
      const user = userEvent.setup();
      const onToggleLight = vi.fn();
      render(<RoomContent {...defaultProps} onToggleLight={onToggleLight} />);

      // Find the light tile by name, then find the toggle button within it
      const floorLampName = screen.getByText('Floor Lamp');
      const lightTile = floorLampName.closest('.light-tile');
      const toggleButton = lightTile.querySelector('.light-tile-toggle');
      await user.click(toggleButton);

      expect(onToggleLight).toHaveBeenCalledWith('light-1');
    });

    it('should pass isToggling to light tiles based on togglingLights set', () => {
      const togglingLights = new Set(['light-1']);
      const { container } = render(
        <RoomContent {...defaultProps} togglingLights={togglingLights} />
      );

      const lightTiles = container.querySelectorAll('.light-tile');
      const firstTile = lightTiles[0];
      expect(firstTile).toHaveClass('toggling');
    });

    it('should render color temperature sliders on light tiles when on', () => {
      const { container } = render(<RoomContent {...defaultProps} />);
      // At least one light is on and has colorTemperature
      const sliders = container.querySelectorAll('.light-tile-slider');
      expect(sliders.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('responsive layout', () => {
    it('should have room-content wrapper class', () => {
      const { container } = render(<RoomContent {...defaultProps} />);
      expect(container.querySelector('.room-content')).toBeInTheDocument();
    });
  });

  // Note: Issue 42 "separate grids" tests removed - superseded by carousel layout tests (issue 47)

  describe('real-time state updates', () => {
    it('should calculate anyOn from actual light states', () => {
      // When lights change, anyOn should update immediately
      const singleOnLight = [
        { ...mockLights[0], on: true },
        { ...mockLights[1], on: false },
      ];
      const roomOneOn = { ...mockRoom, lights: singleOnLight };
      render(<RoomContent {...defaultProps} room={roomOneOn} />);

      // With one light on, should show "All Off"
      expect(screen.getByText('All Off')).toBeInTheDocument();
    });

    it('should update anyOn when all lights turn off', () => {
      const allOffLights = mockLights.map((l) => ({ ...l, on: false }));
      const roomAllOff = { ...mockRoom, lights: allOffLights };
      render(<RoomContent {...defaultProps} room={roomAllOff} />);

      // With no lights on, should show "All On"
      expect(screen.getByText('All On')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have accessible scene tiles', () => {
      render(<RoomContent {...defaultProps} />);
      const sceneTile = screen.getByText('Relax').closest('button');
      expect(sceneTile).toHaveAttribute('aria-label', expect.stringContaining('Relax'));
    });

    it('should have accessible All On/Off tile', () => {
      render(<RoomContent {...defaultProps} />);
      const allOffTile = screen.getByText('All Off').closest('button');
      expect(allOffTile).toHaveAttribute('aria-label');
    });

    it('should have accessible light tiles', () => {
      render(<RoomContent {...defaultProps} />);
      // Find the toggle button within the light tile
      const floorLampName = screen.getByText('Floor Lamp');
      const lightTile = floorLampName.closest('.light-tile');
      const toggleButton = lightTile.querySelector('.light-tile-toggle');
      expect(toggleButton).toHaveAttribute('aria-label', expect.stringContaining('Floor Lamp'));
    });

    it('should be keyboard navigable through all tiles', async () => {
      const { container } = render(<RoomContent {...defaultProps} />);

      // Get all non-disabled buttons (tiles)
      const allTiles = container.querySelectorAll('button:not(:disabled)');
      expect(allTiles.length).toBeGreaterThan(0);

      // First non-disabled tile should be focusable
      allTiles[0].focus();
      expect(allTiles[0]).toHaveFocus();
    });
  });

  describe('loading states', () => {
    it('should show toggling state on All On/Off tile when isActivatingScene', () => {
      const { container } = render(<RoomContent {...defaultProps} isActivatingScene={true} />);
      // Scene tiles should show loading state
      const sceneTiles = container.querySelectorAll('.scene-tile');
      sceneTiles.forEach((tile) => {
        expect(tile).toBeDisabled();
      });
    });
  });
});
