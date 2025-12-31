import { test, expect } from '@playwright/test';

/**
 * Responsive Layout Tests
 *
 * Requirements:
 * - iPad (1024x768): 2 rows x 4 buttons
 * - iPhone 14+ (390x844): 4 rows x 2 buttons
 * - Raspberry Pi 7" (800x480): 2 rows x 4 buttons
 * - Buttons: min 44px, always square, fill available space
 * - Buttons must not overlap toolbars
 * - Scene drawer slides in from right
 */

// Note: These tests use ?demo=true which bypasses auth entirely
// No localStorage cleanup needed as demo mode doesn't modify auth state

// Viewport definitions
const VIEWPORTS = {
  ipad: { width: 1024, height: 768, name: 'iPad' },
  iphone14: { width: 390, height: 844, name: 'iPhone 14' },
  raspberryPi: { width: 800, height: 480, name: 'Raspberry Pi 7"' },
};

// Expected grid layouts
const EXPECTED_LAYOUTS = {
  ipad: { columns: 4, rows: 2 },
  iphone14: { columns: 2, rows: 4 },
  raspberryPi: { columns: 4, rows: 2 },
};

// Toolbar heights (from CSS variables)
const TOOLBAR_HEIGHT = 56;
const NAV_HEIGHT = 120;
const MIN_BUTTON_SIZE = 44;

test.describe('iPad Layout (1024x768)', () => {
  test.use({ viewport: VIEWPORTS.ipad });

  test.beforeEach(async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.light-tile');
  });

  test('should display carousel layout', async ({ page }) => {
    // Carousel layout replaces grid (issue 47)
    const carousel = page.locator('.tiles-carousel');
    await expect(carousel.first()).toBeVisible();
  });

  test('should display light tiles in carousel', async ({ page }) => {
    const tiles = page.locator('.light-tile');
    const count = await tiles.count();
    // Should have multiple light tiles
    expect(count).toBeGreaterThan(0);

    // Check first tile is visible
    await expect(tiles.first()).toBeInViewport();
  });

  test('should have square buttons at least 44px', async ({ page }) => {
    const tile = page.locator('.light-tile').first();
    const box = await tile.boundingBox();

    expect(box).not.toBeNull();
    if (box) {
      // Check square (aspect ratio ~1)
      expect(Math.abs(box.width - box.height)).toBeLessThan(2);

      // Check minimum size
      expect(box.width).toBeGreaterThanOrEqual(MIN_BUTTON_SIZE);
    }
  });

  test('should not overlap with top toolbar', async ({ page }) => {
    const toolbar = page.locator('.top-toolbar');
    const tile = page.locator('.light-tile').first();

    const toolbarBox = await toolbar.boundingBox();
    const tileBox = await tile.boundingBox();

    expect(toolbarBox).not.toBeNull();
    expect(tileBox).not.toBeNull();

    if (toolbarBox && tileBox) {
      // Tile should start below toolbar
      expect(tileBox.y).toBeGreaterThanOrEqual(toolbarBox.y + toolbarBox.height);
    }
  });

  test('should not overlap with bottom navigation', async ({ page }) => {
    const nav = page.locator('.bottom-nav');
    const tiles = page.locator('.light-tile');
    const count = await tiles.count();

    // Get last visible tile
    const lastTile = tiles.nth(Math.min(7, count - 1));

    const navBox = await nav.boundingBox();
    const tileBox = await lastTile.boundingBox();

    expect(navBox).not.toBeNull();
    expect(tileBox).not.toBeNull();

    if (navBox && tileBox) {
      // Tile bottom should be above nav top
      expect(tileBox.y + tileBox.height).toBeLessThanOrEqual(navBox.y);
    }
  });
});

test.describe('iPhone 14 Layout (390x844)', () => {
  test.use({ viewport: VIEWPORTS.iphone14 });

  test.beforeEach(async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.light-tile');
  });

  test('should display carousel layout on iPhone', async ({ page }) => {
    // Carousel layout replaces grid (issue 47)
    const carousel = page.locator('.tiles-carousel');
    await expect(carousel.first()).toBeVisible();
  });

  test('should display light tiles in carousel on iPhone', async ({ page }) => {
    const tiles = page.locator('.light-tile');
    const count = await tiles.count();
    // Should have multiple light tiles
    expect(count).toBeGreaterThan(0);

    // Check first tile is visible
    await expect(tiles.first()).toBeInViewport();
  });

  test('should have square buttons at least 44px', async ({ page }) => {
    const tile = page.locator('.light-tile').first();
    const box = await tile.boundingBox();

    expect(box).not.toBeNull();
    if (box) {
      // Check square (aspect ratio ~1)
      expect(Math.abs(box.width - box.height)).toBeLessThan(2);

      // Check minimum size
      expect(box.width).toBeGreaterThanOrEqual(MIN_BUTTON_SIZE);
    }
  });

  test('should not overlap with top toolbar', async ({ page }) => {
    const toolbar = page.locator('.top-toolbar');
    const tile = page.locator('.light-tile').first();

    const toolbarBox = await toolbar.boundingBox();
    const tileBox = await tile.boundingBox();

    expect(toolbarBox).not.toBeNull();
    expect(tileBox).not.toBeNull();

    if (toolbarBox && tileBox) {
      expect(tileBox.y).toBeGreaterThanOrEqual(toolbarBox.y + toolbarBox.height);
    }
  });

  test('should not overlap with bottom navigation', async ({ page }) => {
    const nav = page.locator('.bottom-nav');
    const tiles = page.locator('.light-tile');
    const count = await tiles.count();

    const lastTile = tiles.nth(Math.min(7, count - 1));

    const navBox = await nav.boundingBox();
    const tileBox = await lastTile.boundingBox();

    expect(navBox).not.toBeNull();
    expect(tileBox).not.toBeNull();

    if (navBox && tileBox) {
      expect(tileBox.y + tileBox.height).toBeLessThanOrEqual(navBox.y);
    }
  });
});

