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

  // Automations
  NAV_AUTOMATIONS: 'Automations',
  AUTOMATIONS_TITLE: 'Automations',
  AUTOMATIONS_LOADING: 'Loading automations...',
  AUTOMATIONS_EMPTY: 'No automations configured',
  AUTOMATIONS_EMPTY_HINT: 'Set up automations in the Hue app',
  AUTOMATIONS_ERROR: 'Failed to load automations',
  AUTOMATIONS_TRIGGER_FAILED: 'Failed to trigger automation',

  // Common
  ERROR_OCCURRED: 'An error occurred',
  RETRY: 'Retry',

  // Weather
  WEATHER_LOADING: 'Loading...',
  WEATHER_ERROR: 'Weather unavailable',
  WEATHER_SET_LOCATION: 'Set location',
  WEATHER_FEELS_LIKE: 'Feels like',
  WEATHER_HUMIDITY: 'Humidity',
  WEATHER_WIND: 'Wind',
  WEATHER_FORECAST: '5-Day Forecast',

  // Settings
  SETTINGS_TITLE: 'Settings',
  SETTINGS_LOCATION: 'Location',
  SETTINGS_LOCATION_PLACEHOLDER: 'City name',
  SETTINGS_UNITS: 'Temperature Units',
  SETTINGS_CELSIUS: 'Celsius',
  SETTINGS_FAHRENHEIT: 'Fahrenheit',
  SETTINGS_DETECT_LOCATION: 'Detect Location',
  SETTINGS_DETECTING: 'Detecting...',
  SETTINGS_WEATHER_ENABLED: 'Show Weather',
  SETTINGS_AUTO_SAVED: 'Changes saved automatically',
  SETTINGS_SERVICES: 'Services',
  SETTINGS_HUE_SERVICE: 'Philips Hue',
  SETTINGS_HIVE_SERVICE: 'Hive Heating',

  // Hive Heating
  HIVE_HEATING_STATUS: 'Heating status',
  HIVE_HOT_WATER_STATUS: 'Hot water status',
  HIVE_CURRENT_TEMP: 'Current temperature',
  HIVE_SCHEDULES: 'Heating schedules',
  HIVE_NO_SCHEDULES: 'No schedules configured',
  HIVE_LOADING: 'Loading Hive data...',

  // Hive Settings & Navigation
  NAV_HIVE: 'Hive',
  SETTINGS_HIVE: 'Hive Heating',
  HIVE_USERNAME_PLACEHOLDER: 'Email / Username',
  HIVE_PASSWORD_PLACEHOLDER: 'Password',
  HIVE_CONNECT: 'Connect',
  HIVE_CONNECTING: 'Connecting...',
  HIVE_CONNECTED: 'Connected',
  HIVE_DISCONNECT: 'Disconnect',

  // Hive Login
  HIVE_LOGIN_TITLE: 'Connect to Hive',
  HIVE_INVALID_CREDENTIALS: 'Invalid email or password',

  // Hive 2FA
  HIVE_2FA_TITLE: 'Verify Your Identity',
  HIVE_2FA_DESCRIPTION: 'Enter the 6-digit code sent to your phone',
  HIVE_2FA_PLACEHOLDER: 'Enter verification code',
  HIVE_VERIFY: 'Verify',
  HIVE_VERIFYING: 'Verifying...',
  HIVE_BACK_TO_LOGIN: 'Back to login',
  HIVE_INVALID_CODE: 'Invalid verification code',
  HIVE_TAB_LINK: 'Use the Hive tab to connect',
};
