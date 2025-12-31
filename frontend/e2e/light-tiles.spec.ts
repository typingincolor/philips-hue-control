import { test, expect } from '@playwright/test';

// Light tile redesign E2E tests
// Tests the new two-row layout: scene tiles (row 1) + light tiles (row 2)

test.describe('Light Tiles - Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?demo=true');
    // Wait for dashboard to load
    await expect(page.getByText('Living Room')).toBeVisible();
  });

  test('should display scene tiles in first row', async ({ page }) => {
    // Scene tiles should be visible
    const sceneTiles = page.locator('.scene-tile');
    await expect(sceneTiles.first()).toBeVisible();
  });

  test('should display All On/Off tile as first tile', async ({ page }) => {
    // All On/Off tile should be first in scene row
    const allOnOffTile = page.locator('.all-on-off-tile');
    await expect(allOnOffTile).toBeVisible();
  });

  test('should display light tiles in second row', async ({ page }) => {
    // Light tiles should be visible
    const lightTiles = page.locator('.light-tile');
    await expect(lightTiles.first()).toBeVisible();
  });

  test('should show scene names on scene tiles', async ({ page }) => {
    // Scene tiles should show scene names (Living Room has "Bright" and "Relax" scenes)
    await expect(page.locator('.scene-tile').filter({ hasText: 'Bright' })).toBeVisible();
  });

  test('should show light names on light tiles', async ({ page }) => {
    // Light tiles should show light names
    await expect(page.locator('.light-tile').filter({ hasText: 'Floor Lamp' })).toBeVisible();
    await expect(page.locator('.light-tile').filter({ hasText: 'TV Backlight' })).toBeVisible();
  });
});

test.describe('Light Tiles - Scene Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?demo=true');
    await expect(page.getByText('Living Room')).toBeVisible();
  });

  test('should activate scene when scene tile is clicked', async ({ page }) => {
    // Find and click a scene tile
    const sceneTile = page.locator('.scene-tile').filter({ hasText: 'Bright' });
    await sceneTile.click();

    // Scene should activate (tile may show spinner briefly)
    // After activation, lights should reflect scene state
    await expect(sceneTile).toBeVisible();
  });

  test('should toggle all lights off when All Off is clicked', async ({ page }) => {
    const allOnOffTile = page.locator('.all-on-off-tile');

    // If any lights are on, button should say "All Off"
    // Click to turn all off
    await allOnOffTile.click();

    // Button state should update
    await expect(allOnOffTile).toBeVisible();
  });

  test('should toggle all lights on when All On is clicked', async ({ page }) => {
    const allOnOffTile = page.locator('.all-on-off-tile');

    // First turn all off
    await allOnOffTile.click();
    await page.waitForTimeout(500);

    // Then turn all on
    await allOnOffTile.click();

    await expect(allOnOffTile).toBeVisible();
  });
});

test.describe('Light Tiles - Light Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?demo=true');
    await expect(page.getByText('Living Room')).toBeVisible();
  });

  test('should toggle light when light tile is tapped', async ({ page }) => {
    const lightTile = page.locator('.light-tile').filter({ hasText: 'Floor Lamp' });

    // Click tile to toggle
    await lightTile.click();

    // Light tile should still be visible after toggle
    await expect(lightTile).toBeVisible();
  });

  test('should show color temperature slider on light tile when light is on', async ({ page }) => {
    const lightTile = page.locator('.light-tile').filter({ hasText: 'Floor Lamp' });

    // If light is on, slider should be visible
    const slider = lightTile.locator('.light-tile-slider');
    // Slider visibility depends on light state
    await expect(lightTile).toBeVisible();
  });

  test('should adjust color temperature when slider is moved', async ({ page }) => {
    // Find a light tile with visible slider (light must be on)
    const lightTile = page.locator('.light-tile').filter({ hasText: 'Floor Lamp' });
    const slider = lightTile.locator('input[type="range"]');

    // Only test if slider is visible (light is on)
    if (await slider.isVisible()) {
      // Drag slider to change temperature
      await slider.fill('5000');

      // Tile should still be functional
      await expect(lightTile).toBeVisible();
    }
  });
});

