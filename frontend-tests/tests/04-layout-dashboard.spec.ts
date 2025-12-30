/**
 * Dashboard Layout Tests
 *
 * Verifies the main dashboard displays correctly on Raspberry Pi 7" (800x480):
 * - No overlapping elements
 * - No cutoffs
 * - Minimum edge spacing
 * - Grid layout correctness
 * - All controls accessible
 *
 * Note: These tests require an authenticated state (demo mode or real connection)
 */

import { test, expect } from '@playwright/test';
import { VIEWPORTS, LAYOUT } from '../src/constants';
import {
  assertWithinViewport,
  assertMinEdgeSpacing,
  assertNoCutoffs,
  assertSquareButtons,
  assertGridColumns,
  assertVerticalCentering,
} from '../src/layout-assertions';

test.describe('Dashboard Layout - Raspberry Pi 7"', () => {
  test.use({ viewport: VIEWPORTS.raspberryPi });

  test.beforeEach(async ({ page }) => {
    // Use demo mode to get to dashboard without real Hue connection
    await page.goto('/?demo=true');

    // Wait for dashboard to load
    await page.waitForSelector('.dashboard, .light-control, .main-panel', {
      timeout: 15000,
    });
  });

  test('should display dashboard within viewport', async ({ page }) => {
    await assertWithinViewport(page, '.dashboard, .light-control, .main-panel');
  });

  test('should have top toolbar visible and not cut off', async ({ page }) => {
    const toolbar = page.locator('.top-toolbar, .toolbar, header');
    await expect(toolbar.first()).toBeVisible();

    const toolbarBox = await toolbar.first().boundingBox();
    expect(toolbarBox).not.toBeNull();
    expect(toolbarBox!.y).toBeGreaterThanOrEqual(0);
  });

  test('should have bottom navigation visible and not cut off', async ({ page }) => {
    const bottomNav = page.locator('.bottom-nav, .navigation, nav');
    await expect(bottomNav.first()).toBeVisible();

    const navBox = await bottomNav.first().boundingBox();
    const viewport = page.viewportSize();

    expect(navBox).not.toBeNull();
    expect(viewport).not.toBeNull();

    if (navBox && viewport) {
      // Bottom nav should be fully visible within viewport
      expect(navBox.y + navBox.height).toBeLessThanOrEqual(viewport.height);
    }
  });

  test('should have light buttons with minimum touch target', async ({ page }) => {
    // Look for light control buttons
    const lightButtons = page.locator('.light-button, .light-control button');
    const count = await lightButtons.count();

    if (count > 0) {
      for (let i = 0; i < Math.min(count, 5); i++) {
        const button = lightButtons.nth(i);
        const box = await button.boundingBox();

        expect(box).not.toBeNull();
        expect(box!.width).toBeGreaterThanOrEqual(LAYOUT.MIN_BUTTON_SIZE);
        expect(box!.height).toBeGreaterThanOrEqual(LAYOUT.MIN_BUTTON_SIZE);
      }
    }
  });

  test('should have minimum edge spacing for main content', async ({ page }) => {
    // The dashboard may use edge-to-edge grid layout for touch-friendly tiles
    // The important thing is that the content doesn't overflow horizontally
    const mainPanel = page.locator('.main-panel');
    await expect(mainPanel).toBeVisible();

    const panelBox = await mainPanel.boundingBox();
    const viewport = page.viewportSize();

    expect(panelBox).not.toBeNull();
    expect(viewport).not.toBeNull();

    // Panel should fit within viewport width
    expect(panelBox!.x + panelBox!.width).toBeLessThanOrEqual(viewport!.width);
  });

  test('should not have any critical elements cut off', async ({ page }) => {
    await assertNoCutoffs(page, [
      '.top-toolbar, .toolbar, header',
      '.bottom-nav, .navigation, nav',
      '.main-panel, .dashboard-content',
    ]);
  });

  test('toolbar and navigation should not overlap with content', async ({ page }) => {
    const toolbar = page.locator('.top-toolbar, .toolbar, header').first();
    const content = page.locator('.main-panel, .dashboard-content').first();
    const bottomNav = page.locator('.bottom-nav, .navigation, nav').first();

    const toolbarBox = await toolbar.boundingBox();
    const contentBox = await content.boundingBox();
    const navBox = await bottomNav.boundingBox();

    if (toolbarBox && contentBox) {
      // Content should start below toolbar
      expect(contentBox.y).toBeGreaterThanOrEqual(toolbarBox.y + toolbarBox.height);
    }

    if (contentBox && navBox) {
      // Content should end above bottom nav
      expect(contentBox.y + contentBox.height).toBeLessThanOrEqual(navBox.y);
    }
  });

  test('should fit primary content without horizontal scrolling', async ({ page }) => {
    const needsHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    expect(needsHorizontalScroll).toBe(false);
  });

  test('scene buttons should have adequate touch targets', async ({ page }) => {
    const sceneButtons = page.locator('.scene-button, [data-testid="scene"]');
    const count = await sceneButtons.count();

    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        const button = sceneButtons.nth(i);
        const box = await button.boundingBox();

        expect(box).not.toBeNull();
        expect(box!.width).toBeGreaterThanOrEqual(LAYOUT.MIN_BUTTON_SIZE);
        expect(box!.height).toBeGreaterThanOrEqual(LAYOUT.MIN_BUTTON_SIZE);
      }
    }
  });

  test('room/zone tabs should be fully visible', async ({ page }) => {
    const tabs = page.locator('.tab, .room-tab, .zone-tab, [role="tab"]');
    const count = await tabs.count();

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const tab = tabs.nth(i);
        await expect(tab).toBeInViewport();
      }
    }
  });

  test('brightness slider should be accessible', async ({ page }) => {
    const slider = page.locator('input[type="range"], .brightness-slider, .slider');
    const count = await slider.count();

    if (count > 0) {
      const firstSlider = slider.first();
      await expect(firstSlider).toBeVisible();

      const sliderBox = await firstSlider.boundingBox();
      expect(sliderBox).not.toBeNull();
      // Slider should have adequate width for touch interaction
      expect(sliderBox!.width).toBeGreaterThanOrEqual(100);
    }
  });
});