test.describe('Raspberry Pi 7" Layout (800x480)', () => {
  test.use({ viewport: VIEWPORTS.raspberryPi });

  test.beforeEach(async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.light-tile');
  });

  test('should display carousel layout on RPi', async ({ page }) => {
    // Carousel layout replaces grid (issue 47)
    const carousel = page.locator('.tiles-carousel');
    await expect(carousel.first()).toBeVisible();
  });

  test('should display light tiles in carousel on RPi', async ({ page }) => {
    const tiles = page.locator('.light-tile');
    const count = await tiles.count();
    // Should have multiple light tiles
    expect(count).toBeGreaterThan(0);

    // Check first tile is visible
    await expect(tiles.first()).toBeInViewport();
  });

  test('should have square buttons at least 44px', async ({ page }) => {
    const tile = page.locator('.light-tile').first();
    const box = await tile.boundingBox();

    expect(box).not.toBeNull();
    if (box) {
      // Check square (aspect ratio ~1)
      expect(Math.abs(box.width - box.height)).toBeLessThan(2);

      // Check minimum size
      expect(box.width).toBeGreaterThanOrEqual(MIN_BUTTON_SIZE);
    }
  });

  test('should not overlap with top toolbar', async ({ page }) => {
    const toolbar = page.locator('.top-toolbar');
    const tile = page.locator('.light-tile').first();

    const toolbarBox = await toolbar.boundingBox();
    const tileBox = await tile.boundingBox();

    expect(toolbarBox).not.toBeNull();
    expect(tileBox).not.toBeNull();

    if (toolbarBox && tileBox) {
      expect(tileBox.y).toBeGreaterThanOrEqual(toolbarBox.y + toolbarBox.height);
    }
  });

  test('should not overlap with bottom navigation', async ({ page }) => {
    const nav = page.locator('.bottom-nav');
    const tiles = page.locator('.light-tile');
    const count = await tiles.count();

    const lastTile = tiles.nth(Math.min(7, count - 1));

    const navBox = await nav.boundingBox();
    const tileBox = await lastTile.boundingBox();

    expect(navBox).not.toBeNull();
    expect(tileBox).not.toBeNull();

    if (navBox && tileBox) {
      expect(tileBox.y + tileBox.height).toBeLessThanOrEqual(navBox.y);
    }
  });
});

test.describe('Button Size Constraints (All Devices)', () => {
  for (const [, viewport] of Object.entries(VIEWPORTS)) {
    test.describe(`${viewport.name}`, () => {
      test.use({ viewport });

      test('buttons should be at least 44px', async ({ page }) => {
        await page.goto('/?demo=true');
        await page.waitForSelector('.light-tile');

        const tile = page.locator('.light-tile').first();
        const box = await tile.boundingBox();

        expect(box).not.toBeNull();
        if (box) {
          expect(box.width).toBeGreaterThanOrEqual(MIN_BUTTON_SIZE);
          expect(box.height).toBeGreaterThanOrEqual(MIN_BUTTON_SIZE);
        }
      });

      test('buttons should be square', async ({ page }) => {
        await page.goto('/?demo=true');
        await page.waitForSelector('.light-tile');

        const tiles = page.locator('.light-tile');
        const count = await tiles.count();

        // Check first few tiles
        for (let i = 0; i < Math.min(4, count); i++) {
          const box = await tiles.nth(i).boundingBox();
          if (box) {
            const aspectRatio = box.width / box.height;
            expect(aspectRatio).toBeGreaterThan(0.95);
            expect(aspectRatio).toBeLessThan(1.05);
          }
        }
      });
    });
  }
});

test.describe('Carousel Layout (issue 47)', () => {
  for (const [key, viewport] of Object.entries(VIEWPORTS)) {
    test.describe(`${viewport.name}`, () => {
      test.use({ viewport });

      test('should have two carousel rows', async ({ page }) => {
        await page.goto('/?demo=true');
        await page.waitForSelector('.light-tile');

        // Should have scenes row and lights row
        const scenesRow = page.locator('.scenes-row');
        const lightsRow = page.locator('.lights-row');

        await expect(scenesRow).toBeVisible();
        await expect(lightsRow).toBeVisible();
      });

      test('should display carousel with chevron buttons', async ({ page }) => {
        await page.goto('/?demo=true');
        await page.waitForSelector('.light-tile');

        // Should have carousel buttons
        const carouselBtns = page.locator('.carousel-btn');
        const count = await carouselBtns.count();
        expect(count).toBeGreaterThanOrEqual(4); // 2 per row
      });
    });
  }
});

// NOTE: Zones View Layout tests removed - MotionZones feature is currently disabled.
// These tests should be re-added when the feature is re-enabled.

// NOTE: Scene Drawer tests removed - replaced with scene tiles in carousel (issue 47).
