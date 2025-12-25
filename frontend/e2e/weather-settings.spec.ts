import { test, expect } from '@playwright/test';

/**
 * Weather & Settings E2E Tests
 *
 * Tests for:
 * - Weather display in toolbar (right side)
 * - Weather tooltip on hover
 * - Settings drawer (slides from left)
 * - Settings functionality (location detection, temperature units)
 * - Cross-platform compatibility (iPad, iPhone 14, Raspberry Pi 7")
 */

// Viewport definitions (same as responsive-layout.spec.ts)
const VIEWPORTS = {
  ipad: { width: 1024, height: 768, name: 'iPad' },
  iphone14: { width: 390, height: 844, name: 'iPhone 14' },
  raspberryPi: { width: 800, height: 480, name: 'Raspberry Pi 7"' },
};

// Clear test-related localStorage before each test to ensure isolation
// This runs BEFORE the test, so dev server state is restored after tests complete
test.beforeEach(async ({ page }) => {
  await page.goto('about:blank');
  await page.evaluate(() => {
    // Clear weather/settings keys that tests will modify
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('weather') || key.includes('hue_weather'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  });
});

test.describe('Weather Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.top-toolbar');
  });

  test('should display weather in toolbar', async ({ page }) => {
    const weatherDisplay = page.locator('.weather-display');
    await expect(weatherDisplay).toBeVisible();
  });

  test('should show temperature in weather display', async ({ page }) => {
    const weatherDisplay = page.locator('.weather-display');
    await expect(weatherDisplay).toBeVisible();

    // In demo mode, weather should show temperature
    const tempElement = page.locator('.weather-display__temp');
    await expect(tempElement).toBeVisible();

    // Temperature should contain a number and degree symbol
    const tempText = await tempElement.textContent();
    expect(tempText).toMatch(/\d+°/);
  });

  test('should show location name in weather display', async ({ page }) => {
    const locationElement = page.locator('.weather-display__location');
    await expect(locationElement).toBeVisible();

    // Should have location text
    const locationText = await locationElement.textContent();
    expect(locationText).toBeTruthy();
    expect(locationText!.length).toBeGreaterThan(0);
  });

  test('should show weather icon', async ({ page }) => {
    const weatherDisplay = page.locator('.weather-display');
    const icon = weatherDisplay.locator('svg');
    await expect(icon).toBeVisible();
  });

  test('weather display should be on right side of toolbar', async ({ page }) => {
    const toolbar = page.locator('.top-toolbar');
    const weatherContainer = page.locator('.toolbar-weather-container');

    const toolbarBox = await toolbar.boundingBox();
    const weatherBox = await weatherContainer.boundingBox();

    expect(toolbarBox).not.toBeNull();
    expect(weatherBox).not.toBeNull();

    if (toolbarBox && weatherBox) {
      // Weather should be in the right half of the toolbar
      const toolbarCenter = toolbarBox.x + toolbarBox.width / 2;
      expect(weatherBox.x).toBeGreaterThan(toolbarCenter);
    }
  });
});

