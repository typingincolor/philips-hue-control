import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dashboard } from './index';
import { VIEWPORTS, setupViewport, resetViewport } from '../../test/layoutTestUtils';

/**
 * Dashboard Layout Tests
 *
 * Migrated from E2E tests where possible. Tests:
 * - Core layout structure (dark-layout, top-toolbar, main-panel, bottom-nav)
 * - Component presence and ordering
 * - Scene drawer interaction
 * - Grid structure
 *
 * Note: Tests requiring real CSS layout computation remain in E2E tests.
 * These tests verify DOM structure and CSS class presence.
 */

let mockDashboardData;
let mockWebSocketState;
let mockHiveState;
let mockIsDemoMode = true;

// Create 8 lights for full grid
const createMockLights = (count) =>
  Array.from({ length: count }, (_, i) => ({
    id: `light-${i + 1}`,
    name: `Lamp ${i + 1}`,
    on: i % 2 === 0,
    brightness: i % 2 === 0 ? 80 : 0,
    color: '#ffffff',
    shadow: 'none',
  }));

const baseDashboard = {
  summary: {
    lightsOn: 4,
    totalLights: 8,
    roomCount: 2,
    sceneCount: 3,
  },
  rooms: [
    {
      id: 'room-1',
      name: 'Living Room',
      stats: { lightsOnCount: 4, totalLights: 8, averageBrightness: 75 },
      lights: createMockLights(8),
      scenes: [
        { id: 'scene-1', name: 'Bright' },
        { id: 'scene-2', name: 'Dim' },
        { id: 'scene-3', name: 'Movie' },
      ],
    },
  ],
  zones: [],
  motionZones: [],
};

// Mock the homeAdapter
vi.mock('../../services/homeAdapter', () => ({
  getDashboardFromHome: vi.fn().mockImplementation(() => Promise.resolve(mockDashboardData)),
  updateLight: vi.fn().mockResolvedValue({ light: {} }),
  updateRoomLights: vi.fn().mockResolvedValue({ updatedLights: [] }),
  updateZoneLights: vi.fn().mockResolvedValue({ updatedLights: [] }),
  activateSceneV1: vi.fn().mockResolvedValue({ affectedLights: [] }),
}));

// Mock the DemoModeContext
vi.mock('../../context/DemoModeContext', () => ({
  useDemoMode: () => ({
    isDemoMode: mockIsDemoMode,
  }),
}));

vi.mock('../../hooks/useWebSocket', () => ({
  useWebSocket: () => mockWebSocketState,
}));

vi.mock('../../hooks/useHive', () => ({
  useHive: () => mockHiveState,
}));

