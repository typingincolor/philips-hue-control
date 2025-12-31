import { test, expect } from '@playwright/test';

/**
 * Spotify Tab E2E Tests
 *
 * Tests the Spotify tab layout and functionality across all target devices:
 * - Raspberry Pi 7" (800x480) - landscape, touch
 * - iPhone 14+ (390x844) - portrait, touch
 * - iPad (820x1180) - portrait, touch
 *
 * Requirements:
 * - Playlist carousel with 44px images, horizontal scroll
 * - Selected playlist has amber border
 * - Two-column speaker grid (except narrow phones)
 * - Selected speakers highlighted green
 * - Transport controls with 44px minimum touch targets
 * - All content fits without scrolling on Raspberry Pi
 */

// Viewport definitions
const VIEWPORTS = {
  raspberryPi: { width: 800, height: 480, name: 'Raspberry Pi 7"' },
  iphone14: { width: 390, height: 844, name: 'iPhone 14' },
  ipad: { width: 820, height: 1180, name: 'iPad' },
};

const MIN_TOUCH_TARGET = 44;

/**
 * Helper to navigate to Spotify tab in demo mode
 */
async function navigateToSpotifyTab(page: import('@playwright/test').Page) {
  await page.goto('/?demo=true');
  // Wait for demo mode to load and show Spotify tab
  await page.waitForSelector('.bottom-nav');
  // Click Spotify tab
  const spotifyTab = page.locator('.nav-tab').filter({ hasText: 'Spotify' });
  await spotifyTab.click();
  // Wait for Spotify view to load
  await page.waitForSelector('.spotify-view');
}

test.describe('Spotify Tab - Raspberry Pi 7" (800x480)', () => {
  test.use({ viewport: VIEWPORTS.raspberryPi });

  test('should display Spotify tab in navigation', async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.bottom-nav');
    const spotifyTab = page.locator('.nav-tab').filter({ hasText: 'Spotify' });
    await expect(spotifyTab).toBeVisible();
  });

  test('should display playlist carousel', async ({ page }) => {
    await navigateToSpotifyTab(page);
    const carousel = page.locator('.spotify-playlist-carousel');
    await expect(carousel).toBeVisible();
  });

  test('should display playlist images at correct size', async ({ page }) => {
    await navigateToSpotifyTab(page);
    const playlistImage = page.locator('.spotify-playlist-image').first();
    const box = await playlistImage.boundingBox();

    expect(box).not.toBeNull();
    if (box) {
      // Should be around 40px on Raspberry Pi (responsive)
      expect(box.width).toBeGreaterThanOrEqual(36);
      expect(box.width).toBeLessThanOrEqual(48);
      expect(Math.abs(box.width - box.height)).toBeLessThan(2);
    }
  });

  test('should highlight selected playlist with amber border', async ({ page }) => {
    await navigateToSpotifyTab(page);
    const firstPlaylist = page.locator('.spotify-playlist-card').first();
    await firstPlaylist.click();

    await expect(firstPlaylist).toHaveClass(/selected/);
    const borderColor = await firstPlaylist.evaluate(
      (el) => window.getComputedStyle(el).borderColor
    );
    // Amber color #f59e0b = rgb(245, 158, 11)
    expect(borderColor).toContain('245');
  });

  test('should display two-column speaker grid on Raspberry Pi', async ({ page }) => {
    await navigateToSpotifyTab(page);
    const speakerList = page.locator('.spotify-speaker-list');
    const gridStyle = await speakerList.evaluate((el) => window.getComputedStyle(el));
    const columns = gridStyle.gridTemplateColumns.split(' ').length;
    // Raspberry Pi (800x480) uses 2 columns for better fit
    expect(columns).toBe(2);
  });

  test('should highlight selected speaker in green', async ({ page }) => {
    await navigateToSpotifyTab(page);
    const firstSpeaker = page.locator('.spotify-speaker-card').first();
    await firstSpeaker.click();

    await expect(firstSpeaker).toHaveClass(/selected/);
    const borderColor = await firstSpeaker.evaluate(
      (el) => window.getComputedStyle(el).borderColor
    );
    // Spotify green #1db954 = rgb(29, 185, 84)
    expect(borderColor).toContain('29');
  });

  test('should have minimum touch target size for play button', async ({ page }) => {
    await navigateToSpotifyTab(page);
    const playButton = page.locator('.spotify-play-btn');
    const box = await playButton.boundingBox();

    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
      expect(box.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
    }
  });

  test('should fit all content without vertical scrolling', async ({ page }) => {
    await navigateToSpotifyTab(page);
    const spotifyView = page.locator('.spotify-view');
    const viewBox = await spotifyView.boundingBox();
    const scrollHeight = await spotifyView.evaluate((el) => el.scrollHeight);
    const clientHeight = await spotifyView.evaluate((el) => el.clientHeight);

    expect(viewBox).not.toBeNull();
    // Content should fit (scroll height <= client height + small tolerance)
    expect(scrollHeight).toBeLessThanOrEqual(clientHeight + 20);
  });

  test('should not overlap with bottom navigation', async ({ page }) => {
    await navigateToSpotifyTab(page);
    const nav = page.locator('.bottom-nav');
    const speakerList = page.locator('.spotify-speaker-list');

    const navBox = await nav.boundingBox();
    const speakerBox = await speakerList.boundingBox();

    expect(navBox).not.toBeNull();
    expect(speakerBox).not.toBeNull();

    if (navBox && speakerBox) {
      expect(speakerBox.y + speakerBox.height).toBeLessThanOrEqual(navBox.y);
    }
  });
});