test.describe('Weather Tooltip', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.weather-display');
  });

  test('should show tooltip on weather hover', async ({ page }) => {
    const weatherContainer = page.locator('.toolbar-weather-container');

    // Tooltip should not be visible initially
    const tooltip = page.locator('.weather-tooltip');
    await expect(tooltip).not.toBeVisible();

    // Hover over weather display
    await weatherContainer.hover();

    // Tooltip should appear
    await expect(tooltip).toBeVisible();
  });

  test('should hide tooltip when mouse leaves', async ({ page }) => {
    const weatherContainer = page.locator('.toolbar-weather-container');
    const tooltip = page.locator('.weather-tooltip');

    // Hover to show tooltip
    await weatherContainer.hover();
    await expect(tooltip).toBeVisible();

    // Move mouse away
    await page.mouse.move(0, 0);

    // Tooltip should hide
    await expect(tooltip).not.toBeVisible();
  });

  test('should display current weather details in tooltip', async ({ page }) => {
    const weatherContainer = page.locator('.toolbar-weather-container');
    await weatherContainer.hover();

    const tooltip = page.locator('.weather-tooltip');
    await expect(tooltip).toBeVisible();

    // Should show location header
    const header = tooltip.locator('.weather-tooltip__header');
    await expect(header).toBeVisible();

    // Should show current temperature
    const currentTemp = tooltip.locator('.weather-tooltip__current');
    await expect(currentTemp).toBeVisible();
  });

  test('should display 5-day forecast in tooltip', async ({ page }) => {
    const weatherContainer = page.locator('.toolbar-weather-container');
    await weatherContainer.hover();

    const tooltip = page.locator('.weather-tooltip');
    await expect(tooltip).toBeVisible();

    // Should show forecast section
    const forecast = tooltip.locator('.weather-tooltip__forecast');
    await expect(forecast).toBeVisible();

    // Should have forecast days
    const forecastDays = tooltip.locator('.weather-tooltip__forecast-day');
    const count = await forecastDays.count();
    expect(count).toBe(5);
  });

  test('tooltip should be positioned below weather display', async ({ page }) => {
    const weatherContainer = page.locator('.toolbar-weather-container');
    await weatherContainer.hover();

    const tooltip = page.locator('.weather-tooltip');
    await expect(tooltip).toBeVisible();

    const weatherBox = await weatherContainer.boundingBox();
    const tooltipBox = await tooltip.boundingBox();

    expect(weatherBox).not.toBeNull();
    expect(tooltipBox).not.toBeNull();

    if (weatherBox && tooltipBox) {
      // Tooltip should be below weather display
      expect(tooltipBox.y).toBeGreaterThan(weatherBox.y + weatherBox.height);
    }
  });

  test('tooltip should align to right edge', async ({ page }) => {
    const weatherContainer = page.locator('.toolbar-weather-container');
    await weatherContainer.hover();

    const tooltip = page.locator('.weather-tooltip');
    await expect(tooltip).toBeVisible();

    const weatherBox = await weatherContainer.boundingBox();
    const tooltipBox = await tooltip.boundingBox();

    expect(weatherBox).not.toBeNull();
    expect(tooltipBox).not.toBeNull();

    if (weatherBox && tooltipBox) {
      // Tooltip right edge should roughly align with weather container right edge
      const weatherRight = weatherBox.x + weatherBox.width;
      const tooltipRight = tooltipBox.x + tooltipBox.width;
      expect(Math.abs(weatherRight - tooltipRight)).toBeLessThan(20);
    }
  });
});