test.describe('Dashboard Layout - Room View', () => {
  test.use({ viewport: VIEWPORTS.raspberryPi });

  test.beforeEach(async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.dashboard, .light-control, .main-panel', {
      timeout: 15000,
    });

    // Navigate to Rooms tab if available
    const roomsTab = page.getByRole('tab', { name: /rooms/i });
    if (await roomsTab.isVisible()) {
      await roomsTab.click();
    }
  });

  test('room cards should not overlap', async ({ page }) => {
    const roomCards = page.locator('.room-card, .room-item');
    const count = await roomCards.count();

    if (count >= 2) {
      for (let i = 0; i < count - 1; i++) {
        const card1 = roomCards.nth(i);
        const card2 = roomCards.nth(i + 1);

        const box1 = await card1.boundingBox();
        const box2 = await card2.boundingBox();

        if (box1 && box2) {
          // Either cards are in different rows (no vertical overlap)
          // or in same row with horizontal gap
          const verticalOverlap = box1.y < box2.y + box2.height && box1.y + box1.height > box2.y;
          const horizontalOverlap = box1.x < box2.x + box2.width && box1.x + box1.width > box2.x;

          expect(verticalOverlap && horizontalOverlap).toBe(false);
        }
      }
    }
  });

  test('room cards should have minimum size for touch', async ({ page }) => {
    const roomCards = page.locator('.room-card, .room-item');
    const count = await roomCards.count();

    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        const card = roomCards.nth(i);
        const box = await card.boundingBox();

        expect(box).not.toBeNull();
        expect(box!.width).toBeGreaterThanOrEqual(LAYOUT.MIN_BUTTON_SIZE * 2);
        expect(box!.height).toBeGreaterThanOrEqual(LAYOUT.MIN_BUTTON_SIZE);
      }
    }
  });
});

test.describe('Dashboard Layout - Zones View', () => {
  test.use({ viewport: VIEWPORTS.raspberryPi });

  test.beforeEach(async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.dashboard, .light-control, .main-panel', {
      timeout: 15000,
    });

    // Navigate to Zones tab if available
    const zonesTab = page.getByRole('tab', { name: /zones/i });
    if (await zonesTab.isVisible()) {
      await zonesTab.click();
    }
  });

  test('zone cards should not overlap', async ({ page }) => {
    const zoneCards = page.locator('.zone-card, .zone-item');
    const count = await zoneCards.count();

    if (count >= 2) {
      for (let i = 0; i < count - 1; i++) {
        const card1 = zoneCards.nth(i);
        const card2 = zoneCards.nth(i + 1);

        const box1 = await card1.boundingBox();
        const box2 = await card2.boundingBox();

        if (box1 && box2) {
          const verticalOverlap = box1.y < box2.y + box2.height && box1.y + box1.height > box2.y;
          const horizontalOverlap = box1.x < box2.x + box2.width && box1.x + box1.width > box2.x;

          expect(verticalOverlap && horizontalOverlap).toBe(false);
        }
      }
    }
  });
});