test.describe('Spotify Tab - iPhone 14 (390x844)', () => {
  test.use({ viewport: VIEWPORTS.iphone14 });

  test('should display Spotify tab in navigation', async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.bottom-nav');
    const spotifyTab = page.locator('.nav-tab').filter({ hasText: 'Spotify' });
    await expect(spotifyTab).toBeVisible();
  });

  test('should display playlist carousel', async ({ page }) => {
    await navigateToSpotifyTab(page);
    const carousel = page.locator('.spotify-playlist-carousel');
    await expect(carousel).toBeVisible();
  });

  test('should display single-column speaker grid on narrow screens', async ({ page }) => {
    await navigateToSpotifyTab(page);
    const speakerList = page.locator('.spotify-speaker-list');
    const gridStyle = await speakerList.evaluate((el) => window.getComputedStyle(el));
    const columns = gridStyle.gridTemplateColumns.split(' ').length;
    // Should be single column on narrow screens
    expect(columns).toBe(1);
  });

  test('should have minimum touch target size for transport buttons', async ({ page }) => {
    await navigateToSpotifyTab(page);
    const transportButtons = page.locator('.spotify-transport-btn');
    const count = await transportButtons.count();

    for (let i = 0; i < count; i++) {
      const box = await transportButtons.nth(i).boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
        expect(box.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
      }
    }
  });

  test('should highlight selected playlist with amber border', async ({ page }) => {
    await navigateToSpotifyTab(page);
    const firstPlaylist = page.locator('.spotify-playlist-card').first();
    await firstPlaylist.click();
    await expect(firstPlaylist).toHaveClass(/selected/);
  });

  test('should highlight selected speaker in green', async ({ page }) => {
    await navigateToSpotifyTab(page);
    const firstSpeaker = page.locator('.spotify-speaker-card').first();
    await firstSpeaker.click();
    await expect(firstSpeaker).toHaveClass(/selected/);
  });
});

test.describe('Spotify Tab - iPad (820x1180)', () => {
  test.use({ viewport: VIEWPORTS.ipad });

  test('should display Spotify tab in navigation', async ({ page }) => {
    await page.goto('/?demo=true');
    await page.waitForSelector('.bottom-nav');
    const spotifyTab = page.locator('.nav-tab').filter({ hasText: 'Spotify' });
    await expect(spotifyTab).toBeVisible();
  });

  test('should display playlist carousel', async ({ page }) => {
    await navigateToSpotifyTab(page);
    const carousel = page.locator('.spotify-playlist-carousel');
    await expect(carousel).toBeVisible();
  });

  test('should display playlist images at larger size', async ({ page }) => {
    await navigateToSpotifyTab(page);
    const playlistImage = page.locator('.spotify-playlist-image').first();
    const box = await playlistImage.boundingBox();

    expect(box).not.toBeNull();
    if (box) {
      // Should be larger on iPad (56px)
      expect(box.width).toBeGreaterThanOrEqual(50);
    }
  });

  test('should display two-column speaker grid', async ({ page }) => {
    await navigateToSpotifyTab(page);
    const speakerList = page.locator('.spotify-speaker-list');
    const gridStyle = await speakerList.evaluate((el) => window.getComputedStyle(el));
    const columns = gridStyle.gridTemplateColumns.split(' ').length;
    expect(columns).toBe(2);
  });

  test('should have larger touch targets', async ({ page }) => {
    await navigateToSpotifyTab(page);
    const playButton = page.locator('.spotify-play-btn');
    const box = await playButton.boundingBox();

    expect(box).not.toBeNull();
    if (box) {
      // iPad should have larger play button (72px)
      expect(box.width).toBeGreaterThanOrEqual(68);
    }
  });
});

