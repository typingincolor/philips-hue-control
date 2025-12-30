/**
 * API client for state management in production smoke tests
 *
 * Makes direct HTTP calls to the production server to:
 * - Check current system state
 * - Reset to known states
 * - Verify connectivity
 */

import { API } from './constants';

// Get base URL from environment or default
const BASE_URL = process.env.PROD_URL || 'http://localhost:3001';

/**
 * Make an HTTP request to the production server
 */
async function request(method: string, endpoint: string, body?: object): Promise<Response> {
  const url = `${BASE_URL}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  return fetch(url, options);
}

/**
 * Check if the production server is reachable
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await request('GET', API.HEALTH);
    // Health endpoint may redirect, so check for 2xx or 3xx
    return response.ok || response.status === 302;
  } catch {
    return false;
  }
}

/**
 * Get current settings from the server
 */
export async function getSettings(): Promise<{
  location: { lat: number; lon: number; name: string } | null;
  units: string;
  services: {
    hue: { enabled: boolean };
    hive: { enabled: boolean };
  };
}> {
  const response = await request('GET', API.SETTINGS);
  if (!response.ok) {
    throw new Error(`Failed to get settings: ${response.status}`);
  }
  return response.json();
}

/**
 * Check Hive connection status
 */
export async function getHiveConnection(): Promise<{
  connected: boolean;
  message?: string;
}> {
  const response = await request('GET', API.HIVE_CONNECTION);
  if (!response.ok) {
    throw new Error(`Failed to get Hive connection: ${response.status}`);
  }
  return response.json();
}

/**
 * Disconnect from Hive
 */
export async function disconnectHive(): Promise<void> {
  const response = await request('POST', API.HIVE_DISCONNECT);
  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to disconnect Hive: ${response.status}`);
  }
}

/**
 * Clear Hue session (logout)
 */
export async function clearHueSession(): Promise<void> {
  const response = await request('DELETE', API.AUTH_SESSION);
  // 401 is expected if no session exists
  if (!response.ok && response.status !== 401) {
    throw new Error(`Failed to clear Hue session: ${response.status}`);
  }
}

/**
 * Disconnect from Hue bridge
 */
export async function disconnectHue(): Promise<void> {
  const response = await request('POST', API.AUTH_DISCONNECT);
  // 401 is expected if no session exists
  if (!response.ok && response.status !== 401) {
    throw new Error(`Failed to disconnect Hue: ${response.status}`);
  }
}

/**
 * Clear all stored Hue credentials (for testing reset)
 * Requires X-Test-Mode header in production for security
 */
export async function clearHueCredentials(): Promise<void> {
  const url = `${BASE_URL}${API.AUTH_CREDENTIALS}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'X-Test-Mode': 'true',
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to clear Hue credentials: ${response.status}`);
  }
}

/**
 * Update settings
 */
export async function updateSettings(settings: {
  services?: { hue?: { enabled: boolean }; hive?: { enabled: boolean } };
}): Promise<void> {
  const response = await request('PUT', API.SETTINGS, settings);
  if (!response.ok) {
    throw new Error(`Failed to update settings: ${response.status}`);
  }
}

/**
 * Reset system to fresh state (no services connected)
 */
export async function resetToFresh(): Promise<void> {
  // Clear stored credentials (doesn't require session)
  await clearHueCredentials().catch(() => {});

  // Disconnect both services (may fail without session, that's OK)
  await disconnectHive().catch(() => {});
  await disconnectHue().catch(() => {});
  await clearHueSession().catch(() => {});

  // Disable both services in settings
  await updateSettings({
    services: {
      hue: { enabled: false },
      hive: { enabled: false },
    },
  }).catch(() => {});
}

/**
 * Determine current system state based on API responses
 */
export async function getCurrentState(): Promise<string> {
  try {
    const settings = await getSettings();
    const hiveStatus = await getHiveConnection().catch(() => ({ connected: false }));

    const hueEnabled = settings.services?.hue?.enabled ?? false;
    const hiveEnabled = settings.services?.hive?.enabled ?? false;
    const hiveConnected = hiveStatus.connected;

    if (hueEnabled && hiveConnected) {
      return 'fully_connected';
    } else if (hiveConnected) {
      return 'hive_connected';
    } else if (hueEnabled) {
      return 'hue_connected';
    } else if (hiveEnabled) {
      return 'hive_pending';
    } else {
      return 'fresh';
    }
  } catch {
    return 'unknown';
  }
}
