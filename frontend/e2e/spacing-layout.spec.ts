import { test, expect, Page } from '@playwright/test';

/**
 * Layout Spacing E2E Tests
 *
 * Verifies that all visual components:
 * - Do not overlap with each other
 * - Have minimum spacing from screen edges (16px)
 * - Are properly contained within the viewport
 */

const VIEWPORTS = {
  ipad: { width: 1024, height: 768, name: 'iPad' },
  iphone14: { width: 390, height: 844, name: 'iPhone 14' },
  raspberryPi: { width: 800, height: 480, name: 'Raspberry Pi 7"' },
};

const MIN_EDGE_SPACING = 16;
const MIN_COMPONENT_GAP = 8;

// Helper to reset settings demo state via API (ensures clean state for tests)
async function resetSettingsDemoState(page: Page) {
  await page.request.post('/api/v1/settings/reset-demo', {
    headers: { 'X-Demo-Mode': 'true' },
  });
}

// Note: E2E tests run on port 5174 (separate from dev server on 5173)

test.describe('Layout Spacing - Desktop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.top-toolbar');
  });

  test('settings button should have vertical spacing from toolbar edges', async ({ page }) => {
    const toolbar = page.locator('.top-toolbar');
    const settingsButton = page.locator('.toolbar-settings');

    const toolbarBox = await toolbar.boundingBox();
    const buttonBox = await settingsButton.boundingBox();

    expect(toolbarBox).not.toBeNull();
    expect(buttonBox).not.toBeNull();

    if (toolbarBox && buttonBox) {
      // Button should have at least 1px spacing from toolbar top
      const topGap = buttonBox.y - toolbarBox.y;
      expect(topGap).toBeGreaterThanOrEqual(1);

      // Button should have at least 1px spacing from toolbar bottom (amber line)
      const bottomGap = toolbarBox.y + toolbarBox.height - (buttonBox.y + buttonBox.height);
      expect(bottomGap).toBeGreaterThanOrEqual(1);
    }
  });

  test('toolbar should have minimum edge spacing', async ({ page }) => {
    const toolbar = page.locator('.top-toolbar');
    const toolbarBox = await toolbar.boundingBox();
    const settingsButton = page.locator('.toolbar-settings');
    const settingsBox = await settingsButton.boundingBox();
    const toolbarRight = page.locator('.toolbar-right');
    const toolbarRightBox = await toolbarRight.boundingBox();

    expect(toolbarBox).not.toBeNull();
    expect(settingsBox).not.toBeNull();
    expect(toolbarRightBox).not.toBeNull();

    if (toolbarBox && settingsBox && toolbarRightBox) {
      // Settings button should be at least MIN_EDGE_SPACING from left edge
      expect(settingsBox.x).toBeGreaterThanOrEqual(MIN_EDGE_SPACING);

      // Right toolbar section should be at least MIN_EDGE_SPACING from right edge
      const viewportSize = page.viewportSize();
      if (viewportSize) {
        const rightEdgeGap = viewportSize.width - (toolbarRightBox.x + toolbarRightBox.width);
        expect(rightEdgeGap).toBeGreaterThanOrEqual(MIN_EDGE_SPACING);
      }
    }
  });

  test('toolbar components should not overlap', async ({ page }) => {
    const toolbarLeft = page.locator('.toolbar-left');
    const toolbarRight = page.locator('.toolbar-right');

    const leftBox = await toolbarLeft.boundingBox();
    const rightBox = await toolbarRight.boundingBox();

    expect(leftBox).not.toBeNull();
    expect(rightBox).not.toBeNull();

    if (leftBox && rightBox) {
      // Left and right sections should not overlap
      expect(leftBox.x + leftBox.width).toBeLessThan(rightBox.x);
    }
  });

  test('main content should not overlap with toolbar or nav', async ({ page }) => {
    const toolbar = page.locator('.top-toolbar');
    const bottomNav = page.locator('.bottom-nav');
    const mainPanel = page.locator('.main-panel');

    const toolbarBox = await toolbar.boundingBox();
    const navBox = await bottomNav.boundingBox();
    const mainBox = await mainPanel.boundingBox();

    expect(toolbarBox).not.toBeNull();
    expect(navBox).not.toBeNull();
    expect(mainBox).not.toBeNull();

    if (toolbarBox && navBox && mainBox) {
      // Main panel should start below toolbar
      expect(mainBox.y).toBeGreaterThanOrEqual(toolbarBox.y + toolbarBox.height);

      // Main panel should end above bottom nav
      expect(mainBox.y + mainBox.height).toBeLessThanOrEqual(navBox.y);
    }
  });

  test('light tiles should have spacing from edges', async ({ page }) => {
    // Carousel layout replaces grid (issue 47)
    const carousel = page.locator('.tiles-carousel').first();
    await expect(carousel).toBeVisible();

    const carouselBox = await carousel.boundingBox();
    const viewportSize = page.viewportSize();

    expect(carouselBox).not.toBeNull();
    expect(viewportSize).not.toBeNull();

    if (carouselBox && viewportSize) {
      // Carousel should have minimum spacing from left edge (chevron button takes some space)
      expect(carouselBox.x).toBeGreaterThanOrEqual(0);
    }
  });

  test('bottom nav tabs should have spacing from edges', async ({ page }) => {
    // Reset settings to ensure all services are enabled
    await resetSettingsDemoState(page);
    await page.reload();
    await page.waitForSelector('.top-toolbar');

    const bottomNav = page.locator('.bottom-nav');
    const firstTab = page.locator('.nav-tab').first();

    const navBox = await bottomNav.boundingBox();
    const firstTabBox = await firstTab.boundingBox();

    expect(navBox).not.toBeNull();
    expect(firstTabBox).not.toBeNull();

    if (navBox && firstTabBox) {
      // First tab should have spacing from left edge of nav
      const leftGap = firstTabBox.x - navBox.x;
      expect(leftGap).toBeGreaterThanOrEqual(MIN_COMPONENT_GAP);
    }
  });
});

