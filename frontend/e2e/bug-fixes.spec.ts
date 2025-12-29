import { test, expect } from '@playwright/test';

/**
 * Bug Fix Verification Tests
 *
 * These tests verify fixes for bugs found during manual testing:
 * - Bug #1: Real mode should show Settings page on first load
 * - Bug #2: Home tab should have visual indicator when selected
 * - Bug #3: Home tab should not show extended "reconnecting" spinner
 */

test.describe('Bug #1: Initial View in Real Mode', () => {
  test.beforeEach(async ({ page }) => {
    // Clear ALL localStorage to simulate fresh browser
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should show Settings page on first load with no credentials', async ({ page }) => {
    // Navigate without demo flag (real mode)
    await page.goto('/');

    // Should show Settings page, NOT Bridge Connector/Discovery
    await expect(page.getByText(/Settings/i)).toBeVisible();

    // Should NOT show the Hue Bridge connection wizard
    await expect(page.getByRole('heading', { name: 'Auto-Discovery' })).not.toBeVisible();
    await expect(page.getByText(/Philips Hue Bridge Connector/i)).not.toBeVisible();

    // Settings page should have service toggles
    await expect(page.getByText('Philips Hue')).toBeVisible();
  });

  test('should NOT show Bridge Connector or Discovery as initial view', async ({ page }) => {
    await page.goto('/');

    // These should NOT be visible on fresh start
    await expect(page.getByRole('heading', { name: 'Auto-Discovery' })).not.toBeVisible();
    await expect(page.getByText(/press.*link.*button/i)).not.toBeVisible();
    await expect(page.locator('.progress-indicator')).not.toBeVisible();
  });
});

test.describe('Bug #2: Home Tab Selection Indicator', () => {
  test.beforeEach(async ({ page }) => {
    // Use demo mode to get to dashboard with Home tab available
    await page.goto('/?demo=true');
    // Wait for dashboard to load
    await expect(page.getByText('Living Room')).toBeVisible();
  });

  test('should show visual indicator on selected bottom nav tab', async ({ page }) => {
    // Find the bottom navigation
    const bottomNav = page.locator('.bottom-nav');
    await expect(bottomNav).toBeVisible();

    // Click on Home tab if visible
    const homeTab = page.locator('.bottom-nav-item').filter({ hasText: 'Home' });

    if (await homeTab.isVisible()) {
      await homeTab.click();

      // The Home tab should have an 'active' or 'selected' class/indicator
      await expect(homeTab).toHaveClass(/active|selected/);
    }
  });

  test('should show visual indicator on room tab when selected', async ({ page }) => {
    // Click on a room tab (Living Room should be visible in demo mode)
    const livingRoomTab = page.locator('.bottom-nav-item').filter({ hasText: 'Living Room' });

    if (await livingRoomTab.isVisible()) {
      await livingRoomTab.click();

      // The selected tab should have an active indicator
      await expect(livingRoomTab).toHaveClass(/active|selected/);
    }
  });

  test('bottom nav tabs should have distinct active state styling', async ({ page }) => {
    // Get all bottom nav items
    const navItems = page.locator('.bottom-nav-item');
    const count = await navItems.count();

    if (count > 0) {
      // Click first item
      await navItems.first().click();

      // Check that exactly one item has active class
      const activeItems = page.locator('.bottom-nav-item.active');
      await expect(activeItems).toHaveCount(1);
    }
  });
});

test.describe('Bug #3: Home Tab Reconnecting Spinner', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?demo=true');
    await expect(page.getByText('Living Room')).toBeVisible();
  });

  test('should not show extended reconnecting spinner when selecting Home tab', async ({
    page,
  }) => {
    // Find and click Home tab
    const homeTab = page.locator('.bottom-nav-item').filter({ hasText: 'Home' });

    if (await homeTab.isVisible()) {
      await homeTab.click();

      // Should NOT show reconnecting spinner for more than 2 seconds
      // If spinner appears, it should resolve quickly
      const spinner = page.locator('.reconnecting, .spinner').filter({ hasText: /reconnect/i });

      // Either spinner doesn't appear, or it disappears within 2 seconds
      await expect(async () => {
        const isVisible = await spinner.isVisible();
        if (isVisible) {
          // Fail if still visible after waiting
          throw new Error('Reconnecting spinner still visible');
        }
      }).toPass({ timeout: 3000 });
    }
  });

  test('Home tab content should load within reasonable time', async ({ page }) => {
    const homeTab = page.locator('.bottom-nav-item').filter({ hasText: 'Home' });

    if (await homeTab.isVisible()) {
      await homeTab.click();

      // Home view content should appear within 3 seconds
      // Look for typical Home view elements (thermostat, heating controls, etc.)
      const homeContent = page.locator('.home-view, .hive-view, [class*="home"], [class*="hive"]');
      await expect(homeContent.first()).toBeVisible({ timeout: 3000 });
    }
  });
});
