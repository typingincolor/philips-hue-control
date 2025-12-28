import { test, expect, Page } from '@playwright/test';

/**
 * Settings Page E2E Tests
 *
 * Tests for:
 * - Settings page navigation (open/close)
 * - Weather location configuration
 * - Temperature unit selection
 * - Service activation toggles (Hue/Hive)
 * - Conditional bottom nav based on service state
 * - Navigation persistence across refresh
 * - Platform-specific layouts
 *
 * NOTE: Weather display tests are in weather-settings.spec.ts
 */

// Viewport definitions for target platforms
const VIEWPORTS = {
  raspberryPi: { width: 800, height: 480, name: 'Raspberry Pi 7"' },
  iphone14: { width: 390, height: 844, name: 'iPhone 14+' },
  ipad: { width: 820, height: 1180, name: 'iPad' },
};

// Helper to navigate to settings page
async function openSettings(page: Page) {
  await page.click('[aria-label="settings"]');
  await page.waitForSelector('.settings-page');
}

// Helper to close settings and return to previous view
async function closeSettings(page: Page) {
  await page.click('.settings-back-btn');
  await page.waitForSelector('.settings-page', { state: 'hidden' });
}

test.describe('Settings Page - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.main-panel');
  });

  test('should open settings page when gear icon clicked', async ({ page }) => {
    await page.click('[aria-label="settings"]');
    await expect(page.locator('.settings-page')).toBeVisible();
  });

  test('should display Settings title in header', async ({ page }) => {
    await openSettings(page);
    await expect(page.locator('.settings-header-title')).toHaveText('Settings');
  });

  test('should show back button in settings header', async ({ page }) => {
    await openSettings(page);
    await expect(page.locator('.settings-back-btn')).toBeVisible();
  });

  test('should return to previous view when back button clicked', async ({ page }) => {
    // Start on first room
    const firstRoomTab = page.locator('.nav-tab').first();
    await firstRoomTab.click();
    await page.waitForSelector('.room-content');

    // Open settings
    await openSettings(page);

    // Go back
    await closeSettings(page);

    // Should be back on room view
    await expect(page.locator('.room-content')).toBeVisible();
  });

  // TODO: Implement gear icon toggle behavior (currently always opens settings)
  test.skip('should return to previous view when gear icon clicked again', async ({ page }) => {
    // Navigate to Hive tab first
    await page.click('.nav-tab:has-text("Hive")');
    await page.waitForSelector('.hive-view');

    // Open settings
    await openSettings(page);

    // Click gear icon again
    await page.click('[aria-label="settings"]');

    // Should be back on Hive view
    await expect(page.locator('.hive-view')).toBeVisible();
  });

  test('should not show settings as a tab in bottom nav', async ({ page }) => {
    await openSettings(page);
    await expect(page.locator('.nav-tab:has-text("Settings")')).not.toBeVisible();
  });

  test('escape key should close settings and return to previous view', async ({ page }) => {
    await openSettings(page);
    await page.keyboard.press('Escape');
    await expect(page.locator('.settings-page')).not.toBeVisible();
  });
});

test.describe('Settings Page - Location Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.main-panel');
    await openSettings(page);
  });

  test('should display location section with label', async ({ page }) => {
    await expect(page.locator('.settings-section-label:has-text("Location")')).toBeVisible();
  });

  test('should show current location when set', async ({ page }) => {
    // Demo mode has a preset location
    const locationDisplay = page.locator('.settings-location-current');
    await expect(locationDisplay).toBeVisible();
    const text = await locationDisplay.textContent();
    expect(text?.length).toBeGreaterThan(0);
  });

  test('should show detect location button', async ({ page }) => {
    const detectBtn = page.locator('.settings-detect-btn');
    await expect(detectBtn).toBeVisible();
    await expect(detectBtn).toContainText(/Detect/i);
  });

  test('should show detecting state when location button clicked', async ({ page }) => {
    // Mock geolocation
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: 51.5074, longitude: -0.1278 });

    const detectBtn = page.locator('.settings-detect-btn');
    await detectBtn.click();

    // Should show detecting state
    await expect(detectBtn).toContainText(/Detecting/i);
  });
});

test.describe('Settings Page - Temperature Units', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.main-panel');
    await openSettings(page);
  });

  test('should display temperature units section', async ({ page }) => {
    await expect(page.locator('.settings-section-label:has-text("Temperature")')).toBeVisible();
  });

  test('should show celsius and fahrenheit options', async ({ page }) => {
    await expect(page.locator('.settings-unit-btn:has-text("Celsius")')).toBeVisible();
    await expect(page.locator('.settings-unit-btn:has-text("Fahrenheit")')).toBeVisible();
  });

  test('should have one unit selected by default', async ({ page }) => {
    const selectedUnit = page.locator('.settings-unit-btn.selected');
    await expect(selectedUnit).toBeVisible();
    const count = await selectedUnit.count();
    expect(count).toBe(1);
  });

  test('should toggle unit selection when clicked', async ({ page }) => {
    const unselectedUnit = page.locator('.settings-unit-btn:not(.selected)');
    const initialText = await unselectedUnit.textContent();

    await unselectedUnit.click();

    // Should now be selected
    await expect(
      page.locator(`.settings-unit-btn.selected:has-text("${initialText}")`)
    ).toBeVisible();
  });

  test('should persist unit selection after closing and reopening', async ({ page }) => {
    // Select Fahrenheit
    await page.click('.settings-unit-btn:has-text("Fahrenheit")');
    await expect(page.locator('.settings-unit-btn:has-text("Fahrenheit")')).toHaveClass(/selected/);

    // Close settings
    await closeSettings(page);

    // Re-open settings
    await openSettings(page);

    // Fahrenheit should still be selected
    await expect(page.locator('.settings-unit-btn:has-text("Fahrenheit")')).toHaveClass(/selected/);
  });
});