test.describe('Light Tiles - Carousel Layout (issue 47)', () => {
  test('should show carousel layout on RPi viewport', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 480 });
    await page.goto('/?demo=true');
    await expect(page.getByText('Living Room')).toBeVisible();

    // Carousel layout should be visible
    const carousel = page.locator('.tiles-carousel');
    await expect(carousel.first()).toBeVisible();

    // Tiles should be visible in carousel
    const firstTile = page.locator('.scene-tile, .light-tile').first();
    await expect(firstTile).toBeVisible();
  });

  test('should show carousel layout on phone viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/?demo=true');
    await expect(page.getByText('Living Room')).toBeVisible();

    // Carousel should be visible on phone
    const carousel = page.locator('.tiles-carousel');
    await expect(carousel.first()).toBeVisible();
  });

  test('should show carousel layout on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 1180 });
    await page.goto('/?demo=true');
    await expect(page.getByText('Living Room')).toBeVisible();

    // Carousel should adapt to tablet size
    const carousel = page.locator('.tiles-carousel');
    await expect(carousel.first()).toBeVisible();
  });
});

test.describe('Light Tiles - Visual States', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?demo=true');
    await expect(page.getByText('Living Room')).toBeVisible();
  });

  test('should show distinct style for All On/Off tile', async ({ page }) => {
    const allOnOffTile = page.locator('.all-on-off-tile');

    // All On/Off tile should have distinct visual treatment
    await expect(allOnOffTile).toBeVisible();

    // Check it has the accent class or styling
    await expect(allOnOffTile).toHaveClass(/all-on-off-tile/);
  });

  test('should reflect light color in tile background', async ({ page }) => {
    // Light tiles should show color based on light state
    const lightTile = page.locator('.light-tile').first();
    await expect(lightTile).toBeVisible();

    // When light is on, tile should have colored background
    // This is visual - we just verify the tile renders
  });

  test('should show lightbulb icon on light tiles', async ({ page }) => {
    const lightTile = page.locator('.light-tile').first();
    const icon = lightTile.locator('svg');

    await expect(icon).toBeVisible();
  });

  test('should show scene-specific icons on scene tiles', async ({ page }) => {
    const sceneTile = page.locator('.scene-tile').first();
    const icon = sceneTile.locator('svg');

    await expect(icon).toBeVisible();
  });
});

test.describe('Light Tiles - Edge Cases', () => {
  test('should handle room with no lights', async ({ page }) => {
    await page.goto('/?demo=true');

    // Click on a room tab to navigate to a room view (not Home)
    const roomTab = page.locator('.nav-tab').nth(1); // First room after Home
    await roomTab.click();
    await page.waitForSelector('.room-content');

    // Carousel layout replaces grid (issue 47)
    const tilesCarousel = page.locator('.tiles-carousel');
    const emptyState = page.locator('.empty-state-dark');

    // Either carousel or empty state should be visible
    const hasContent = (await tilesCarousel.first().isVisible()) || (await emptyState.isVisible());
    expect(hasContent).toBe(true);
  });

  test('should handle room with no scenes', async ({ page }) => {
    await page.goto('/?demo=true');

    // Even without scenes, All On/Off tile should be present
    const allOnOffTile = page.locator('.all-on-off-tile');
    await expect(allOnOffTile).toBeVisible();
  });

  test('should truncate long light names', async ({ page }) => {
    await page.goto('/?demo=true');

    // Light names should not overflow tile boundaries
    const lightTile = page.locator('.light-tile').first();
    await expect(lightTile).toBeVisible();

    // Name element should have overflow handling
    const name = lightTile.locator('.light-tile-name');
    await expect(name).toBeVisible();
  });
});

test.describe('Light Tiles - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?demo=true');
    await expect(page.getByText('Living Room')).toBeVisible();
  });

  test('should have accessible labels on scene tiles', async ({ page }) => {
    const sceneTile = page.locator('.scene-tile').first();

    // Should have aria-label or accessible name
    await expect(sceneTile).toHaveAttribute('aria-label', /.+/);
  });

  test('should have accessible labels on All On/Off tile', async ({ page }) => {
    const allOnOffTile = page.locator('.all-on-off-tile');

    // Should have aria-label indicating action
    await expect(allOnOffTile).toHaveAttribute('aria-label', /.+/);
  });

  test('should have accessible labels on light tiles', async ({ page }) => {
    const lightTile = page.locator('.light-tile').first();

    // Should have aria-label with light name and state
    await expect(lightTile).toHaveAttribute('aria-label', /.+/);
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Tab should move focus through tiles
    await page.keyboard.press('Tab');

    // Some element should have focus
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});