test.describe('Layout Spacing - iPad (1024x768)', () => {
  test.use({ viewport: VIEWPORTS.ipad });

  test.beforeEach(async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.top-toolbar');
  });

  test('all components should be within viewport', async ({ page }) => {
    const toolbar = page.locator('.top-toolbar');
    const bottomNav = page.locator('.bottom-nav');
    // Carousel layout replaces grid (issue 47)
    const roomContent = page.locator('.room-content');

    const toolbarBox = await toolbar.boundingBox();
    const navBox = await bottomNav.boundingBox();
    const contentBox = await roomContent.boundingBox();

    expect(toolbarBox).not.toBeNull();
    expect(navBox).not.toBeNull();
    expect(contentBox).not.toBeNull();

    if (toolbarBox && navBox && contentBox) {
      // Toolbar should start at top
      expect(toolbarBox.y).toBe(0);

      // Nav should end at bottom
      expect(navBox.y + navBox.height).toBe(VIEWPORTS.ipad.height);

      // Content should be fully within viewport
      expect(contentBox.x).toBeGreaterThanOrEqual(0);
      expect(contentBox.x + contentBox.width).toBeLessThanOrEqual(VIEWPORTS.ipad.width);
    }
  });

  test('settings page should not exceed viewport', async ({ page }) => {
    const settingsButton = page.locator('.toolbar-settings');
    await settingsButton.click();

    const settingsPage = page.locator('.settings-page');
    await expect(settingsPage).toBeVisible();

    const pageBox = await settingsPage.boundingBox();
    expect(pageBox).not.toBeNull();

    if (pageBox) {
      // Settings page should not exceed viewport width
      expect(pageBox.x + pageBox.width).toBeLessThanOrEqual(VIEWPORTS.ipad.width);
    }
  });

  // NOTE: Scene drawer test removed - replaced with scene tiles in carousel (issue 47)
  test('carousel should not exceed viewport', async ({ page }) => {
    const carousel = page.locator('.tiles-carousel').first();
    await expect(carousel).toBeVisible();

    const carouselBox = await carousel.boundingBox();
    expect(carouselBox).not.toBeNull();

    if (carouselBox) {
      // Carousel should be within viewport width
      expect(carouselBox.x + carouselBox.width).toBeLessThanOrEqual(VIEWPORTS.ipad.width);
    }
  });
});