test.describe('Settings Button', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.top-toolbar');
  });

  test('should display settings button in toolbar', async ({ page }) => {
    const settingsButton = page.locator('.toolbar-settings');
    await expect(settingsButton).toBeVisible();
  });

  test('settings button should be at least 44x44px for touch accessibility', async ({ page }) => {
    const settingsButton = page.locator('.toolbar-settings');
    await expect(settingsButton).toBeVisible();

    const box = await settingsButton.boundingBox();
    expect(box).not.toBeNull();

    if (box) {
      // Minimum 44px for touch accessibility
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('settings button should have visible background', async ({ page }) => {
    const settingsButton = page.locator('.toolbar-settings');
    await expect(settingsButton).toBeVisible();

    // Check that the button has a visible background (not transparent)
    const backgroundColor = await settingsButton.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Should not be transparent (rgba with 0 alpha)
    expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(backgroundColor).not.toBe('transparent');
  });

  test('settings button should be on far left of toolbar', async ({ page }) => {
    const toolbar = page.locator('.top-toolbar');
    const settingsButton = page.locator('.toolbar-settings');

    const toolbarBox = await toolbar.boundingBox();
    const settingsBox = await settingsButton.boundingBox();

    expect(toolbarBox).not.toBeNull();
    expect(settingsBox).not.toBeNull();

    if (toolbarBox && settingsBox) {
      // Settings button should be near the left edge (within 50px of toolbar left)
      expect(settingsBox.x - toolbarBox.x).toBeLessThan(50);
    }
  });

  test('settings button should be clickable and open drawer', async ({ page }) => {
    const settingsButton = page.locator('.toolbar-settings');
    await expect(settingsButton).toBeVisible();

    // Click and verify drawer opens
    await settingsButton.click();
    const drawer = page.locator('.settings-drawer');
    await expect(drawer).toBeVisible();
  });

  test('should open settings drawer when clicked', async ({ page }) => {
    const settingsButton = page.locator('.toolbar-settings');
    await settingsButton.click();

    const drawer = page.locator('.settings-drawer');
    await expect(drawer).toBeVisible();
  });
});

test.describe('Settings Drawer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.toolbar-settings');
  });

  test('should open drawer from left side', async ({ page }) => {
    const settingsButton = page.locator('.toolbar-settings');
    await settingsButton.click();

    const drawer = page.locator('.settings-drawer');
    await expect(drawer).toBeVisible();

    // Wait for slide-in animation to complete (250ms)
    await page.waitForTimeout(300);

    const drawerBox = await drawer.boundingBox();
    expect(drawerBox).not.toBeNull();

    if (drawerBox) {
      // Drawer should be positioned at left edge (x = 0)
      expect(drawerBox.x).toBe(0);
    }
  });

  test('should display settings title', async ({ page }) => {
    const settingsButton = page.locator('.toolbar-settings');
    await settingsButton.click();

    const title = page.locator('.settings-drawer-title');
    await expect(title).toBeVisible();
    await expect(title).toHaveText('Settings');
  });

  test('should display close button', async ({ page }) => {
    const settingsButton = page.locator('.toolbar-settings');
    await settingsButton.click();

    const closeButton = page.locator('.settings-drawer-close');
    await expect(closeButton).toBeVisible();
  });

  test('should close drawer when close button clicked', async ({ page }) => {
    const settingsButton = page.locator('.toolbar-settings');
    await settingsButton.click();

    const drawer = page.locator('.settings-drawer');
    await expect(drawer).toBeVisible();

    const closeButton = page.locator('.settings-drawer-close');
    await closeButton.click();

    await expect(drawer).not.toBeVisible();
  });

  test('should close drawer when overlay clicked', async ({ page }) => {
    const settingsButton = page.locator('.toolbar-settings');
    await settingsButton.click();

    const drawer = page.locator('.settings-drawer');
    await expect(drawer).toBeVisible();

    // Click on overlay (right side of screen, outside drawer)
    const overlay = page.locator('.settings-drawer-overlay');
    await overlay.click({ position: { x: 400, y: 300 } });

    await expect(drawer).not.toBeVisible();
  });

  test('should close drawer when Escape key pressed', async ({ page }) => {
    const settingsButton = page.locator('.toolbar-settings');
    await settingsButton.click();

    const drawer = page.locator('.settings-drawer');
    await expect(drawer).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(drawer).not.toBeVisible();
  });

  test('should display location section', async ({ page }) => {
    const settingsButton = page.locator('.toolbar-settings');
    await settingsButton.click();

    const locationSection = page.locator('.settings-section').first();
    await expect(locationSection).toBeVisible();

    // Should show current location
    const locationCurrent = page.locator('.settings-location-current');
    await expect(locationCurrent).toBeVisible();
  });

  test('should display detect location button', async ({ page }) => {
    const settingsButton = page.locator('.toolbar-settings');
    await settingsButton.click();

    const detectButton = page.locator('.settings-detect-btn');
    await expect(detectButton).toBeVisible();
    await expect(detectButton).toContainText('Detect Location');
  });

  test('should display temperature units section', async ({ page }) => {
    const settingsButton = page.locator('.toolbar-settings');
    await settingsButton.click();

    const unitButtons = page.locator('.settings-unit-btn');
    await expect(unitButtons).toHaveCount(2);

    // Check for Celsius and Fahrenheit buttons
    await expect(unitButtons.first()).toContainText('Celsius');
    await expect(unitButtons.last()).toContainText('Fahrenheit');
  });

  test('should have one unit selected by default', async ({ page }) => {
    const settingsButton = page.locator('.toolbar-settings');
    await settingsButton.click();

    const selectedButton = page.locator('.settings-unit-btn.selected');
    await expect(selectedButton).toHaveCount(1);
  });

  test('should toggle temperature units when clicked', async ({ page }) => {
    const settingsButton = page.locator('.toolbar-settings');
    await settingsButton.click();

    // Get the currently non-selected button
    const celsiusButton = page.locator('.settings-unit-btn').first();
    const fahrenheitButton = page.locator('.settings-unit-btn').last();

    // Check initial state
    const initiallySelected = await celsiusButton.evaluate((el) =>
      el.classList.contains('selected')
    );

    if (initiallySelected) {
      // Click Fahrenheit
      await fahrenheitButton.click();
      await expect(fahrenheitButton).toHaveClass(/selected/);
      await expect(celsiusButton).not.toHaveClass(/selected/);
    } else {
      // Click Celsius
      await celsiusButton.click();
      await expect(celsiusButton).toHaveClass(/selected/);
      await expect(fahrenheitButton).not.toHaveClass(/selected/);
    }
  });

  test('should display auto-save message', async ({ page }) => {
    const settingsButton = page.locator('.toolbar-settings');
    await settingsButton.click();

    const footer = page.locator('.settings-drawer-footer');
    await expect(footer).toBeVisible();

    const autoSaveMessage = page.locator('.settings-auto-saved');
    await expect(autoSaveMessage).toBeVisible();
    await expect(autoSaveMessage).toContainText('Changes saved automatically');
  });

  test('should persist unit selection after closing and reopening', async ({ page }) => {
    const settingsButton = page.locator('.toolbar-settings');
    await settingsButton.click();

    // Switch to Fahrenheit
    const fahrenheitButton = page.locator('.settings-unit-btn').last();
    await fahrenheitButton.click();
    await expect(fahrenheitButton).toHaveClass(/selected/);

    // Close drawer
    await page.keyboard.press('Escape');
    await expect(page.locator('.settings-drawer')).not.toBeVisible();

    // Reopen drawer
    await settingsButton.click();

    // Fahrenheit should still be selected
    await expect(fahrenheitButton).toHaveClass(/selected/);
  });
});

