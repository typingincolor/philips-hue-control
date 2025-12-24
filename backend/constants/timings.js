/**
 * Timing Constants
 * Centralized configuration for all timing-related values
 */

// Cache settings
export const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// WebSocket settings
export const WEBSOCKET_POLL_INTERVAL_MS = 15000; // 15 seconds
export const WEBSOCKET_HEARTBEAT_INTERVAL_MS = 30000; // 30 seconds
export const WEBSOCKET_CLEANUP_INTERVAL_MS = 60000; // 60 seconds

// Session settings
export const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
export const SESSION_CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

// Scene settings
export const SCENE_APPLY_DELAY_MS = 500; // 500ms for Hue Bridge to apply scene

// HTTP request settings
export const REQUEST_TIMEOUT_MS = 10000; // 10 seconds