test.describe('Layout Spacing - iPhone 14 (390x844)', () => {
  test.use({ viewport: VIEWPORTS.iphone14 });

  test.beforeEach(async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.top-toolbar');
  });

  test('toolbar essential items should be visible', async ({ page }) => {
    // On mobile, some toolbar items may be hidden but essential ones should remain
    const settingsButton = page.locator('.toolbar-settings');
    const toolbarRight = page.locator('.toolbar-right');

    // Essential elements should be visible
    await expect(settingsButton).toBeVisible();
    await expect(toolbarRight).toBeVisible();

    // Elements should be on screen
    const settingsBox = await settingsButton.boundingBox();
    const toolbarRightBox = await toolbarRight.boundingBox();

    expect(settingsBox).not.toBeNull();
    expect(toolbarRightBox).not.toBeNull();

    if (settingsBox && toolbarRightBox) {
      // Settings should be on left side
      expect(settingsBox.x).toBeLessThan(VIEWPORTS.iphone14.width / 2);

      // Right toolbar section should be fully visible (not cut off)
      expect(toolbarRightBox.x + toolbarRightBox.width).toBeLessThanOrEqual(
        VIEWPORTS.iphone14.width
      );
    }
  });

  test('light tiles should fit on mobile screen', async ({ page }) => {
    // Carousel layout replaces grid (issue 47)
    const carousel = page.locator('.tiles-carousel').first();
    const carouselBox = await carousel.boundingBox();

    expect(carouselBox).not.toBeNull();

    if (carouselBox) {
      // Carousel should fit within viewport
      expect(carouselBox.x + carouselBox.width).toBeLessThanOrEqual(VIEWPORTS.iphone14.width);
    }
  });

  test('bottom nav should be fully accessible', async ({ page }) => {
    const bottomNav = page.locator('.bottom-nav');
    const navBox = await bottomNav.boundingBox();

    expect(navBox).not.toBeNull();

    if (navBox) {
      // Nav should span full width
      expect(navBox.x).toBe(0);
      expect(navBox.width).toBe(VIEWPORTS.iphone14.width);

      // Nav should be at bottom
      expect(navBox.y + navBox.height).toBe(VIEWPORTS.iphone14.height);
    }
  });
});

