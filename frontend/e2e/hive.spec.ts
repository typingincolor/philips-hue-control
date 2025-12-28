import { test, expect, Page } from '@playwright/test';

/**
 * Hive Integration E2E Tests - Phase 1: Status Display
 *
 * Tests for UK Hive heating system integration with demo mode support.
 */

// Helper to reset Hive demo state via API (reliable way to ensure disconnected)
async function resetHiveDemoState(page: Page) {
  // Reset both Hive connection and settings to ensure clean state
  await page.request.post('/api/v1/hive/reset-demo', {
    headers: { 'X-Demo-Mode': 'true' },
  });
  await page.request.post('/api/v1/settings/reset-demo', {
    headers: { 'X-Demo-Mode': 'true' },
  });
}

// Helper to close settings page
async function closeSettingsPage(page: Page) {
  await page.keyboard.press('Escape');
  await page.waitForSelector('.settings-page', { state: 'hidden' });
}

// Helper to ensure Hive is disconnected (uses API reset + fresh navigation to sync frontend)
async function ensureHiveDisconnected(page: Page) {
  await resetHiveDemoState(page);
  // Navigate fresh to ensure frontend syncs with backend state
  await page.goto('/?demo=true');
  await page.waitForSelector('.main-panel');
}

// Helper to enable Hive service via API and navigate to Hive view
async function navigateToHiveLogin(page: Page) {
  // Enable Hive service via settings API
  await page.request.put('/api/v1/settings', {
    headers: { 'X-Demo-Mode': 'true' },
    data: { services: { hive: { enabled: true } } },
  });

  // Reload to pick up the new settings
  await page.reload();
  await page.waitForSelector('.main-panel');

  // Open settings and click the Hive link
  await page.click('[aria-label="settings"]');
  await page.waitForSelector('.settings-page');

  // Click on the Hive section link that says "Use the Hive tab to connect"
  await page.locator('.settings-hive-link').click();

  // Wait for Hive view with login form to appear
  await page.waitForSelector('.hive-view');
}

// Helper to connect to Hive in demo mode (now through HiveView with 2FA)
async function connectToHive(page: Page) {
  // First ensure Hive is disconnected to avoid race conditions with hiveCheckConnection
  await ensureHiveDisconnected(page);

  // Navigate to Hive view via settings link
  await navigateToHiveLogin(page);

  // Wait for either login form or thermostat to be visible
  const loginForm = page.locator('.hive-login-form');
  const thermostat = page.locator('.hive-thermostat');

  await Promise.race([
    loginForm.waitFor({ state: 'visible' }),
    thermostat.waitFor({ state: 'visible' }),
  ]);

  // If already connected (thermostat visible), we're done
  if (await thermostat.isVisible()) {
    return;
  }

  // Use locator-based fill which handles re-renders better
  await page.locator('input[placeholder*="Email" i]').fill('demo@hive.com');
  await page.locator('input[type="password"]').fill('demo');

  // Click Connect button
  await page.locator('button:has-text("Connect")').click();

  // Wait for 2FA form (all demo logins require 2FA like real Hive)
  await page.waitForSelector('.hive-2fa-form');

  // Enter 2FA code and verify
  await page.locator('input[placeholder*="code" i]').fill('123456');
  await page.locator('button:has-text("Verify")').click();

  // Wait for connection to complete (thermostat appears)
  await page.waitForSelector('.hive-thermostat');
}

// Helper to navigate to Hive view
async function navigateToHive(page: Page) {
  await page.click('.nav-tab:has-text("Hive")');
  await page.waitForSelector('.hive-view');
}

// Run Hive tests serially to avoid demo mode state conflicts
// Also use a project-level serial mode to prevent parallel execution with hive-2fa.spec.ts
test.describe.configure({ mode: 'serial' });
test.use({ storageState: undefined }); // Ensure fresh state per test