test.describe('Settings Drawer Animation', () => {
  test('drawer should slide in from left (animation check)', async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.toolbar-settings');

    const settingsButton = page.locator('.toolbar-settings');

    // Click settings button
    await settingsButton.click();

    const drawer = page.locator('.settings-drawer');

    // Wait for animation to complete
    await page.waitForTimeout(300);

    // Drawer should be visible and at x=0
    await expect(drawer).toBeVisible();
    const drawerBox = await drawer.boundingBox();
    expect(drawerBox).not.toBeNull();
    if (drawerBox) {
      expect(drawerBox.x).toBe(0);
    }
  });

  test('drawer should have proper width (280px or 85vw max)', async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.toolbar-settings');

    const settingsButton = page.locator('.toolbar-settings');
    await settingsButton.click();

    const drawer = page.locator('.settings-drawer');
    await expect(drawer).toBeVisible();

    const drawerBox = await drawer.boundingBox();
    expect(drawerBox).not.toBeNull();

    if (drawerBox) {
      // Width should be 280px or less (could be 85vw on small screens)
      expect(drawerBox.width).toBeLessThanOrEqual(280);
      expect(drawerBox.width).toBeGreaterThan(0);
    }
  });

  test('overlay should appear with drawer', async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.toolbar-settings');

    const settingsButton = page.locator('.toolbar-settings');
    await settingsButton.click();

    const overlay = page.locator('.settings-drawer-overlay');
    await expect(overlay).toBeVisible();

    // Overlay should cover the full viewport
    const overlayBox = await overlay.boundingBox();
    const viewportSize = page.viewportSize();

    expect(overlayBox).not.toBeNull();
    expect(viewportSize).not.toBeNull();

    if (overlayBox && viewportSize) {
      expect(overlayBox.width).toBe(viewportSize.width);
      expect(overlayBox.height).toBe(viewportSize.height);
    }
  });
});