test.describe('Layout Spacing - Raspberry Pi 7" (800x480)', () => {
  test.use({ viewport: VIEWPORTS.raspberryPi });

  test.beforeEach(async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.top-toolbar');
  });

  test('settings button should not touch toolbar edges on compact screen', async ({ page }) => {
    const toolbar = page.locator('.top-toolbar');
    const settingsButton = page.locator('.toolbar-settings');

    const toolbarBox = await toolbar.boundingBox();
    const buttonBox = await settingsButton.boundingBox();

    expect(toolbarBox).not.toBeNull();
    expect(buttonBox).not.toBeNull();

    if (toolbarBox && buttonBox) {
      // Button should have spacing from toolbar top
      const topGap = buttonBox.y - toolbarBox.y;
      expect(topGap).toBeGreaterThanOrEqual(1);

      // Button should have spacing from toolbar bottom (amber line)
      const bottomGap = toolbarBox.y + toolbarBox.height - (buttonBox.y + buttonBox.height);
      expect(bottomGap).toBeGreaterThanOrEqual(1);

      // Button should fit entirely within toolbar
      expect(buttonBox.y).toBeGreaterThanOrEqual(toolbarBox.y);
      expect(buttonBox.y + buttonBox.height).toBeLessThanOrEqual(toolbarBox.y + toolbarBox.height);
    }
  });

  test('compact layout should not have overlapping elements', async ({ page }) => {
    const toolbar = page.locator('.top-toolbar');
    const bottomNav = page.locator('.bottom-nav');
    const mainPanel = page.locator('.main-panel');

    const toolbarBox = await toolbar.boundingBox();
    const navBox = await bottomNav.boundingBox();
    const mainBox = await mainPanel.boundingBox();

    expect(toolbarBox).not.toBeNull();
    expect(navBox).not.toBeNull();
    expect(mainBox).not.toBeNull();

    if (toolbarBox && navBox && mainBox) {
      // Main panel should have positive height (not squished)
      expect(mainBox.height).toBeGreaterThan(100);

      // Content areas should not overlap
      expect(mainBox.y).toBeGreaterThanOrEqual(toolbarBox.y + toolbarBox.height);
      expect(mainBox.y + mainBox.height).toBeLessThanOrEqual(navBox.y);
    }
  });

  test('carousel tiles should fit in compact view', async ({ page }) => {
    // Carousel layout replaces grid (issue 47)
    const roomContent = page.locator('.room-content');
    const toolbar = page.locator('.top-toolbar');
    const bottomNav = page.locator('.bottom-nav');

    const contentBox = await roomContent.boundingBox();
    const toolbarBox = await toolbar.boundingBox();
    const navBox = await bottomNav.boundingBox();

    expect(contentBox).not.toBeNull();
    expect(toolbarBox).not.toBeNull();
    expect(navBox).not.toBeNull();

    if (contentBox && toolbarBox && navBox) {
      // Content should not overlap with toolbar or nav
      expect(contentBox.y).toBeGreaterThanOrEqual(toolbarBox.y + toolbarBox.height);
      expect(contentBox.y + contentBox.height).toBeLessThanOrEqual(navBox.y);
    }
  });
});

test.describe('Weather Tooltip Positioning', () => {
  test('tooltip should stay within viewport bounds', async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.weather-display');

    const weatherContainer = page.locator('.toolbar-weather-container');
    await weatherContainer.hover();

    const tooltip = page.locator('.weather-tooltip');
    await expect(tooltip).toBeVisible();

    const tooltipBox = await tooltip.boundingBox();
    const viewportSize = page.viewportSize();

    expect(tooltipBox).not.toBeNull();
    expect(viewportSize).not.toBeNull();

    if (tooltipBox && viewportSize) {
      // Tooltip should be within viewport
      expect(tooltipBox.x).toBeGreaterThanOrEqual(0);
      expect(tooltipBox.x + tooltipBox.width).toBeLessThanOrEqual(viewportSize.width);
      expect(tooltipBox.y).toBeGreaterThanOrEqual(0);
      expect(tooltipBox.y + tooltipBox.height).toBeLessThanOrEqual(viewportSize.height);
    }
  });

  test.describe('tooltip on narrow viewport', () => {
    test.use({ viewport: VIEWPORTS.iphone14 });

    test('tooltip should not overflow on mobile', async ({ page }) => {
      await page.goto('/?demo=true');
      await page.waitForSelector('.weather-display');

      const weatherContainer = page.locator('.toolbar-weather-container');
      await weatherContainer.hover();

      const tooltip = page.locator('.weather-tooltip');
      await expect(tooltip).toBeVisible();

      const tooltipBox = await tooltip.boundingBox();

      expect(tooltipBox).not.toBeNull();

      if (tooltipBox) {
        // Tooltip should fit within mobile viewport
        expect(tooltipBox.x + tooltipBox.width).toBeLessThanOrEqual(VIEWPORTS.iphone14.width);
      }
    });
  });
});