test.describe('Settings Page - Service Activation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.main-panel');
    await openSettings(page);
  });

  test('should display services section', async ({ page }) => {
    await expect(page.locator('.settings-section-label:has-text("Services")')).toBeVisible();
  });

  test('should show Hue service toggle', async ({ page }) => {
    await expect(page.locator('.service-toggle:has-text("Hue")')).toBeVisible();
  });

  test('should show Hive service toggle', async ({ page }) => {
    await expect(page.locator('.service-toggle:has-text("Hive")')).toBeVisible();
  });

  test('should have both services enabled by default in demo mode', async ({ page }) => {
    const hueToggle = page.locator('.service-toggle:has-text("Hue") input[type="checkbox"]');
    const hiveToggle = page.locator('.service-toggle:has-text("Hive") input[type="checkbox"]');

    await expect(hueToggle).toBeChecked();
    await expect(hiveToggle).toBeChecked();
  });
});

test.describe('Settings Page - Conditional Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.main-panel');
  });

  test('should hide room tabs when Hue disabled', async ({ page }) => {
    // Verify rooms are visible first
    const roomTabs = page.locator('.nav-tab').first();
    await expect(roomTabs).toBeVisible();

    // Disable Hue
    await openSettings(page);
    // Click on the label wrapper (checkbox is visually hidden)
    await page.click('.service-toggle:has-text("Hue")');
    await closeSettings(page);

    // Room tabs should not be visible (only Hive remains if enabled)
    // Check that no room-specific tabs exist
    const hiveTab = page.locator('.nav-tab:has-text("Hive")');
    await expect(hiveTab).toBeVisible();

    // Should not have room tabs (rooms have icons, not "Hive" text)
    const roomCount = await page.locator('.nav-tab:not(:has-text("Hive"))').count();
    expect(roomCount).toBe(0);
  });

  test('should hide Hive tab when Hive disabled', async ({ page }) => {
    // Verify Hive tab visible first
    await expect(page.locator('.nav-tab:has-text("Hive")')).toBeVisible();

    // Disable Hive
    await openSettings(page);
    await page.click('.service-toggle:has-text("Hive")');
    await closeSettings(page);

    // Hive tab should be hidden
    await expect(page.locator('.nav-tab:has-text("Hive")')).not.toBeVisible();
  });

  // TODO: Needs settings reset API to ensure fresh state
  // Previous tests modify backend settings state which persists across page loads
  test.skip('should hide Zones tab when Hue disabled', async ({ page }) => {
    // Zones should be visible when Hue enabled
    await expect(page.locator('.nav-tab:has-text("Zones")')).toBeVisible();

    // Disable Hue
    await openSettings(page);
    await page.click('.service-toggle:has-text("Hue")');
    await closeSettings(page);

    // Zones should be hidden
    await expect(page.locator('.nav-tab:has-text("Zones")')).not.toBeVisible();
  });

  // TODO: Needs settings reset API to ensure fresh state
  test.skip('should hide Automations tab when Hue disabled', async ({ page }) => {
    // Automations should be visible when Hue enabled
    await expect(page.locator('.nav-tab:has-text("Automations")')).toBeVisible();

    // Disable Hue
    await openSettings(page);
    await page.click('.service-toggle:has-text("Hue")');
    await closeSettings(page);

    // Automations should be hidden
    await expect(page.locator('.nav-tab:has-text("Automations")')).not.toBeVisible();
  });

  // TODO: Needs settings reset API to ensure fresh state
  test.skip('should stay on settings when all services disabled', async ({ page }) => {
    await openSettings(page);

    // Disable both services (click on label wrappers)
    await page.click('.service-toggle:has-text("Hue")');
    await page.click('.service-toggle:has-text("Hive")');

    // Should stay on settings page (no other view available)
    await expect(page.locator('.settings-page')).toBeVisible();

    // Bottom nav should have no tabs
    const navTabs = page.locator('.nav-tab');
    const count = await navTabs.count();
    expect(count).toBe(0);
  });

  // TODO: Needs settings reset API and redirect implementation
  test.skip('should redirect when disabling current service view', async ({ page }) => {
    // Navigate to Hive
    await page.click('.nav-tab:has-text("Hive")');
    await page.waitForSelector('.hive-view');

    // Disable Hive but keep Hue enabled
    await openSettings(page);
    await page.click('.service-toggle:has-text("Hive")');

    // Close settings - should redirect to Hue (first enabled service)
    await closeSettings(page);
    await expect(page.locator('.room-content')).toBeVisible();
  });
});

