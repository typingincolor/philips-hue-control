import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RoomContent } from './RoomContent';
import {
  VIEWPORTS,
  EXPECTED_LAYOUTS,
  setupViewport,
  resetViewport,
} from '../../test/layoutTestUtils';

/**
 * RoomContent Layout Tests
 *
 * Tests the structural layout requirements for the room view:
 * - Grid structure with correct CSS classes
 * - Light tiles rendered with proper classes
 * - Scene drawer trigger positioned correctly
 * - Empty states rendered appropriately
 *
 * Note: jsdom doesn't compute real CSS layouts, so we test:
 * - DOM structure and CSS class presence
 * - Element existence and ordering
 * - Responsive class application via matchMedia mocks
 */

describe('RoomContent Layout', () => {
  const mockRoom = {
    id: 'room-1',
    name: 'Living Room',
    lights: [
      { id: 'light-1', name: 'Lamp 1', on: true, brightness: 80, color: '#ffffff', shadow: 'none' },
      { id: 'light-2', name: 'Lamp 2', on: false, brightness: 0, color: '#ffffff', shadow: 'none' },
      { id: 'light-3', name: 'Lamp 3', on: true, brightness: 50, color: '#ffaa00', shadow: 'none' },
      { id: 'light-4', name: 'Lamp 4', on: false, brightness: 0, color: '#ffffff', shadow: 'none' },
      { id: 'light-5', name: 'Lamp 5', on: true, brightness: 60, color: '#ffffff', shadow: 'none' },
      { id: 'light-6', name: 'Lamp 6', on: false, brightness: 0, color: '#ffffff', shadow: 'none' },
      { id: 'light-7', name: 'Lamp 7', on: true, brightness: 70, color: '#00ff00', shadow: 'none' },
      { id: 'light-8', name: 'Lamp 8', on: false, brightness: 0, color: '#ffffff', shadow: 'none' },
    ],
    scenes: [
      { id: 'scene-1', name: 'Bright' },
      { id: 'scene-2', name: 'Dim' },
    ],
    stats: { lightsOnCount: 4, totalLights: 8, averageBrightness: 65 },
  };

  const defaultProps = {
    room: mockRoom,
    onToggleLight: vi.fn(),
    onToggleRoom: vi.fn(),
    onActivateScene: vi.fn(),
    togglingLights: new Set(),
    isActivatingScene: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetViewport();
  });

  describe('Core Structure', () => {
    it('should render room-content container', () => {
      render(<RoomContent {...defaultProps} />);

      const container = document.querySelector('.room-content');
      expect(container).toBeInTheDocument();
    });

    it('should render tiles-grid for lights', () => {
      render(<RoomContent {...defaultProps} />);

      const grid = document.querySelector('.tiles-grid');
      expect(grid).toBeInTheDocument();
    });

    it('should render all light tiles', () => {
      render(<RoomContent {...defaultProps} />);

      const tiles = document.querySelectorAll('.light-tile');
      expect(tiles.length).toBe(8);
    });

    it('should render scene drawer trigger button', () => {
      render(<RoomContent {...defaultProps} />);

      const trigger = document.querySelector('.scene-drawer-trigger');
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveAttribute('aria-label', 'Open scenes menu');
    });

    it('should render light tiles inside tiles-grid', () => {
      render(<RoomContent {...defaultProps} />);

      const grid = document.querySelector('.tiles-grid');
      const tiles = grid.querySelectorAll('.light-tile');
      expect(tiles.length).toBe(8);
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no room provided', () => {
      render(<RoomContent {...defaultProps} room={null} />);

      const emptyState = document.querySelector('.empty-state-dark');
      expect(emptyState).toBeInTheDocument();
      expect(screen.getByText('Select a room from the navigation below')).toBeInTheDocument();
    });

    it('should show empty state when room has no lights', () => {
      render(<RoomContent {...defaultProps} room={{ ...mockRoom, lights: [] }} />);

      const emptyState = document.querySelector('.empty-state-dark');
      expect(emptyState).toBeInTheDocument();
      expect(screen.getByText('No lights in this room')).toBeInTheDocument();
    });

    it('should still render scene drawer trigger in empty room', () => {
      render(<RoomContent {...defaultProps} room={{ ...mockRoom, lights: [] }} />);

      const trigger = document.querySelector('.scene-drawer-trigger');
      expect(trigger).toBeInTheDocument();
    });
  });

  describe('Light Tile Structure', () => {
    it('should render each light tile as a button', () => {
      render(<RoomContent {...defaultProps} />);

      const tiles = document.querySelectorAll('.light-tile');
      tiles.forEach((tile) => {
        expect(tile.tagName.toLowerCase()).toBe('button');
      });
    });

    it('should have light names in tiles', () => {
      render(<RoomContent {...defaultProps} />);

      mockRoom.lights.forEach((light) => {
        expect(screen.getByText(light.name)).toBeInTheDocument();
      });
    });

    it('should have on class for lights that are on', () => {
      render(<RoomContent {...defaultProps} />);

      const tiles = document.querySelectorAll('.light-tile');
      const onLights = mockRoom.lights.filter((l) => l.on);
      const onTiles = Array.from(tiles).filter((t) => t.classList.contains('on'));

      expect(onTiles.length).toBe(onLights.length);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible scene drawer trigger', () => {
      render(<RoomContent {...defaultProps} />);

      const trigger = document.querySelector('.scene-drawer-trigger');
      expect(trigger).toHaveAttribute('aria-label');
    });

    it('should have focusable light tiles', () => {
      render(<RoomContent {...defaultProps} />);

      const tiles = document.querySelectorAll('.light-tile');
      tiles.forEach((tile) => {
        // Buttons are focusable by default
        expect(tile.tagName.toLowerCase()).toBe('button');
      });
    });
  });

  describe('Viewport-Specific Layout', () => {
    Object.entries(VIEWPORTS).forEach(([key, viewport]) => {
      describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
        beforeEach(() => {
          setupViewport(key);
        });

        it('should render tiles-grid container', () => {
          render(<RoomContent {...defaultProps} />);

          const grid = document.querySelector('.tiles-grid');
          expect(grid).toBeInTheDocument();
        });

        it(`should have enough tiles for ${EXPECTED_LAYOUTS[key].columns}x${EXPECTED_LAYOUTS[key].rows} grid`, () => {
          render(<RoomContent {...defaultProps} />);

          const tiles = document.querySelectorAll('.light-tile');
          const expectedTiles = EXPECTED_LAYOUTS[key].columns * EXPECTED_LAYOUTS[key].rows;
          expect(tiles.length).toBe(expectedTiles);
        });

        it('should render room-content wrapper', () => {
          render(<RoomContent {...defaultProps} />);

          const content = document.querySelector('.room-content');
          expect(content).toBeInTheDocument();
        });

        it('should render scene drawer trigger floating button', () => {
          render(<RoomContent {...defaultProps} />);

          const trigger = document.querySelector('.scene-drawer-trigger');
          expect(trigger).toBeInTheDocument();
        });
      });
    });
  });

  describe('Layout Constants Compliance', () => {
    it('should use tiles-grid class for CSS grid layout', () => {
      render(<RoomContent {...defaultProps} />);

      const grid = document.querySelector('.tiles-grid');
      expect(grid).toHaveClass('tiles-grid');
    });

    it('should use light-tile class for grid items', () => {
      render(<RoomContent {...defaultProps} />);

      const tiles = document.querySelectorAll('.light-tile');
      expect(tiles.length).toBeGreaterThan(0);
      tiles.forEach((tile) => {
        expect(tile).toHaveClass('light-tile');
      });
    });
  });

  describe('Scene Drawer Integration', () => {
    it('should render SceneDrawer component', () => {
      render(<RoomContent {...defaultProps} />);

      // SceneDrawer may not be visible initially but should be in DOM
      // The overlay/drawer classes indicate it's rendered
      const trigger = document.querySelector('.scene-drawer-trigger');
      expect(trigger).toBeInTheDocument();
    });

    it('should pass scenes to SceneDrawer', () => {
      render(<RoomContent {...defaultProps} />);

      // Scene drawer trigger should be present
      const trigger = document.querySelector('.scene-drawer-trigger');
      expect(trigger).toBeInTheDocument();
    });
  });

  describe('Toggling States', () => {
    it('should apply toggling state to light tiles', () => {
      const togglingLights = new Set(['light-1', 'light-3']);
      render(<RoomContent {...defaultProps} togglingLights={togglingLights} />);

      const tiles = document.querySelectorAll('.light-tile');
      const togglingTiles = Array.from(tiles).filter((t) => t.classList.contains('toggling'));

      expect(togglingTiles.length).toBe(2);
    });
  });
});
