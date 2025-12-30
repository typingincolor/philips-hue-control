/**
 * Constants for production smoke tests
 */

/**
 * Viewport definitions for different devices
 */
export const VIEWPORTS = {
  raspberryPi: { width: 800, height: 480, name: 'Raspberry Pi 7"' },
  ipad: { width: 1024, height: 768, name: 'iPad' },
  iphone14: { width: 390, height: 844, name: 'iPhone 14' },
} as const;

/**
 * Layout constraint constants
 */
export const LAYOUT = {
  /** Minimum spacing from screen edges */
  MIN_EDGE_SPACING: 16,
  /** Minimum gap between adjacent components */
  MIN_COMPONENT_GAP: 2,
  /** Minimum touch target size (accessibility) */
  MIN_BUTTON_SIZE: 44,
  /** Minimum touch target size on compact screens (≤480px height) */
  MIN_BUTTON_SIZE_COMPACT: 36,
  /** Top toolbar height */
  TOOLBAR_HEIGHT: 56,
  /** Bottom navigation height */
  NAV_HEIGHT: 120,
  /** Tolerance for spacing comparisons */
  SPACING_TOLERANCE: 10,
} as const;

/**
 * Expected grid layouts per viewport
 */
export const EXPECTED_GRID = {
  raspberryPi: { columns: 4, rows: 2 },
  ipad: { columns: 4, rows: 2 },
  iphone14: { columns: 2, rows: 4 },
} as const;

/**
 * System states for state management
 */
export enum SystemState {
  /** No credentials, settings page shown */
  FRESH = 'fresh',
  /** Hue bridge IP known, not yet paired */
  HUE_DISCOVERED = 'hue_discovered',
  /** Hue fully working */
  HUE_CONNECTED = 'hue_connected',
  /** Hive credentials entered, waiting for 2FA */
  HIVE_PENDING_2FA = 'hive_pending_2fa',
  /** Hive fully working */
  HIVE_CONNECTED = 'hive_connected',
  /** Both Hue and Hive connected */
  FULLY_CONNECTED = 'fully_connected',
}

/**
 * CSS selectors for common elements
 */
export const SELECTORS = {
  // Layout elements
  TOP_TOOLBAR: '.top-toolbar',
  BOTTOM_NAV: '.bottom-nav',
  MAIN_PANEL: '.main-panel',
  TILES_GRID: '.tiles-grid',
  LIGHT_TILE: '.light-tile',

  // Toolbar elements
  TOOLBAR_SETTINGS: '.toolbar-settings',
  TOOLBAR_LEFT: '.toolbar-left',
  TOOLBAR_RIGHT: '.toolbar-right',
  TOOLBAR_WEATHER: '.toolbar-weather-container',

  // Navigation
  NAV_TAB: '.nav-tab',

  // Settings page
  SETTINGS_PAGE: '.settings-page',
  SERVICE_TOGGLE: '.service-toggle',

  // Bridge discovery
  BRIDGE_DISCOVERY: '.bridge-discovery',
  IP_INPUT: '.ip-input',
  CONNECT_BUTTON: 'button:has-text("Connect")',

  // Authentication
  AUTHENTICATION: '.authentication',
  LINK_BUTTON_PROMPT: '.link-button-prompt',

  // Scene drawer
  SCENE_DRAWER: '.scene-drawer',
  SCENE_DRAWER_TRIGGER: '.scene-drawer-trigger',
  SCENE_DRAWER_ITEM: '.scene-drawer-item',

  // Hive
  HIVE_LOGIN_FORM: '.hive-login-form',
  HIVE_2FA_FORM: '.hive-2fa-form',
} as const;

/**
 * API endpoints
 */
export const API = {
  HEALTH: '/health',
  SETTINGS: '/api/v2/settings',
  AUTH_SESSION: '/api/v2/auth/session',
  AUTH_DISCONNECT: '/api/v2/auth/disconnect',
  AUTH_CREDENTIALS: '/api/v2/auth/credentials',
  HIVE_CONNECTION: '/api/v2/services/hive/connection',
  HIVE_DISCONNECT: '/api/v2/services/hive/disconnect',
} as const;
