import { test, expect } from '@playwright/test';

/**
 * Hive Tiles E2E Tests
 *
 * Tests for Hive heating/hot water display:
 * - Heating and hot water tiles in unified grid
 * - Info tiles (schedules) in same grid
 * - Responsive layout on all target devices
 * - No overlaps with toolbar/nav
 */

const VIEWPORTS = {
  ipad: { width: 1024, height: 768, name: 'iPad' },
  iphone14: { width: 390, height: 844, name: 'iPhone 14' },
  raspberryPi: { width: 800, height: 480, name: 'Raspberry Pi 7"' },
};

const MIN_TILE_SIZE = 44;

// Navigate to Home tab in demo mode (Hive is pre-connected in demo)
async function navigateToHomeTab(page: import('@playwright/test').Page) {
  await page.goto('/?demo=true');
  await page.waitForSelector('.top-toolbar', { timeout: 10000 });

  // In demo mode, Hive is pre-connected so Home tab should be visible
  const homeTab = page.locator('.nav-tab').filter({ hasText: /home/i });
  await expect(homeTab).toBeVisible({ timeout: 10000 });

  // Click Home tab to navigate
  await homeTab.click();

  // Wait for Hive tiles to load
  await page.waitForSelector('.hive-tile', { timeout: 10000 });
}

test.describe('Hive Tiles Display', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToHomeTab(page);
  });

  test('should display heating tile with temperature', async ({ page }) => {
    const heatingTile = page.locator('.hive-tile-heating');
    await expect(heatingTile).toBeVisible();

    // Should show temperature value (e.g., "19.5°")
    const tempDisplay = heatingTile.locator('.hive-tile-temp-current');
    await expect(tempDisplay).toBeVisible();
    await expect(tempDisplay).toContainText('°');
  });

  test('should display heating tile with target temperature', async ({ page }) => {
    const heatingTile = page.locator('.hive-tile-heating');
    await expect(heatingTile).toBeVisible();

    // Should show target temperature with arrow
    const targetTemp = heatingTile.locator('.hive-tile-temp-target');
    await expect(targetTemp).toBeVisible();
    await expect(targetTemp).toContainText('→');
  });

  test('should display heating tile with mode badge', async ({ page }) => {
    const heatingTile = page.locator('.hive-tile-heating');
    await expect(heatingTile).toBeVisible();

    // Should show mode badge (schedule, manual, etc.)
    const modeBadge = heatingTile.locator('.hive-tile-mode');
    await expect(modeBadge).toBeVisible();
  });

  test('should display hot water tile', async ({ page }) => {
    const hotWaterTile = page.locator('.hive-tile-hotwater');
    await expect(hotWaterTile).toBeVisible();

    // Should show "Hot Water" label
    await expect(hotWaterTile).toContainText(/hot water/i);
  });

  test('should show orange fill when heating is active', async ({ page }) => {
    const heatingTile = page.locator('.hive-tile-heating');
    await expect(heatingTile).toBeVisible();

    // In demo mode, heating.isHeating is true, so tile should have active class
    await expect(heatingTile).toHaveClass(/active/);
  });

  test('should display info tiles (schedules)', async ({ page }) => {
    // Info tiles should be visible in the same grid
    const infoTiles = page.locator('.hive-info-tile');

    // Demo mode has schedules, at least one should be visible
    await expect(infoTiles.first()).toBeVisible();
  });

  test('should show info tile name and time', async ({ page }) => {
    const infoTile = page.locator('.hive-info-tile').first();
    await expect(infoTile).toBeVisible();

    // Should have schedule name
    const infoName = infoTile.locator('.hive-info-name');
    await expect(infoName).toBeVisible();

    // Should have time display
    const infoTime = infoTile.locator('.hive-info-time');
    await expect(infoTime).toBeVisible();
  });

  test('should show info tile type icon', async ({ page }) => {
    const infoTile = page.locator('.hive-info-tile').first();
    await expect(infoTile).toBeVisible();

    // Should have type icon (heating or water)
    const typeIcon = infoTile.locator('.hive-info-icon');
    await expect(typeIcon).toBeVisible();
  });

  test('all tiles should be in unified grid', async ({ page }) => {
    const tilesGrid = page.locator('.tiles-grid');
    await expect(tilesGrid).toBeVisible();

    // Grid should contain both device tiles and info tiles
    const hiveTiles = tilesGrid.locator('.hive-tile');
    const infoTiles = tilesGrid.locator('.hive-info-tile');

    expect(await hiveTiles.count()).toBe(2); // heating + hot water
    expect(await infoTiles.count()).toBeGreaterThanOrEqual(1);
  });
});

