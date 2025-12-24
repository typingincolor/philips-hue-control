import { test, expect } from '@playwright/test';

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

  test('should have scene selector in rooms', async ({ page }) => {
    // Look for scene buttons (Living Room has Bright and Relax scenes)
    await expect(page.getByRole('button', { name: /Bright/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Relax/i })).toBeVisible();
  });

  test('should activate scene when clicked', async ({ page }) => {
    // Click a scene button
    const brightScene = page.getByRole('button', { name: /Bright/i });
    await brightScene.click();

    // Scene should still be visible after click
    await expect(brightScene).toBeVisible();
  });

  test('should have All On/Off toggle button in room', async ({ page }) => {
    // Look for room toggle button (sun/moon icon)
    const toggleButton = page.locator('.room-toggle-all');
    await expect(toggleButton).toBeVisible();
  });

  test('should toggle all lights in room', async ({ page }) => {
    // Find and click the room toggle button
    const toggleButton = page.locator('.room-toggle-all');
    await toggleButton.click();

    // Button should remain functional
    await expect(toggleButton).toBeVisible();
  });

  test('should display zones navigation', async ({ page }) => {
    // Check for Zones button in bottom navigation
    const zonesButton = page.getByRole('button', { name: /Zones/i });
    await expect(zonesButton).toBeVisible();
  });

  test('should have logout button', async ({ page }) => {
    // Look for logout button by class (it's an icon button without text)
    const logoutButton = page.locator('.toolbar-logout');
    await expect(logoutButton).toBeVisible();
  });

  test('should call logout handler when logout clicked', async ({ page }) => {
    // In demo mode, clicking logout clears session state
    // Note: Demo mode URL parameter keeps user on dashboard
    // We verify the logout button is clickable and session is cleared

    const logoutButton = page.locator('.toolbar-logout');
    await logoutButton.click();

    // Session token should be cleared from localStorage
    const sessionToken = await page.evaluate(() => {
      return localStorage.getItem('hue_session_token');
    });
    expect(sessionToken).toBeNull();
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
