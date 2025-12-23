/**
 * UI Text Constants
 * Centralized UI text for components and tests
 * Update these constants to change UI text across the app
 */

export const UI_TEXT = {
  // App Header
  APP_TITLE: 'Philips Hue Bridge Connector',
  APP_SUBTITLE: 'Verify Local API Connectivity',

  // BridgeDiscovery
  BRIDGE_DISCOVERY_TITLE: 'Find Your Hue Bridge',
  BRIDGE_DISCOVERY_AUTO_TITLE: 'Auto-Discovery',
  BRIDGE_DISCOVERY_MANUAL_TITLE: 'Enter IP Manually',
  BUTTON_DISCOVER_BRIDGE: 'Discover Bridge',
  BUTTON_DISCOVERING: 'Searching...',
  BUTTON_USE_THIS_BRIDGE: 'Use This Bridge',
  BUTTON_CONNECT: 'Connect',
  PLACEHOLDER_MANUAL_IP: '192.168.1.xxx',
  LABEL_FOUND_BRIDGES: 'Found Bridges:',
  DIVIDER_OR: 'OR',

  // Authentication
  AUTH_MAIN_TITLE: 'Authenticate with Bridge',
  AUTH_BRIDGE_IP_LABEL: 'Bridge IP:',
  AUTH_TITLE: 'Press the Link Button',
  AUTH_DESCRIPTION: 'Press the round button on top of your Hue Bridge, then click below',
  AUTH_AUTHENTICATING_TITLE: 'Authenticating...',
  AUTH_AUTHENTICATING_MESSAGE: 'Creating secure connection to your bridge',
  AUTH_FAILED_TITLE: 'Authentication Failed',
  BUTTON_I_PRESSED_BUTTON: 'I Pressed the Button',
  BUTTON_TRY_AGAIN: 'Try Again',

  // LightControl
  LIGHT_CONTROL_TITLE: 'Light Control',
  BUTTON_LOGOUT: 'Logout',
  STATUS_CONNECTED: 'Connected',
  STATUS_DISCONNECTED: 'Disconnected - attempting to reconnect...',
  LOADING_CONNECTING: 'Connecting to bridge...',
  LOADING_LOADING_LIGHTS: 'Loading lights...',

  // DashboardSummary
  LABEL_LIGHTS_ON: 'lights on',
  LABEL_ROOMS: 'rooms',
  LABEL_SCENES: 'scenes',
  LABEL_DEMO_MODE: 'Demo Mode',

  // RoomCard
  BUTTON_ALL_ON: 'All On',
  BUTTON_ALL_OFF: 'All Off',
  SELECT_SCENE_PLACEHOLDER: 'Select scene...',
  STATUS_LIGHTS_ON_FORMAT: (on, total) => `${on} of ${total} on`,
  BRIGHTNESS_PLACEHOLDER: '—',

  // MotionZones
  MOTION_ZONES_TITLE: 'Motion Zones',
  MOTION_DETECTED: 'Motion Detected',
  NO_MOTION: 'No Motion',

  // Dark Theme Navigation
  NAV_ZONES: 'Zones',
  ZONES_VIEW_TITLE: 'Zones',
  ZONES_VIEW_SUBTITLE: 'Control light groups across rooms',
  TOOLBAR_MOTION_LABEL: 'Motion:',
  STATUS_LIGHTS_ON: 'on',
  STATUS_TOTAL_LIGHTS: 'total',

  // Common
  ERROR_OCCURRED: 'An error occurred',
  RETRY: 'Retry'
};