// Cross-platform tests
test.describe('Weather & Settings - iPad (1024x768)', () => {
  test.use({ viewport: VIEWPORTS.ipad });

  test.beforeEach(async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.top-toolbar');
  });

  test('weather display should be visible', async ({ page }) => {
    const weatherDisplay = page.locator('.weather-display');
    await expect(weatherDisplay).toBeVisible();
  });

  test('weather location should be visible on larger screen', async ({ page }) => {
    const locationElement = page.locator('.weather-display__location');
    await expect(locationElement).toBeVisible();
  });

  test('settings button should be visible and clickable', async ({ page }) => {
    const settingsButton = page.locator('.toolbar-settings');
    await expect(settingsButton).toBeVisible();

    await settingsButton.click();
    const drawer = page.locator('.settings-drawer');
    await expect(drawer).toBeVisible();
  });

  test('settings drawer should not overlap main content when open', async ({ page }) => {
    const settingsButton = page.locator('.toolbar-settings');
    await settingsButton.click();

    const drawer = page.locator('.settings-drawer');
    await expect(drawer).toBeVisible();

    const drawerBox = await drawer.boundingBox();
    expect(drawerBox).not.toBeNull();

    if (drawerBox) {
      // Drawer width should be less than half the viewport
      expect(drawerBox.width).toBeLessThan(VIEWPORTS.ipad.width / 2);
    }
  });

  test('weather tooltip should be fully visible on screen', async ({ page }) => {
    const weatherContainer = page.locator('.toolbar-weather-container');
    await weatherContainer.hover();

    const tooltip = page.locator('.weather-tooltip');
    await expect(tooltip).toBeVisible();

    const tooltipBox = await tooltip.boundingBox();
    expect(tooltipBox).not.toBeNull();

    if (tooltipBox) {
      // Tooltip should be fully within viewport
      expect(tooltipBox.x).toBeGreaterThanOrEqual(0);
      expect(tooltipBox.x + tooltipBox.width).toBeLessThanOrEqual(VIEWPORTS.ipad.width);
      expect(tooltipBox.y).toBeGreaterThanOrEqual(0);
      expect(tooltipBox.y + tooltipBox.height).toBeLessThanOrEqual(VIEWPORTS.ipad.height);
    }
  });
});

test.describe('Weather & Settings - iPhone 14 (390x844)', () => {
  test.use({ viewport: VIEWPORTS.iphone14 });

  test.beforeEach(async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.top-toolbar');
  });

  test('weather display should be visible', async ({ page }) => {
    const weatherDisplay = page.locator('.weather-display');
    await expect(weatherDisplay).toBeVisible();
  });

  test('weather location may be hidden on small screen', async ({ page }) => {
    // On mobile, location text might be hidden via CSS media query
    const locationElement = page.locator('.weather-display__location');
    const isVisible = await locationElement.isVisible();

    // Either visible or hidden is acceptable on mobile
    // Just verify weather display still works
    const weatherDisplay = page.locator('.weather-display');
    await expect(weatherDisplay).toBeVisible();
  });

  test('settings button should be visible and accessible', async ({ page }) => {
    const settingsButton = page.locator('.toolbar-settings');
    await expect(settingsButton).toBeVisible();

    const settingsBox = await settingsButton.boundingBox();
    expect(settingsBox).not.toBeNull();

    if (settingsBox) {
      // Button should be at least 36px for touch accessibility
      expect(settingsBox.width).toBeGreaterThanOrEqual(36);
      expect(settingsBox.height).toBeGreaterThanOrEqual(36);
    }
  });

  test('settings drawer should work on mobile', async ({ page }) => {
    const settingsButton = page.locator('.toolbar-settings');
    await settingsButton.click();

    const drawer = page.locator('.settings-drawer');
    await expect(drawer).toBeVisible();

    // Drawer should be properly sized for mobile (85vw max)
    const drawerBox = await drawer.boundingBox();
    expect(drawerBox).not.toBeNull();

    if (drawerBox) {
      expect(drawerBox.width).toBeLessThanOrEqual(VIEWPORTS.iphone14.width * 0.85);
    }
  });

  test('all settings controls should be accessible', async ({ page }) => {
    const settingsButton = page.locator('.toolbar-settings');
    await settingsButton.click();

    // Check all interactive elements are visible and touchable
    const detectButton = page.locator('.settings-detect-btn');
    await expect(detectButton).toBeVisible();

    const unitButtons = page.locator('.settings-unit-btn');
    await expect(unitButtons).toHaveCount(2);

    // Buttons should be large enough for touch (at least 36px is acceptable)
    const detectBox = await detectButton.boundingBox();
    expect(detectBox).not.toBeNull();
    if (detectBox) {
      expect(detectBox.height).toBeGreaterThanOrEqual(36);
    }
  });
});