test.describe('Spotify Tab - User Interactions', () => {
  test.use({ viewport: VIEWPORTS.raspberryPi });

  test('should toggle playlist selection', async ({ page }) => {
    await navigateToSpotifyTab(page);
    const firstPlaylist = page.locator('.spotify-playlist-card').first();

    // Select
    await firstPlaylist.click();
    await expect(firstPlaylist).toHaveClass(/selected/);

    // Deselect
    await firstPlaylist.click();
    await expect(firstPlaylist).not.toHaveClass(/selected/);
  });

  test('should toggle speaker selection', async ({ page }) => {
    await navigateToSpotifyTab(page);
    const firstSpeaker = page.locator('.spotify-speaker-card').first();

    // Select
    await firstSpeaker.click();
    await expect(firstSpeaker).toHaveClass(/selected/);

    // Deselect
    await firstSpeaker.click();
    await expect(firstSpeaker).not.toHaveClass(/selected/);
  });

  test('should allow multiple speaker selection', async ({ page }) => {
    await navigateToSpotifyTab(page);
    const speakers = page.locator('.spotify-speaker-card');
    const count = await speakers.count();

    if (count >= 2) {
      await speakers.nth(0).click();
      await speakers.nth(1).click();

      await expect(speakers.nth(0)).toHaveClass(/selected/);
      await expect(speakers.nth(1)).toHaveClass(/selected/);
    }
  });

  test('should display now playing section', async ({ page }) => {
    await navigateToSpotifyTab(page);
    const nowPlaying = page.locator('.spotify-now-playing');
    await expect(nowPlaying).toBeVisible();
  });

  test('should display transport controls', async ({ page }) => {
    await navigateToSpotifyTab(page);
    const transport = page.locator('.spotify-transport');
    await expect(transport).toBeVisible();

    const playButton = page.locator('.spotify-play-btn');
    await expect(playButton).toBeVisible();
  });

  test('should display speakers section', async ({ page }) => {
    await navigateToSpotifyTab(page);
    const speakersTitle = page.locator('.spotify-speakers-title');
    await expect(speakersTitle).toBeVisible();
    await expect(speakersTitle).toHaveText('Speakers');
  });
});

test.describe('Spotify Tab - Carousel Scrolling', () => {
  test.use({ viewport: VIEWPORTS.raspberryPi });

  test('should allow horizontal scrolling in playlist carousel', async ({ page }) => {
    await navigateToSpotifyTab(page);
    const carousel = page.locator('.spotify-playlist-carousel');

    // Check if carousel is scrollable
    const scrollWidth = await carousel.evaluate((el) => el.scrollWidth);
    const clientWidth = await carousel.evaluate((el) => el.clientWidth);

    // If there are enough playlists, carousel should be scrollable
    const playlists = page.locator('.spotify-playlist-card');
    const count = await playlists.count();
    if (count > 5) {
      expect(scrollWidth).toBeGreaterThan(clientWidth);
    }
  });

  test('should display playlist names below images', async ({ page }) => {
    await navigateToSpotifyTab(page);
    const firstCard = page.locator('.spotify-playlist-card').first();
    const image = firstCard.locator('.spotify-playlist-image');
    const name = firstCard.locator('.spotify-playlist-name');

    await expect(image).toBeVisible();
    await expect(name).toBeVisible();

    const imageBox = await image.boundingBox();
    const nameBox = await name.boundingBox();

    expect(imageBox).not.toBeNull();
    expect(nameBox).not.toBeNull();

    if (imageBox && nameBox) {
      // Name should be below image
      expect(nameBox.y).toBeGreaterThan(imageBox.y + imageBox.height - 5);
    }
  });
});
