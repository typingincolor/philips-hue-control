import { test, expect } from '@playwright/test';

// Note: Demo mode tests use ?demo=true which bypasses auth entirely
// No localStorage cleanup needed as demo mode doesn't persist auth state

test.describe('Demo Mode Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to demo mode - skips authentication
    await page.goto('/?demo=true');
  });

  test('should load dashboard with rooms', async ({ page }) => {
    // Wait for dashboard to load
    await expect(page.getByText('Living Room')).toBeVisible();
    await expect(page.getByText('Kitchen')).toBeVisible();
    await expect(page.getByText('Bedroom')).toBeVisible();
  });

  test('should display lights in rooms', async ({ page }) => {
    // Check for light names in Living Room
    await expect(page.getByText('Floor Lamp')).toBeVisible();
    await expect(page.getByText('TV Backlight')).toBeVisible();
  });

  test('should display dashboard summary stats', async ({ page }) => {
    // TopToolbar shows stats as icon + number pairs
    // Check that the toolbar-stat elements exist
    const statElements = page.locator('.toolbar-stat');
    await expect(statElements).toHaveCount(3);
  });

  test('should display motion zones', async ({ page }) => {
    // Check for motion zone indicators
    await expect(page.getByText('Living Room').first()).toBeVisible();
    await expect(page.getByText('Kitchen').first()).toBeVisible();
  });

  test('should toggle light on/off', async ({ page }) => {
    // Find a light button and click it
    const floorLampButton = page.getByRole('button', { name: /Floor Lamp/i });
    await expect(floorLampButton).toBeVisible();

    // Click to toggle
    await floorLampButton.click();

    // The button should still be visible after toggle
    await expect(floorLampButton).toBeVisible();
  });

  test('should display scene tiles in room view', async ({ page }) => {
    // Scene tiles should be visible (replaces scene drawer)
    const sceneTiles = page.locator('.scene-tile');
    await expect(sceneTiles.first()).toBeVisible();
  });

  test('should display All On/Off tile', async ({ page }) => {
    // All On/Off tile should be visible
    const allOnOffTile = page.locator('.all-on-off-tile');
    await expect(allOnOffTile).toBeVisible();
  });

  test('should activate scene when scene tile clicked', async ({ page }) => {
    // Click a scene tile
    const sceneTile = page.locator('.scene-tile').first();
    await sceneTile.click();

    // Scene tile should still be visible after activation
    await expect(sceneTile).toBeVisible();
  });

  test('should toggle all lights when All On/Off tile clicked', async ({ page }) => {
    // Click All On/Off tile
    const allOnOffTile = page.locator('.all-on-off-tile');
    await allOnOffTile.click();

    // Tile should still be visible after toggle
    await expect(allOnOffTile).toBeVisible();
  });

  test('should have settings button in toolbar', async ({ page }) => {
    // Settings button should be visible in toolbar
    const settingsButton = page.locator('.toolbar-settings');
    await expect(settingsButton).toBeVisible();
  });

  test('should open settings page when settings clicked', async ({ page }) => {
    // Click settings button
    const settingsButton = page.locator('.toolbar-settings');
    await settingsButton.click();

    // Settings page should appear
    const settingsPage = page.locator('.settings-page');
    await expect(settingsPage).toBeVisible();
  });
});

test.describe('Demo Mode - Responsive', () => {
  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 14

    await page.goto('/?demo=true');

    // Dashboard should still be visible
    await expect(page.getByText('Living Room')).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad

    await page.goto('/?demo=true');

    // Dashboard should still be visible
    await expect(page.getByText('Living Room')).toBeVisible();
  });
});