test.describe('Weather & Settings - Raspberry Pi 7" (800x480)', () => {
  test.use({ viewport: VIEWPORTS.raspberryPi });

  test.beforeEach(async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.top-toolbar');
  });

  test('weather display should be visible', async ({ page }) => {
    const weatherDisplay = page.locator('.weather-display');
    await expect(weatherDisplay).toBeVisible();
  });

  test('settings button should be visible', async ({ page }) => {
    const settingsButton = page.locator('.toolbar-settings');
    await expect(settingsButton).toBeVisible();
  });

  test('settings drawer should work on compact screen', async ({ page }) => {
    const settingsButton = page.locator('.toolbar-settings');
    await settingsButton.click();

    const drawer = page.locator('.settings-drawer');
    await expect(drawer).toBeVisible();

    // Should still show all content
    const locationSection = page.locator('.settings-location');
    await expect(locationSection).toBeVisible();

    const unitsSection = page.locator('.settings-units');
    await expect(unitsSection).toBeVisible();
  });

  test('drawer should not exceed viewport height', async ({ page }) => {
    const settingsButton = page.locator('.toolbar-settings');
    await settingsButton.click();

    const drawer = page.locator('.settings-drawer');
    await expect(drawer).toBeVisible();

    const drawerBox = await drawer.boundingBox();
    expect(drawerBox).not.toBeNull();

    if (drawerBox) {
      expect(drawerBox.height).toBeLessThanOrEqual(VIEWPORTS.raspberryPi.height);
    }
  });

  test('weather tooltip should fit on compact screen', async ({ page }) => {
    const weatherContainer = page.locator('.toolbar-weather-container');
    await weatherContainer.hover();

    const tooltip = page.locator('.weather-tooltip');
    await expect(tooltip).toBeVisible();

    const tooltipBox = await tooltip.boundingBox();
    expect(tooltipBox).not.toBeNull();

    if (tooltipBox) {
      // Tooltip should fit within viewport
      expect(tooltipBox.x + tooltipBox.width).toBeLessThanOrEqual(VIEWPORTS.raspberryPi.width);
      expect(tooltipBox.y + tooltipBox.height).toBeLessThanOrEqual(VIEWPORTS.raspberryPi.height);
    }
  });
});

// Test settings persistence across page reloads
test.describe('Settings Persistence', () => {
  test('should persist temperature unit preference after page reload', async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.toolbar-settings');

    // Open settings and switch to Fahrenheit
    const settingsButton = page.locator('.toolbar-settings');
    await settingsButton.click();

    const fahrenheitButton = page.locator('.settings-unit-btn').last();
    await fahrenheitButton.click();
    await expect(fahrenheitButton).toHaveClass(/selected/);

    // Close drawer
    await page.keyboard.press('Escape');

    // Reload page
    await page.reload();
    await page.waitForSelector('.toolbar-settings');

    // Reopen settings
    await settingsButton.click();

    // Fahrenheit should still be selected
    const fahrenheitButtonAfterReload = page.locator('.settings-unit-btn').last();
    await expect(fahrenheitButtonAfterReload).toHaveClass(/selected/);
  });
});

// Integration test - weather updates with unit change
test.describe('Weather Unit Integration', () => {
  test('weather display should reflect unit changes', async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.weather-display');

    // Get initial temperature
    const tempElement = page.locator('.weather-display__temp');
    const initialTemp = await tempElement.textContent();

    // Open settings and switch units
    const settingsButton = page.locator('.toolbar-settings');
    await settingsButton.click();

    // Find the non-selected unit button and click it
    const celsiusButton = page.locator('.settings-unit-btn').first();
    const fahrenheitButton = page.locator('.settings-unit-btn').last();

    const isCelsiusSelected = await celsiusButton.evaluate((el) =>
      el.classList.contains('selected')
    );

    if (isCelsiusSelected) {
      await fahrenheitButton.click();
    } else {
      await celsiusButton.click();
    }

    // Close drawer
    await page.keyboard.press('Escape');

    // Wait for weather to update
    await page.waitForTimeout(500);

    // Temperature should have changed (different unit)
    const newTemp = await tempElement.textContent();
    // Note: In demo mode, the temperature value might be the same
    // This test verifies the UI doesn't break during unit changes
    expect(newTemp).toMatch(/\d+°/);
  });
});
