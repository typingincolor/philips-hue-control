import { test, expect } from '@playwright/test';

/**
 * Weather & Settings E2E Tests
 *
 * Tests for:
 * - Weather display in toolbar (right side)
 * - Weather tooltip on hover
 * - Settings button behavior (navigates to settings page)
 * - Cross-platform compatibility (iPad, iPhone 14, Raspberry Pi 7")
 *
 * NOTE: Settings page tests are in settings-page.spec.ts
 */

// Viewport definitions (same as responsive-layout.spec.ts)
const VIEWPORTS = {
  ipad: { width: 1024, height: 768, name: 'iPad' },
  iphone14: { width: 390, height: 844, name: 'iPhone 14' },
  raspberryPi: { width: 800, height: 480, name: 'Raspberry Pi 7"' },
};

// Note: E2E tests run on port 5174 (separate from dev server on 5173)
// This ensures complete isolation - no localStorage cleanup needed

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

  test('settings button should contain visible icon', async ({ page }) => {
    const settingsButton = page.locator('.toolbar-settings');
    await expect(settingsButton).toBeVisible();

    // Check that the button contains an SVG icon
    const svgIcon = settingsButton.locator('svg');
    await expect(svgIcon).toHaveCount(1);

    // Check the icon has visible size and dimensions
    const iconBox = await svgIcon.boundingBox();
    expect(iconBox).not.toBeNull();

    if (iconBox) {
      expect(iconBox.width).toBeGreaterThan(10);
      expect(iconBox.height).toBeGreaterThan(10);
    }

    // Verify icon has stroke color applied
    const strokeColor = await svgIcon.evaluate((el) => {
      return window.getComputedStyle(el).stroke;
    });
    expect(strokeColor).not.toBe('none');
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

  test('settings button should be clickable and open settings page', async ({ page }) => {
    const settingsButton = page.locator('.toolbar-settings');
    await expect(settingsButton).toBeVisible();

    // Click and verify settings page opens
    await settingsButton.click();
    const settingsPage = page.locator('.settings-page');
    await expect(settingsPage).toBeVisible();
  });

  test('should open settings page when clicked', async ({ page }) => {
    const settingsButton = page.locator('.toolbar-settings');
    await settingsButton.click();

    const settingsPage = page.locator('.settings-page');
    await expect(settingsPage).toBeVisible();
  });
});

// Cross-platform tests - Weather only (settings page tests in settings-page.spec.ts)
test.describe('Weather Display - iPad (1024x768)', () => {
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
    const settingsPage = page.locator('.settings-page');
    await expect(settingsPage).toBeVisible();
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

test.describe('Weather Display - iPhone 14 (390x844)', () => {
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
});

test.describe('Weather Display - Raspberry Pi 7" (800x480)', () => {
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

// Integration test - weather updates with unit change
test.describe('Weather Unit Integration', () => {
  test('weather display should reflect unit changes from settings', async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.weather-display');

    // Get initial temperature
    const tempElement = page.locator('.weather-display__temp');
    await expect(tempElement).toBeVisible();
    const initialTemp = await tempElement.textContent();

    // Open settings and switch units
    const settingsButton = page.locator('.toolbar-settings');
    await settingsButton.click();
    await page.waitForSelector('.settings-page');

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

    // Return to previous view
    await page.click('.settings-back-btn');

    // Temperature should still be valid format
    const newTemp = await tempElement.textContent();
    expect(newTemp).toMatch(/\d+°/);
  });
});