test.describe('Settings Page - Service Status Indicator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.main-panel');
  });

  test('should show connected status for connected services', async ({ page }) => {
    await openSettings(page);

    // In demo mode, services should show connected status
    const hueStatus = page.locator('.service-toggle:has-text("Hue") .service-status');
    await expect(hueStatus).toBeVisible();
    await expect(hueStatus).toHaveClass(/connected/);
  });

  // TODO: Needs settings reset API to ensure fresh state from previous tests
  test.skip('should show warning badge on nav for enabled but disconnected service', async ({
    page,
  }) => {
    // In demo mode, services are connected so no warning badge
    const hiveTab = page.locator('.nav-tab:has-text("Hive")');
    await expect(hiveTab).toBeVisible();
    await expect(hiveTab).not.toHaveClass(/needs-auth/);
  });
});

test.describe('Settings Page - Navigation Persistence', () => {
  // TODO: Needs settings reset API to ensure fresh state from previous tests
  test.skip('should preserve selected tab across page refresh', async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.main-panel');

    // Navigate to Hive tab
    await page.click('.nav-tab:has-text("Hive")');
    await page.waitForSelector('.hive-view');

    // Refresh page
    await page.reload();
    await page.waitForSelector('.main-panel');

    // Should still be on Hive view
    await expect(page.locator('.hive-view')).toBeVisible();
    await expect(page.locator('.nav-tab:has-text("Hive")')).toHaveClass(/active/);
  });

  test('should not persist settings page as selected view', async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.main-panel');

    // Open settings
    await openSettings(page);

    // Refresh page
    await page.reload();
    await page.waitForSelector('.main-panel');

    // Should not be on settings page
    await expect(page.locator('.settings-page')).not.toBeVisible();
  });
});

test.describe('Settings Page - Auto Save', () => {
  test('should display auto-saved message in footer', async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.main-panel');
    await openSettings(page);

    await expect(page.locator('.settings-footer')).toContainText(/saved automatically/i);
  });
});

test.describe('Settings Page - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.main-panel');
    await openSettings(page);
  });

  test('back button should have aria-label', async ({ page }) => {
    const backBtn = page.locator('.settings-back-btn');
    await expect(backBtn).toHaveAttribute('aria-label');
  });

  // TODO: Focus order depends on DOM order which may vary; need to implement proper tab order
  test.skip('should support keyboard navigation through interactive elements', async ({ page }) => {
    // Tab to back button
    await page.keyboard.press('Tab');
    const backBtn = page.locator('.settings-back-btn');
    await expect(backBtn).toBeFocused();

    // Tab to detect location button
    await page.keyboard.press('Tab');
    const detectBtn = page.locator('.settings-detect-btn');
    await expect(detectBtn).toBeFocused();
  });
});

// Platform-specific tests
test.describe('Settings Page - Raspberry Pi (800x480)', () => {
  test.use({ viewport: VIEWPORTS.raspberryPi });

  test('should display settings page on compact screen', async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.main-panel');
    await openSettings(page);

    await expect(page.locator('.settings-page')).toBeVisible();
  });

  test('buttons should have minimum 44px touch targets', async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.main-panel');
    await openSettings(page);

    const detectBtn = page.locator('.settings-detect-btn');
    const box = await detectBtn.boundingBox();

    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test('should fit within viewport without horizontal scroll', async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.main-panel');
    await openSettings(page);

    const settingsPage = page.locator('.settings-page');
    const box = await settingsPage.boundingBox();

    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(800);
  });
});

test.describe('Settings Page - iPhone 14+ (390x844)', () => {
  test.use({ viewport: VIEWPORTS.iphone14 });

  test('should display settings page on mobile', async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.main-panel');
    await openSettings(page);

    await expect(page.locator('.settings-page')).toBeVisible();
  });

  test('sections should be full width on mobile', async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.main-panel');
    await openSettings(page);

    const section = page.locator('.settings-section').first();
    const box = await section.boundingBox();

    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(350);
  });

  test('toggles should be easily tappable on mobile', async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.main-panel');
    await openSettings(page);

    const toggle = page.locator('.service-toggle').first();
    const box = await toggle.boundingBox();

    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });
});

test.describe('Settings Page - iPad (820x1180)', () => {
  test.use({ viewport: VIEWPORTS.ipad });

  test('should display settings page on tablet', async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.main-panel');
    await openSettings(page);

    await expect(page.locator('.settings-page')).toBeVisible();
  });

  test('should center content on tablet', async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.main-panel');
    await openSettings(page);

    const content = page.locator('.settings-content');
    const box = await content.boundingBox();

    expect(box).not.toBeNull();
    // Content should be centered with margin on sides
    expect(box!.x).toBeGreaterThan(50);
  });
});
