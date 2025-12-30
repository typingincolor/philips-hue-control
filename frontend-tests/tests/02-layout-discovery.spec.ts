/**
 * Discovery Page Layout Tests
 *
 * Verifies the Hue Bridge discovery page displays correctly on Raspberry Pi 7" (800x480):
 * - No overlapping elements
 * - No cutoffs
 * - Minimum edge spacing
 * - All controls accessible
 */

import { test, expect } from '@playwright/test';
import { VIEWPORTS, LAYOUT } from '../src/constants';
import {
  assertWithinViewport,
  assertMinEdgeSpacing,
  assertNoCutoffs,
  assertSquareButtons,
} from '../src/layout-assertions';
import * as api from '../src/api-client';

test.describe('Discovery Page Layout - Raspberry Pi 7"', () => {
  test.use({ viewport: VIEWPORTS.raspberryPi });

  test.beforeEach(async ({ page }) => {
    // Reset to fresh state
    await api.resetToFresh();
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Wait for settings page, then enable Hue to get to discovery
    await page.waitForSelector('.settings-page', { timeout: 10000 });

    // Enable Hue service to transition to discovery page
    const hueToggle = page
      .locator('.service-toggle')
      .filter({ hasText: 'Philips Hue' })
      .locator('.service-toggle-switch');
    await hueToggle.click();

    // Wait for discovery page to appear
    await page.waitForSelector('.discovery-page, .bridge-discovery', { timeout: 10000 });
  });

  test('should display discovery page within viewport', async ({ page }) => {
    await assertWithinViewport(page, '.discovery-page, .bridge-discovery');
  });

  test('should have IP input field visible and accessible', async ({ page }) => {
    const ipInput = page.locator('.ip-input');
    await expect(ipInput).toBeVisible();
    await expect(ipInput).toBeInViewport();

    const inputBox = await ipInput.boundingBox();
    expect(inputBox).not.toBeNull();
    expect(inputBox!.height).toBeGreaterThanOrEqual(LAYOUT.MIN_BUTTON_SIZE);
  });

  test('should have connect button visible and accessible', async ({ page }) => {
    const connectButton = page.getByRole('button', { name: /connect/i });
    await expect(connectButton).toBeVisible();
    await expect(connectButton).toBeInViewport();

    const buttonBox = await connectButton.boundingBox();
    expect(buttonBox).not.toBeNull();
    expect(buttonBox!.width).toBeGreaterThanOrEqual(LAYOUT.MIN_BUTTON_SIZE);
    expect(buttonBox!.height).toBeGreaterThanOrEqual(LAYOUT.MIN_BUTTON_SIZE);
  });

  test('should have back/cancel button visible', async ({ page }) => {
    const backButton = page.getByRole('button', { name: /back|cancel/i });
    await expect(backButton).toBeVisible();
    await expect(backButton).toBeInViewport();
  });

  test('should have minimum edge spacing for content', async ({ page }) => {
    await assertMinEdgeSpacing(page, '.discovery-page, .bridge-discovery', LAYOUT.MIN_EDGE_SPACING);
  });

  test('should not have any elements cut off', async ({ page }) => {
    await assertNoCutoffs(page, ['.discovery-page, .bridge-discovery']);
  });

  test('should fit all content without scrolling', async ({ page }) => {
    const needsScroll = await page.evaluate(() => {
      return document.documentElement.scrollHeight > document.documentElement.clientHeight;
    });

    expect(needsScroll).toBe(false);
  });

  test('input and button should not overlap', async ({ page }) => {
    const ipInput = page.locator('.ip-input');
    const connectButton = page.getByRole('button', { name: /connect/i });

    const inputBox = await ipInput.boundingBox();
    const buttonBox = await connectButton.boundingBox();

    expect(inputBox).not.toBeNull();
    expect(buttonBox).not.toBeNull();

    if (inputBox && buttonBox) {
      // Check no horizontal overlap if side by side, or proper vertical gap if stacked
      const horizontalOverlap =
        inputBox.x < buttonBox.x + buttonBox.width && inputBox.x + inputBox.width > buttonBox.x;
      const verticalOverlap =
        inputBox.y < buttonBox.y + buttonBox.height && inputBox.y + inputBox.height > buttonBox.y;

      // They shouldn't overlap in both dimensions
      expect(horizontalOverlap && verticalOverlap).toBe(false);
    }
  });
});
