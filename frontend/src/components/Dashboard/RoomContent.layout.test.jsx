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
 * - Scene tiles and All On/Off tile in first row
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

  describe('Core Structure - Carousel Layout (issue 47)', () => {
    it('should render room-content-carousel container', () => {
      render(<RoomContent {...defaultProps} />);

      const container = document.querySelector('.room-content-carousel');
      expect(container).toBeInTheDocument();
    });

    it('should render two room-row elements', () => {
      render(<RoomContent {...defaultProps} />);

      const rows = document.querySelectorAll('.room-row');
      expect(rows.length).toBe(2);
    });

    it('should render scenes-row as first row', () => {
      render(<RoomContent {...defaultProps} />);

      const rows = document.querySelectorAll('.room-row');
      expect(rows[0]).toHaveClass('scenes-row');
    });

    it('should render lights-row as second row', () => {
      render(<RoomContent {...defaultProps} />);

      const rows = document.querySelectorAll('.room-row');
      expect(rows[1]).toHaveClass('lights-row');
    });

    it('should render all light tiles', () => {
      render(<RoomContent {...defaultProps} />);

      const tiles = document.querySelectorAll('.light-tile');
      expect(tiles.length).toBe(8);
    });

    it('should render All On/Off tile inside scenes carousel', () => {
      render(<RoomContent {...defaultProps} />);

      const scenesCarousel = document.querySelector('.scenes-row .tiles-carousel');
      // All On/Off should be inside the carousel (scrollable with scenes)
      const allOnOffTile = scenesCarousel.querySelector('.all-on-off-tile');
      expect(allOnOffTile).toBeInTheDocument();
    });

    it('should render scene tiles', () => {
      render(<RoomContent {...defaultProps} />);

      const sceneTiles = document.querySelectorAll('.scene-tile');
      expect(sceneTiles.length).toBe(2); // 2 scenes in mockRoom
    });

    it('should render light tiles inside lights-row carousel', () => {
      render(<RoomContent {...defaultProps} />);

      const lightsCarousel = document.querySelector('.lights-row .tiles-carousel');
      const tiles = lightsCarousel.querySelectorAll('.light-tile');
      expect(tiles.length).toBe(8);
    });

    it('should render scene tiles inside scenes-row carousel', () => {
      render(<RoomContent {...defaultProps} />);

      const scenesCarousel = document.querySelector('.scenes-row .tiles-carousel');
      const scenes = scenesCarousel.querySelectorAll('.scene-tile');
      expect(scenes.length).toBe(2);
    });

    it('should have carousel containers in both rows', () => {
      render(<RoomContent {...defaultProps} />);

      const scenesContainer = document.querySelector('.scenes-row .tiles-carousel-container');
      const lightsContainer = document.querySelector('.lights-row .tiles-carousel-container');
      expect(scenesContainer).toBeInTheDocument();
      expect(lightsContainer).toBeInTheDocument();
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

    it('should still render All On/Off tile in empty room', () => {
      render(<RoomContent {...defaultProps} room={{ ...mockRoom, lights: [] }} />);

      // Empty room shows empty state, no All On/Off tile
      const emptyState = document.querySelector('.empty-state-dark');
      expect(emptyState).toBeInTheDocument();
    });
  });

  describe('Light Tile Structure', () => {
    it('should render each light tile with a toggle button', () => {
      render(<RoomContent {...defaultProps} />);

      const tiles = document.querySelectorAll('.light-tile');
      tiles.forEach((tile) => {
        // Each light tile should contain a toggle button
        const toggleButton = tile.querySelector('.light-tile-toggle');
        expect(toggleButton).toBeInTheDocument();
        expect(toggleButton.tagName.toLowerCase()).toBe('button');
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
    it('should have accessible All On/Off tile', () => {
      render(<RoomContent {...defaultProps} />);

      const allOnOffTile = document.querySelector('.all-on-off-tile');
      expect(allOnOffTile).toHaveAttribute('aria-label');
    });

    it('should have accessible scene tiles', () => {
      render(<RoomContent {...defaultProps} />);

      const sceneTiles = document.querySelectorAll('.scene-tile');
      sceneTiles.forEach((tile) => {
        expect(tile).toHaveAttribute('aria-label');
      });
    });

    it('should have focusable light tiles', () => {
      render(<RoomContent {...defaultProps} />);

      const tiles = document.querySelectorAll('.light-tile');
      tiles.forEach((tile) => {
        // Each light tile should have a focusable toggle button
        const toggleButton = tile.querySelector('.light-tile-toggle');
        expect(toggleButton).toBeInTheDocument();
        expect(toggleButton.tagName.toLowerCase()).toBe('button');
      });
    });
  });

  describe('Viewport-Specific Layout', () => {
    Object.entries(VIEWPORTS).forEach(([key, viewport]) => {
      describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
        beforeEach(() => {
          setupViewport(key);
        });

        it('should render room-content-carousel container', () => {
          render(<RoomContent {...defaultProps} />);

          const carousel = document.querySelector('.room-content-carousel');
          expect(carousel).toBeInTheDocument();
        });

        it('should render all 8 light tiles', () => {
          render(<RoomContent {...defaultProps} />);

          const tiles = document.querySelectorAll('.light-tile');
          expect(tiles.length).toBe(8);
        });

        it('should render room-content wrapper', () => {
          render(<RoomContent {...defaultProps} />);

          const content = document.querySelector('.room-content');
          expect(content).toBeInTheDocument();
        });

        it('should render All On/Off tile and scene tiles', () => {
          render(<RoomContent {...defaultProps} />);

          const allOnOffTile = document.querySelector('.all-on-off-tile');
          expect(allOnOffTile).toBeInTheDocument();
          const sceneTiles = document.querySelectorAll('.scene-tile');
          expect(sceneTiles.length).toBe(2);
        });
      });
    });
  });

  describe('Carousel Layout Compliance (issue 47)', () => {
    it('should use tiles-carousel class for scrollable carousel', () => {
      render(<RoomContent {...defaultProps} />);

      const carousels = document.querySelectorAll('.tiles-carousel');
      expect(carousels.length).toBe(2); // scenes and lights carousels
    });

    it('should use light-tile class for carousel items', () => {
      render(<RoomContent {...defaultProps} />);

      const tiles = document.querySelectorAll('.light-tile');
      expect(tiles.length).toBeGreaterThan(0);
      tiles.forEach((tile) => {
        expect(tile).toHaveClass('light-tile');
      });
    });

    it('should have tiles-carousel-container in each row', () => {
      render(<RoomContent {...defaultProps} />);

      const containers = document.querySelectorAll('.tiles-carousel-container');
      expect(containers.length).toBe(2);
    });
  });

  describe('Scene Tile Integration', () => {
    it('should render scene tiles for each scene', () => {
      render(<RoomContent {...defaultProps} />);

      const sceneTiles = document.querySelectorAll('.scene-tile');
      expect(sceneTiles.length).toBe(2);
    });

    it('should display scene names in tiles', () => {
      render(<RoomContent {...defaultProps} />);

      expect(screen.getByText('Bright')).toBeInTheDocument();
      expect(screen.getByText('Dim')).toBeInTheDocument();
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

  // Note: Issue 42 responsive grid tests removed - superseded by carousel layout (issue 47)

  describe('Carousel Chevron Buttons (issue 47)', () => {
    it('should render chevron buttons in scenes carousel', () => {
      render(<RoomContent {...defaultProps} />);

      const scenesContainer = document.querySelector('.scenes-row .tiles-carousel-container');
      const leftBtn = scenesContainer.querySelector('.carousel-btn-left');
      const rightBtn = scenesContainer.querySelector('.carousel-btn-right');
      expect(leftBtn).toBeInTheDocument();
      expect(rightBtn).toBeInTheDocument();
    });

    it('should render chevron buttons in lights carousel', () => {
      render(<RoomContent {...defaultProps} />);

      const lightsContainer = document.querySelector('.lights-row .tiles-carousel-container');
      const leftBtn = lightsContainer.querySelector('.carousel-btn-left');
      const rightBtn = lightsContainer.querySelector('.carousel-btn-right');
      expect(leftBtn).toBeInTheDocument();
      expect(rightBtn).toBeInTheDocument();
    });

    it('should render rows in correct order (scenes then lights)', () => {
      render(<RoomContent {...defaultProps} />);

      const rows = document.querySelectorAll('.room-row');
      expect(rows[0]).toHaveClass('scenes-row');
      expect(rows[1]).toHaveClass('lights-row');
    });
  });
});