test.describe('Hive Tiles - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToHomeTab(page);
  });

  test('heating tile should have accessible label with temperature', async ({ page }) => {
    const heatingTile = page.locator('.hive-tile-heating');
    await expect(heatingTile).toBeVisible();

    const ariaLabel = await heatingTile.getAttribute('aria-label');
    expect(ariaLabel).toContain('degree');
  });

  test('hot water tile should have accessible label', async ({ page }) => {
    const hotWaterTile = page.locator('.hive-tile-hotwater');
    await expect(hotWaterTile).toBeVisible();

    const ariaLabel = await hotWaterTile.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
  });

  test('info tiles should have accessible labels', async ({ page }) => {
    const infoTile = page.locator('.hive-info-tile').first();
    await expect(infoTile).toBeVisible();

    const ariaLabel = await infoTile.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
  });
});

// Responsive layout and overlap tests for all target devices
for (const [key, viewport] of Object.entries(VIEWPORTS)) {
  test.describe(`Hive Tiles - ${viewport.name} (${viewport.width}x${viewport.height})`, () => {
    test.use({ viewport });

    test('should display all tiles without overlapping toolbar', async ({ page }) => {
      await navigateToHomeTab(page);

      const toolbar = page.locator('.top-toolbar');
      const toolbarBox = await toolbar.boundingBox();
      expect(toolbarBox).not.toBeNull();

      // Check heating tile
      const heatingTile = page.locator('.hive-tile-heating');
      await expect(heatingTile).toBeVisible();
      const heatingBox = await heatingTile.boundingBox();
      expect(heatingBox).not.toBeNull();

      if (toolbarBox && heatingBox) {
        expect(heatingBox.y).toBeGreaterThanOrEqual(toolbarBox.y + toolbarBox.height);
      }

      // Check hot water tile
      const hotWaterTile = page.locator('.hive-tile-hotwater');
      await expect(hotWaterTile).toBeVisible();
      const hotWaterBox = await hotWaterTile.boundingBox();
      expect(hotWaterBox).not.toBeNull();

      if (toolbarBox && hotWaterBox) {
        expect(hotWaterBox.y).toBeGreaterThanOrEqual(toolbarBox.y + toolbarBox.height);
      }
    });

    test('should display all tiles without overlapping bottom nav', async ({ page }) => {
      await navigateToHomeTab(page);

      const nav = page.locator('.bottom-nav');
      const navBox = await nav.boundingBox();
      expect(navBox).not.toBeNull();

      // Check all hive tiles
      const hiveTiles = page.locator('.hive-tile');
      const hiveCount = await hiveTiles.count();

      for (let i = 0; i < hiveCount; i++) {
        const tileBox = await hiveTiles.nth(i).boundingBox();
        if (navBox && tileBox) {
          expect(tileBox.y + tileBox.height).toBeLessThanOrEqual(navBox.y);
        }
      }

      // Check all info tiles
      const infoTiles = page.locator('.hive-info-tile');
      const infoCount = await infoTiles.count();

      for (let i = 0; i < infoCount; i++) {
        const tileBox = await infoTiles.nth(i).boundingBox();
        if (navBox && tileBox) {
          expect(tileBox.y + tileBox.height).toBeLessThanOrEqual(navBox.y);
        }
      }
    });

    test('tiles should be square and at least 44px', async ({ page }) => {
      await navigateToHomeTab(page);

      // Check heating tile
      const heatingTile = page.locator('.hive-tile-heating');
      const heatingBox = await heatingTile.boundingBox();
      expect(heatingBox).not.toBeNull();

      if (heatingBox) {
        expect(heatingBox.width).toBeGreaterThanOrEqual(MIN_TILE_SIZE);
        expect(heatingBox.height).toBeGreaterThanOrEqual(MIN_TILE_SIZE);
        // Should be square (within 2px tolerance)
        expect(Math.abs(heatingBox.width - heatingBox.height)).toBeLessThan(2);
      }

      // Check info tile
      const infoTile = page.locator('.hive-info-tile').first();
      if (await infoTile.isVisible()) {
        const infoBox = await infoTile.boundingBox();
        if (infoBox) {
          expect(infoBox.width).toBeGreaterThanOrEqual(MIN_TILE_SIZE);
          expect(infoBox.height).toBeGreaterThanOrEqual(MIN_TILE_SIZE);
          expect(Math.abs(infoBox.width - infoBox.height)).toBeLessThan(2);
        }
      }
    });

    test('tiles should not overlap each other', async ({ page }) => {
      await navigateToHomeTab(page);

      // Get all tiles in the grid
      const allTiles = page.locator('.tiles-grid > *');
      const count = await allTiles.count();
      const boxes: Array<{ x: number; y: number; width: number; height: number }> = [];

      for (let i = 0; i < count; i++) {
        const box = await allTiles.nth(i).boundingBox();
        if (box) {
          boxes.push(box);
        }
      }

      // Check no tiles overlap
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i];
          const b = boxes[j];

          // Check if boxes overlap (with 1px tolerance for rounding)
          const overlap =
            a.x < b.x + b.width - 1 &&
            a.x + a.width > b.x + 1 &&
            a.y < b.y + b.height - 1 &&
            a.y + a.height > b.y + 1;

          expect(overlap).toBe(false);
        }
      }
    });

    test('tiles should be within viewport bounds', async ({ page }) => {
      await navigateToHomeTab(page);

      const allTiles = page.locator('.tiles-grid > *');
      const count = await allTiles.count();

      for (let i = 0; i < count; i++) {
        const box = await allTiles.nth(i).boundingBox();
        if (box) {
          // Should be within viewport horizontally
          expect(box.x).toBeGreaterThanOrEqual(0);
          expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
        }
      }
    });

    test('grid should have minimum edge spacing', async ({ page }) => {
      await navigateToHomeTab(page);

      const grid = page.locator('.tiles-grid');
      const gridBox = await grid.boundingBox();
      expect(gridBox).not.toBeNull();

      if (gridBox) {
        // Grid should have minimum spacing from edges (16px)
        expect(gridBox.x).toBeGreaterThanOrEqual(16);
        expect(viewport.width - (gridBox.x + gridBox.width)).toBeGreaterThanOrEqual(16);
      }
    });

    test('tiles should be vertically centered between toolbar and nav', async ({ page }) => {
      await navigateToHomeTab(page);

      // Tolerance for spacing comparison (pixels)
      const SPACING_TOLERANCE = 15;

      // Get toolbar bottom edge
      const toolbar = page.locator('.top-toolbar');
      const toolbarBox = await toolbar.boundingBox();
      expect(toolbarBox).not.toBeNull();

      // Get bottom nav top edge
      const nav = page.locator('.bottom-nav');
      const navBox = await nav.boundingBox();
      expect(navBox).not.toBeNull();

      // Get the tiles grid bounding box
      const grid = page.locator('.tiles-grid');
      const gridBox = await grid.boundingBox();
      expect(gridBox).not.toBeNull();

      if (toolbarBox && navBox && gridBox) {
        // Calculate spacing above and below grid
        const topSpacing = gridBox.y - (toolbarBox.y + toolbarBox.height);
        const bottomSpacing = navBox.y - (gridBox.y + gridBox.height);

        // Log for debugging
        console.log(
          `${viewport.name}: topSpacing=${topSpacing.toFixed(1)}px, bottomSpacing=${bottomSpacing.toFixed(1)}px`
        );

        // Assert equal spacing within tolerance
        expect(Math.abs(topSpacing - bottomSpacing)).toBeLessThanOrEqual(SPACING_TOLERANCE);
      }
    });
  });
}
