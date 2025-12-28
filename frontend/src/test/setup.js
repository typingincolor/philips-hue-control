import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Mock hooks that make network calls - prevents "Failed to parse URL" warnings
// Individual test files can override these mocks as needed
vi.mock('../hooks/useSettings', () => ({
  useSettings: () => ({
    settings: {
      units: 'celsius',
      location: null,
      services: {
        hue: { enabled: true },
        hive: { enabled: true },
      },
    },
    isLoading: false,
    error: null,
    updateSettings: vi.fn(),
  }),
}));

vi.mock('../hooks/useWeather', () => ({
  useWeather: () => ({
    weather: null,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

// Setup localStorage mock if not available (jsdom should provide it)
if (typeof global.localStorage === 'undefined') {
  const localStorageMock = (() => {
    let store = {};
    return {
      getItem: (key) => store[key] || null,
      setItem: (key, value) => {
        store[key] = value.toString();
      },
      removeItem: (key) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();
  global.localStorage = localStorageMock;
}

// Cleanup after each test
afterEach(() => {
  cleanup();
  if (localStorage && typeof localStorage.clear === 'function') {
    localStorage.clear();
  }
});