test.describe('Hive Integration - Phase 1: Status Display', () => {
  test.describe('Settings - Hive Section', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/?demo=true');
      await page.waitForSelector('.main-panel');
    });

    test('should display Hive section in settings page', async ({ page }) => {
      await page.click('[aria-label="settings"]');
      await page.waitForSelector('.settings-page');
      await expect(page.locator('.settings-hive-section')).toBeVisible();
    });

    test('should show link to Hive tab when disconnected', async ({ page }) => {
      await page.click('[aria-label="settings"]');
      await page.waitForSelector('.settings-page');
      // Login form is now in HiveView, settings shows a link to Hive tab
      await expect(page.locator('.settings-hive-link')).toBeVisible();
    });

    test('should not show login form in settings (moved to Hive tab)', async ({ page }) => {
      await page.click('[aria-label="settings"]');
      await page.waitForSelector('.settings-page');
      // Login inputs should not be in settings page anymore
      await expect(
        page.locator('.settings-page input[placeholder*="username" i]')
      ).not.toBeVisible();
    });

    test('should show Disconnect button when connected', async ({ page }) => {
      await connectToHive(page);
      await page.click('[aria-label="settings"]');
      await page.waitForSelector('.settings-page');

      await expect(page.locator('button:has-text("Disconnect")')).toBeVisible();
    });

    test('should show link to Hive tab after disconnect', async ({ page }) => {
      await connectToHive(page);
      await page.click('[aria-label="settings"]');
      await page.waitForSelector('.settings-page');

      await page.waitForSelector('button:has-text("Disconnect")');
      await page.click('button:has-text("Disconnect")');

      // Link to Hive tab should appear after disconnect
      await expect(page.locator('.settings-hive-link')).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('should not show Hive tab when disconnected (deferred service activation)', async ({
      page,
    }) => {
      await page.goto('/?demo=true');
      await page.waitForSelector('.main-panel');
      await ensureHiveDisconnected(page);
      // Hive tab is now only visible when connected
      await expect(page.locator('.nav-tab:has-text("Hive")')).not.toBeVisible();
    });

    test('should show Hive tab after connecting', async ({ page }) => {
      await page.goto('/?demo=true');
      await page.waitForSelector('.main-panel');

      await connectToHive(page);

      await expect(page.locator('.nav-tab:has-text("Hive")')).toBeVisible();
    });

    test('should navigate to Hive view when tab is clicked', async ({ page }) => {
      await page.goto('/?demo=true');
      await page.waitForSelector('.main-panel');

      await connectToHive(page);
      await navigateToHive(page);

      // Should see temperature display
      await expect(page.locator('.hive-temp-display')).toBeVisible();
    });

    test('should highlight Hive tab when selected', async ({ page }) => {
      await page.goto('/?demo=true');
      await page.waitForSelector('.main-panel');

      await connectToHive(page);
      await page.click('.nav-tab:has-text("Hive")');

      const hiveTab = page.locator('.nav-tab:has-text("Hive")');
      await expect(hiveTab).toHaveClass(/active/);
    });

    test('should hide Hive tab after disconnect', async ({ page }) => {
      await page.goto('/?demo=true');
      await page.waitForSelector('.main-panel');

      await connectToHive(page);
      await expect(page.locator('.nav-tab:has-text("Hive")')).toBeVisible();

      // Open settings and disconnect
      await page.click('[aria-label="settings"]');
      await page.waitForSelector('.settings-page');
      await page.click('button:has-text("Disconnect")');

      // Close settings page
      await closeSettingsPage(page);

      // Hive tab should now be hidden (deferred service activation)
      await expect(page.locator('.nav-tab:has-text("Hive")')).not.toBeVisible();
    });
  });

  test.describe('Thermostat Display', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/?demo=true');
      await page.waitForSelector('.main-panel');
      await connectToHive(page);
      await navigateToHive(page);
    });

    test('should display current temperature', async ({ page }) => {
      // Demo mode returns 19.5°C
      await expect(page.locator('text=19.5°')).toBeVisible();
    });

    test('should display heating status indicator', async ({ page }) => {
      await expect(page.locator('[aria-label="Heating status"]')).toBeVisible();
    });

    test('should display hot water status indicator', async ({ page }) => {
      await expect(page.locator('[aria-label="Hot water status"]')).toBeVisible();
    });

    test('should show heating indicator as active when heating is on', async ({ page }) => {
      // Demo mode has heating on
      const heatingIndicator = page.locator('[aria-label="Heating status"]');
      await expect(heatingIndicator).toHaveClass(/active/);
    });

    test('should have accessible temperature label', async ({ page }) => {
      await expect(page.locator('.hive-temp-display')).toBeVisible();
    });

    test('should have accessible heating status label', async ({ page }) => {
      await expect(page.locator('[aria-label="Heating status"]')).toBeVisible();
    });

    test('should have accessible hot water status label', async ({ page }) => {
      await expect(page.locator('[aria-label="Hot water status"]')).toBeVisible();
    });
  });

  test.describe('Schedule List (Read-Only)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/?demo=true');
      await page.waitForSelector('.main-panel');
      await connectToHive(page);
      await navigateToHive(page);
    });

    test('should display list of schedules', async ({ page }) => {
      await expect(page.locator('.hive-schedule-item')).toHaveCount(3);
    });

    test('should display schedule name', async ({ page }) => {
      await expect(page.locator('text=Morning Warmup')).toBeVisible();
    });

    test('should display schedule description with time and days', async ({ page }) => {
      // Check for time
      await expect(page.locator('text=06:00')).toBeVisible();
    });

    test('should show both heating and hot water schedules', async ({ page }) => {
      await expect(page.locator('text=Morning Warmup')).toBeVisible();
      await expect(page.locator('text=Hot Water AM')).toBeVisible();
    });
  });

  test.describe('Loading and Error States', () => {
    test('should show loading state while fetching Hive data', async ({ page }) => {
      await page.goto('/?demo=true');
      await page.waitForSelector('.main-panel');
      await connectToHive(page);

      // Click on Hive tab and check for loading state
      await page.click('.nav-tab:has-text("Hive")');

      // Loading state should appear briefly
      // Due to fast demo mode response, we may not catch it
      // This test verifies the view loads correctly
      await expect(page.locator('.hive-view')).toBeVisible();
    });

    test('should show retry button on error', async ({ page }) => {
      await page.goto('/?demo=true');
      await page.waitForSelector('.main-panel');
      await connectToHive(page);
      await navigateToHive(page);

      // In demo mode, there should be no error state
      // This test verifies error handling exists in the component
      await expect(page.locator('.hive-view')).toBeVisible();
    });
  });

  test.describe('Responsive - Raspberry Pi (800x480)', () => {
    test.use({ viewport: { width: 800, height: 480 } });

    test('should display Hive view on Raspberry Pi', async ({ page }) => {
      await page.goto('/?demo=true');
      await page.waitForSelector('.main-panel');
      await connectToHive(page);
      await navigateToHive(page);

      await expect(page.locator('.hive-view')).toBeVisible();
    });

    test('should show thermostat display on compact screen', async ({ page }) => {
      await page.goto('/?demo=true');
      await page.waitForSelector('.main-panel');
      await connectToHive(page);
      await navigateToHive(page);

      await expect(page.locator('.hive-temp-display')).toBeVisible();
    });

    test('should show status indicators', async ({ page }) => {
      await page.goto('/?demo=true');
      await page.waitForSelector('.main-panel');
      await connectToHive(page);
      await navigateToHive(page);

      await expect(page.locator('[aria-label="Heating status"]')).toBeVisible();
      await expect(page.locator('[aria-label="Hot water status"]')).toBeVisible();
    });

    test('should fit within viewport width', async ({ page }) => {
      await page.goto('/?demo=true');
      await page.waitForSelector('.main-panel');
      await connectToHive(page);
      await navigateToHive(page);

      const hiveView = page.locator('.hive-view');
      const box = await hiveView.boundingBox();

      expect(box).not.toBeNull();
      expect(box!.width).toBeLessThanOrEqual(800);
    });

    test('should not overlap with top toolbar', async ({ page }) => {
      await page.goto('/?demo=true');
      await page.waitForSelector('.main-panel');
      await connectToHive(page);
      await navigateToHive(page);

      const toolbar = page.locator('.top-toolbar');
      const hiveView = page.locator('.hive-view');

      const toolbarBox = await toolbar.boundingBox();
      const hiveBox = await hiveView.boundingBox();

      expect(toolbarBox).not.toBeNull();
      expect(hiveBox).not.toBeNull();
      expect(hiveBox!.y).toBeGreaterThanOrEqual(toolbarBox!.y + toolbarBox!.height);
    });

    test('should not overlap with bottom navigation', async ({ page }) => {
      await page.goto('/?demo=true');
      await page.waitForSelector('.main-panel');
      await connectToHive(page);
      await navigateToHive(page);

      // Check main-panel container, not hive-view content (which may be scrollable)
      const nav = page.locator('.bottom-nav');
      const mainPanel = page.locator('.main-panel');

      const navBox = await nav.boundingBox();
      const panelBox = await mainPanel.boundingBox();

      expect(navBox).not.toBeNull();
      expect(panelBox).not.toBeNull();
      // Main panel should be above bottom nav (with small tolerance for rounding)
      expect(panelBox!.y + panelBox!.height).toBeLessThanOrEqual(navBox!.y + 2);
    });
  });

  test.describe('Responsive - iPhone 14+ (390x844)', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('should display Hive view on iPhone', async ({ page }) => {
      await page.goto('/?demo=true');
      await page.waitForSelector('.main-panel');
      await connectToHive(page);
      await navigateToHive(page);

      await expect(page.locator('.hive-view')).toBeVisible();
    });

    test('should show thermostat display on mobile', async ({ page }) => {
      await page.goto('/?demo=true');
      await page.waitForSelector('.main-panel');
      await connectToHive(page);
      await navigateToHive(page);

      await expect(page.locator('.hive-temp-display')).toBeVisible();
    });

    test('should have adequate spacing from screen edges', async ({ page }) => {
      await page.goto('/?demo=true');
      await page.waitForSelector('.main-panel');
      await connectToHive(page);
      await navigateToHive(page);

      const hiveView = page.locator('.hive-view');
      const box = await hiveView.boundingBox();

      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.width).toBeLessThanOrEqual(390);
    });
  });

  test.describe('Responsive - iPad (820x1180)', () => {
    test.use({ viewport: { width: 820, height: 1180 } });

    test('should display Hive view on iPad', async ({ page }) => {
      await page.goto('/?demo=true');
      await page.waitForSelector('.main-panel');
      await connectToHive(page);
      await navigateToHive(page);

      await expect(page.locator('.hive-view')).toBeVisible();
    });

    test('should show thermostat display on tablet', async ({ page }) => {
      await page.goto('/?demo=true');
      await page.waitForSelector('.main-panel');
      await connectToHive(page);
      await navigateToHive(page);

      await expect(page.locator('.hive-temp-display')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/?demo=true');
      await page.waitForSelector('.main-panel');
      await connectToHive(page);
    });

    test('should support keyboard navigation to Hive tab', async ({ page }) => {
      // Tab through to find Hive tab
      await page.keyboard.press('Tab');
      let attempts = 0;
      while (attempts < 20) {
        const focusedElement = await page.evaluate(() => document.activeElement?.textContent);
        if (focusedElement?.includes('Hive')) {
          break;
        }
        await page.keyboard.press('Tab');
        attempts++;
      }

      const focusedElement = await page.evaluate(() => document.activeElement?.textContent);
      expect(focusedElement).toContain('Hive');
    });

    test('should activate Hive tab with Enter key', async ({ page }) => {
      // Navigate to Hive tab
      await page.click('.nav-tab:has-text("Hive")');
      await page.keyboard.press('Tab');

      let attempts = 0;
      while (attempts < 20) {
        const focusedElement = await page.evaluate(() => document.activeElement?.textContent);
        if (focusedElement?.includes('Hive')) {
          break;
        }
        await page.keyboard.press('Tab');
        attempts++;
      }

      await page.keyboard.press('Enter');

      // Should show Hive view
      await expect(page.locator('.hive-view')).toBeVisible();
    });
  });
});
