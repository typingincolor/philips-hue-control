import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { STORAGE_KEYS } from './constants/storage';

// Mock DemoModeContext
vi.mock('./context/DemoModeContext', () => ({
  DemoModeProvider: ({ children }) => children,
  useDemoMode: vi.fn(() => ({ isDemoMode: false })),
}));

// Mock hueApi
vi.mock('./services/hueApi', () => ({
  hueApi: {
    discoverBridge: vi.fn(() => Promise.resolve([])),
  },
}));

// Mock authApi for session and auth operations
vi.mock('./services/authApi', () => ({
  connect: vi.fn(() => Promise.reject(new Error('PAIRING_REQUIRED'))),
  createSession: vi.fn(() => Promise.resolve({ sessionToken: 'test', expiresIn: 86400 })),
  pair: vi.fn(() => Promise.resolve('test-username')),
  setSessionToken: vi.fn(),
  clearSessionToken: vi.fn(),
  getSessionToken: vi.fn(() => 'test-token'),
  refreshSession: vi.fn(() => Promise.resolve({ sessionToken: 'refreshed', expiresIn: 86400 })),
  checkHealth: vi.fn(() => Promise.resolve(true)),
}));

// Mock homeAdapter for session validation
vi.mock('./services/homeAdapter', () => ({
  getDashboardFromHome: vi.fn(() => Promise.resolve({ summary: {}, rooms: [], zones: [] })),
  updateLight: vi.fn(),
  updateRoomLights: vi.fn(),
  updateZoneLights: vi.fn(),
  activateSceneV1: vi.fn(),
}));

// Mock components to simplify testing
vi.mock('./components/BridgeDiscovery', () => ({
  BridgeDiscovery: () => <div data-testid="bridge-discovery">Bridge Discovery</div>,
}));

vi.mock('./components/Authentication', () => ({
  Authentication: () => <div data-testid="authentication">Authentication</div>,
}));

vi.mock('./components/Dashboard', () => ({
  Dashboard: () => <div data-testid="dashboard">Dashboard</div>,
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value ? value.toString() : '';
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock SettingsPage component for settings step testing
vi.mock('./components/Dashboard/SettingsPage', () => ({
  SettingsPage: ({ onEnableHue }) => (
    <div data-testid="settings-page">
      Settings Page
      <button data-testid="enable-hue" onClick={onEnableHue}>
        Enable Hue
      </button>
    </div>
  ),
}));

describe('App - Deferred Service Activation', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should show Settings page when no credentials exist', () => {
    // No session in localStorage
    render(<App />);

    // Should show settings page, not discovery
    expect(screen.getByTestId('settings-page')).toBeInTheDocument();
    expect(screen.queryByTestId('bridge-discovery')).not.toBeInTheDocument();
  });

  it('should transition to discovery when Enable Hue is clicked', async () => {
    render(<App />);

    // Settings page should be visible initially
    expect(screen.getByTestId('settings-page')).toBeInTheDocument();

    // Click Enable Hue
    const enableButton = screen.getByTestId('enable-hue');
    await userEvent.click(enableButton);

    // Should now show bridge discovery
    expect(screen.getByTestId('bridge-discovery')).toBeInTheDocument();
    expect(screen.queryByTestId('settings-page')).not.toBeInTheDocument();
  });

  it('should show restoring state when valid session exists', () => {
    const now = Date.now();
    const expiresAt = now + 86400000;

    localStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, 'test-token');
    localStorage.setItem(STORAGE_KEYS.BRIDGE_IP, '192.168.1.100');
    localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRES_AT, expiresAt.toString());

    render(<App />);

    // Should NOT show settings page when valid session exists
    expect(screen.queryByTestId('settings-page')).not.toBeInTheDocument();
  });
});

describe('App - Login Page Flicker Fix', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should NOT flash login page when valid session exists on page load', async () => {
    // Setup: Store a valid session in localStorage
    const now = Date.now();
    const expiresAt = now + 86400000; // 24 hours from now

    localStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, 'test-token');
    localStorage.setItem(STORAGE_KEYS.BRIDGE_IP, '192.168.1.100');
    localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRES_AT, expiresAt.toString());

    // Render the app
    render(<App />);

    // CRITICAL: The login page should NEVER appear, not even briefly
    // If BridgeDiscovery or Authentication appear, it means there was a flash
    expect(screen.queryByTestId('bridge-discovery')).not.toBeInTheDocument();
    expect(screen.queryByTestId('authentication')).not.toBeInTheDocument();

    // Initially shows restoring state, then transitions to dashboard
    // The key is that login pages (discovery/auth) NEVER appear
    await waitFor(() => {
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });

    // Verify login pages still didn't appear
    expect(screen.queryByTestId('bridge-discovery')).not.toBeInTheDocument();
    expect(screen.queryByTestId('authentication')).not.toBeInTheDocument();
  });

  it('should show settings page when NO session exists', () => {
    // No session in localStorage
    render(<App />);

    // Should show settings page (deferred service activation)
    expect(screen.getByTestId('settings-page')).toBeInTheDocument();
    expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();
  });

  it('should go to settings when session restoration fails', async () => {
    // Setup: Store an expired session with bridge IP
    const now = Date.now();
    const expiresAt = now - 1000; // Expired 1 second ago

    localStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, 'expired-token');
    localStorage.setItem(STORAGE_KEYS.BRIDGE_IP, '192.168.1.100');
    localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRES_AT, expiresAt.toString());

    render(<App />);

    // With a stored bridge IP, the app tries to reconnect using server credentials
    // When that fails, it clears the bridge IP and shows settings page
    await waitFor(() => {
      expect(screen.getByTestId('settings-page')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('authentication')).not.toBeInTheDocument();
  });

  it('should go to settings when session token is missing and reconnect fails', async () => {
    // Setup: Partial session data (missing token but has bridge IP)
    localStorage.setItem(STORAGE_KEYS.BRIDGE_IP, '192.168.1.100');
    localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRES_AT, (Date.now() + 86400000).toString());
    // Missing SESSION_TOKEN

    render(<App />);

    // With a stored bridge IP, the app tries to reconnect using server credentials
    // When that fails, it clears the bridge IP and shows settings page
    await waitFor(() => {
      expect(screen.getByTestId('settings-page')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('authentication')).not.toBeInTheDocument();
  });
});