describe('Dashboard Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDashboardData = JSON.parse(JSON.stringify(baseDashboard));
    mockIsDemoMode = true;
    mockWebSocketState = {
      isConnected: false,
      dashboard: null,
      error: null,
    };
    mockHiveState = {
      isConnected: false,
      isConnecting: false,
      isLoading: false,
      status: null,
      schedules: [],
      error: null,
      requires2fa: false,
      twoFaSession: null,
      pendingUsername: null,
      isVerifying: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      refresh: vi.fn(),
      checkConnection: vi.fn(),
      submit2faCode: vi.fn(),
      cancel2fa: vi.fn(),
    };
  });

  afterEach(() => {
    document.body.classList.remove('dark-theme');
    resetViewport();
  });

  describe('Core Layout Structure', () => {
    it('should render dark-layout container', async () => {
      render(<Dashboard sessionToken="test-token" />);

      await waitFor(() => {
        const layout = document.querySelector('.dark-layout');
        expect(layout).toBeInTheDocument();
      });
    });

    it('should render top-toolbar', async () => {
      render(<Dashboard sessionToken="test-token" />);

      await waitFor(() => {
        const toolbar = document.querySelector('.top-toolbar');
        expect(toolbar).toBeInTheDocument();
      });
    });

    it('should render main-panel', async () => {
      render(<Dashboard sessionToken="test-token" />);

      await waitFor(() => {
        const mainPanel = document.querySelector('.main-panel');
        expect(mainPanel).toBeInTheDocument();
      });
    });

    it('should render bottom-nav', async () => {
      render(<Dashboard sessionToken="test-token" />);

      await waitFor(() => {
        const nav = document.querySelector('.bottom-nav');
        expect(nav).toBeInTheDocument();
      });
    });

    it('should have toolbar, main-panel, nav in correct DOM order', async () => {
      render(<Dashboard sessionToken="test-token" />);

      await waitFor(() => {
        const layout = document.querySelector('.dark-layout');
        const children = Array.from(layout.children);

        const toolbarIndex = children.findIndex((c) => c.classList.contains('top-toolbar'));
        const mainIndex = children.findIndex((c) => c.classList.contains('main-panel'));
        const navIndex = children.findIndex((c) => c.classList.contains('bottom-nav'));

        expect(toolbarIndex).toBeLessThan(mainIndex);
        expect(mainIndex).toBeLessThan(navIndex);
      });
    });
  });

  describe('Grid Structure (Migrated from E2E)', () => {
    it('should render tiles-grid for lights', async () => {
      render(<Dashboard sessionToken="test-token" />);

      await waitFor(() => {
        const grid = document.querySelector('.tiles-grid');
        expect(grid).toBeInTheDocument();
      });
    });

    it('should render 8 light tiles', async () => {
      render(<Dashboard sessionToken="test-token" />);

      await waitFor(() => {
        const tiles = document.querySelectorAll('.light-tile');
        expect(tiles.length).toBe(8);
      });
    });

    it('should render light tiles inside tiles-grid', async () => {
      render(<Dashboard sessionToken="test-token" />);

      await waitFor(() => {
        const grid = document.querySelector('.tiles-grid');
        const tiles = grid.querySelectorAll('.light-tile');
        expect(tiles.length).toBe(8);
      });
    });

    it('should render light tiles as buttons', async () => {
      render(<Dashboard sessionToken="test-token" />);

      await waitFor(() => {
        const tiles = document.querySelectorAll('.light-tile');
        tiles.forEach((tile) => {
          expect(tile.tagName.toLowerCase()).toBe('button');
        });
      });
    });
  });

  describe('Toolbar Structure (Migrated from E2E)', () => {
    it('should render toolbar-left section', async () => {
      render(<Dashboard sessionToken="test-token" />);

      await waitFor(() => {
        const toolbarLeft = document.querySelector('.toolbar-left');
        expect(toolbarLeft).toBeInTheDocument();
      });
    });

    it('should render toolbar-right section', async () => {
      render(<Dashboard sessionToken="test-token" />);

      await waitFor(() => {
        const toolbarRight = document.querySelector('.toolbar-right');
        expect(toolbarRight).toBeInTheDocument();
      });
    });

    it('should render settings button', async () => {
      render(<Dashboard sessionToken="test-token" />);

      await waitFor(() => {
        const settingsButton = document.querySelector('.toolbar-settings');
        expect(settingsButton).toBeInTheDocument();
      });
    });

    it('should have toolbar-settings in toolbar-left', async () => {
      render(<Dashboard sessionToken="test-token" />);

      await waitFor(() => {
        const toolbarLeft = document.querySelector('.toolbar-left');
        const settingsButton = toolbarLeft.querySelector('.toolbar-settings');
        expect(settingsButton).toBeInTheDocument();
      });
    });
  });

  describe('Scene Drawer (Migrated from E2E)', () => {
    it('should render scene drawer trigger', async () => {
      render(<Dashboard sessionToken="test-token" />);

      await waitFor(() => {
        const trigger = document.querySelector('.scene-drawer-trigger');
        expect(trigger).toBeInTheDocument();
      });
    });

    it('should open drawer when trigger is clicked', async () => {
      const user = userEvent.setup();
      render(<Dashboard sessionToken="test-token" />);

      await waitFor(() => {
        expect(document.querySelector('.scene-drawer-trigger')).toBeInTheDocument();
      });

      const trigger = document.querySelector('.scene-drawer-trigger');
      await user.click(trigger);

      await waitFor(() => {
        const drawer = document.querySelector('.scene-drawer');
        expect(drawer).toBeVisible();
      });
    });

    it('should render scene items in drawer', async () => {
      const user = userEvent.setup();
      render(<Dashboard sessionToken="test-token" />);

      await waitFor(() => {
        expect(document.querySelector('.scene-drawer-trigger')).toBeInTheDocument();
      });

      await user.click(document.querySelector('.scene-drawer-trigger'));

      await waitFor(() => {
        const sceneItems = document.querySelectorAll('.scene-drawer-item');
        expect(sceneItems.length).toBe(3); // Bright, Dim, Movie
      });
    });

    it('should render toggle button in drawer', async () => {
      const user = userEvent.setup();
      render(<Dashboard sessionToken="test-token" />);

      await waitFor(() => {
        expect(document.querySelector('.scene-drawer-trigger')).toBeInTheDocument();
      });

      await user.click(document.querySelector('.scene-drawer-trigger'));

      await waitFor(() => {
        const toggleButton = document.querySelector('.scene-drawer-toggle');
        expect(toggleButton).toBeInTheDocument();
      });
    });

    it('should render close button in drawer', async () => {
      const user = userEvent.setup();
      render(<Dashboard sessionToken="test-token" />);

      await waitFor(() => {
        expect(document.querySelector('.scene-drawer-trigger')).toBeInTheDocument();
      });

      await user.click(document.querySelector('.scene-drawer-trigger'));

      await waitFor(() => {
        const closeButton = document.querySelector('.scene-drawer-close');
        expect(closeButton).toBeInTheDocument();
      });
    });
  });

  describe('Bottom Navigation (Migrated from E2E)', () => {
    it('should render bottom-nav container', async () => {
      render(<Dashboard sessionToken="test-token" />);

      await waitFor(() => {
        const nav = document.querySelector('.bottom-nav');
        expect(nav).toBeInTheDocument();
      });
    });

    it('should render room tab', async () => {
      render(<Dashboard sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText('Living Room')).toBeInTheDocument();
      });
    });

    it('should render nav tab with correct classes', async () => {
      render(<Dashboard sessionToken="test-token" />);

      await waitFor(() => {
        const roomTab = screen.getByText('Living Room').closest('.nav-tab');
        expect(roomTab).toHaveClass('nav-tab');
      });
    });
  });

  describe('Viewport-Specific Layout', () => {
    Object.entries(VIEWPORTS).forEach(([key, viewport]) => {
      describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
        beforeEach(() => {
          setupViewport(key);
        });

        it('should render dark-layout', async () => {
          render(<Dashboard sessionToken="test-token" />);

          await waitFor(() => {
            const layout = document.querySelector('.dark-layout');
            expect(layout).toBeInTheDocument();
          });
        });

        it('should render all core components', async () => {
          render(<Dashboard sessionToken="test-token" />);

          await waitFor(() => {
            expect(document.querySelector('.top-toolbar')).toBeInTheDocument();
            expect(document.querySelector('.main-panel')).toBeInTheDocument();
            expect(document.querySelector('.bottom-nav')).toBeInTheDocument();
          });
        });

        it('should render tiles-grid', async () => {
          render(<Dashboard sessionToken="test-token" />);

          await waitFor(() => {
            const grid = document.querySelector('.tiles-grid');
            expect(grid).toBeInTheDocument();
          });
        });

        it('should render 8 light tiles for full grid', async () => {
          render(<Dashboard sessionToken="test-token" />);

          await waitFor(() => {
            const tiles = document.querySelectorAll('.light-tile');
            expect(tiles.length).toBe(8);
          });
        });

        it('should render scene drawer trigger', async () => {
          render(<Dashboard sessionToken="test-token" />);

          await waitFor(() => {
            const trigger = document.querySelector('.scene-drawer-trigger');
            expect(trigger).toBeInTheDocument();
          });
        });
      });
    });
  });

  describe('Loading State Layout', () => {
    it('should render dark-layout during loading', () => {
      render(<Dashboard sessionToken="test-token" />);

      const layout = document.querySelector('.dark-layout');
      expect(layout).toBeInTheDocument();
    });

    it('should render dark-loading element during initial load', () => {
      // Create a mock that never resolves
      vi.doMock('../../services/homeAdapter', () => ({
        getDashboardFromHome: vi.fn().mockImplementation(() => new Promise(() => {})),
      }));

      render(<Dashboard sessionToken="test-token" />);

      const loading = document.querySelector('.dark-loading');
      expect(loading).toBeInTheDocument();
    });
  });

  describe('Error State Layout', () => {
    it('should render dark-layout on error', async () => {
      const { getDashboardFromHome } = await import('../../services/homeAdapter');
      getDashboardFromHome.mockRejectedValue(new Error('Network error'));

      render(<Dashboard sessionToken="test-token" />);

      await waitFor(() => {
        const layout = document.querySelector('.dark-layout');
        expect(layout).toBeInTheDocument();
      });
    });

    // Note: Error state with toolbar is tested in E2E tests
    // Unit test timing makes this unreliable
  });

  describe('Settings Page Layout', () => {
    it('should render settings-page when opened', async () => {
      const user = userEvent.setup();
      render(<Dashboard sessionToken="test-token" />);

      await waitFor(() => {
        expect(screen.getByText('Living Room')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /settings/i }));

      await waitFor(() => {
        const settingsPage = document.querySelector('.settings-page');
        expect(settingsPage).toBeInTheDocument();
      });
    });
  });
});
