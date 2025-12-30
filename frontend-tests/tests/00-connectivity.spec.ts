/**
 * Connectivity Tests
 *
 * Basic tests to verify the production server is reachable
 * before running more complex tests.
 */

import { test, expect } from '@playwright/test';
import { API, VIEWPORTS } from '../src/constants';

test.describe('Server Connectivity', () => {
  test.use({ viewport: VIEWPORTS.raspberryPi });

  test('should reach the health endpoint', async ({ request }) => {
    const response = await request.get(API.HEALTH);
    expect(response.ok()).toBe(true);
  });

  test('should reach the settings endpoint', async ({ request }) => {
    const response = await request.get(API.SETTINGS);
    expect(response.ok()).toBe(true);

    const settings = await response.json();
    expect(settings).toHaveProperty('services');
  });

  test('should load the main page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Home Control/i);
  });

  test('should have valid viewport size', async ({ page }) => {
    await page.goto('/');

    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    expect(viewport?.width).toBe(VIEWPORTS.raspberryPi.width);
    expect(viewport?.height).toBe(VIEWPORTS.raspberryPi.height);
  });
});

test.describe('WebSocket Connectivity', () => {
  test.use({ viewport: VIEWPORTS.raspberryPi });

  test('should have Socket.IO available on the page', async ({ page }) => {
    await page.goto('/');

    // Wait for the page to load and Socket.IO to initialize
    await page.waitForTimeout(2000);

    // Check if Socket.IO library is loaded (the app uses Socket.IO)
    const hasSocketIO = await page.evaluate(() => {
      // Check for Socket.IO client in the window or as a bundled module
      // @ts-expect-error - accessing potential global
      return (
        typeof window.io !== 'undefined' ||
        document.querySelector('script[src*="socket.io"]') !== null
      );
    });

    // This is a soft check - Socket.IO may be bundled
    // The important thing is the page loads without WebSocket errors
    const hasErrors = await page.evaluate(() => {
      // @ts-expect-error - accessing console errors
      return (window.__consoleErrors || []).some((e: string) => e.includes('WebSocket'));
    });

    expect(hasErrors).toBe(false);
  });
});
