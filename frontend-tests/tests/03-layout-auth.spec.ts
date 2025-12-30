/**
 * Authentication Page Layout Tests
 *
 * Verifies the Hue Bridge authentication/pairing page displays correctly
 * on Raspberry Pi 7" (800x480):
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
} from '../src/layout-assertions';
import * as api from '../src/api-client';

test.describe('Authentication Page Layout - Raspberry Pi 7"', () => {
  test.use({ viewport: VIEWPORTS.raspberryPi });

  test.beforeEach(async ({ page }) => {
    // Reset to fresh state
    await api.resetToFresh();
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Navigate to auth page: Settings → Enable Hue → Enter IP → Connect
    await page.waitForSelector('.settings-page', { timeout: 10000 });

    // Enable Hue
    const hueToggle = page
      .locator('.service-toggle')
      .filter({ hasText: 'Philips Hue' })
      .locator('.service-toggle-switch');
    await hueToggle.click();

    // Wait for discovery page
    await page.waitForSelector('.discovery-page, .bridge-discovery', { timeout: 10000 });

    // Enter a test IP (will fail to connect but should show auth page)
    const ipInput = page.getByPlaceholder(/ip/i);
    await ipInput.fill('192.168.1.100');

    const connectButton = page.getByRole('button', { name: /connect/i });
    await connectButton.click();

    // Wait for auth page (may show error or auth instructions)
    await page.waitForSelector('.auth-page, .bridge-auth, .pairing-page', {
      timeout: 10000,
    });
  });

  test('should display auth page within viewport', async ({ page }) => {
    await assertWithinViewport(page, '.auth-page, .bridge-auth, .pairing-page');
  });

  test('should have pairing instructions visible', async ({ page }) => {
    // Look for text instructing user to press link button
    const instructions = page.getByText(/press|link|button|bridge/i);
    await expect(instructions.first()).toBeVisible();
  });

  test('should have authenticate/pair button visible and accessible', async ({ page }) => {
    const authButton = page.getByRole('button', {
      name: /authenticate|pair|connect|retry/i,
    });
    await expect(authButton).toBeVisible();
    await expect(authButton).toBeInViewport();

    const buttonBox = await authButton.boundingBox();
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
    await assertMinEdgeSpacing(
      page,
      '.auth-page, .bridge-auth, .pairing-page',
      LAYOUT.MIN_EDGE_SPACING
    );
  });

  test('should not have any elements cut off', async ({ page }) => {
    await assertNoCutoffs(page, ['.auth-page, .bridge-auth, .pairing-page']);
  });

  test('should fit all content without scrolling', async ({ page }) => {
    const needsScroll = await page.evaluate(() => {
      return document.documentElement.scrollHeight > document.documentElement.clientHeight;
    });

    expect(needsScroll).toBe(false);
  });

  test('should have adequate touch target for primary action', async ({ page }) => {
    const authButton = page.getByRole('button', {
      name: /authenticate|pair|connect|retry/i,
    });
    const buttonBox = await authButton.boundingBox();

    expect(buttonBox).not.toBeNull();
    // Primary action button should be easily tappable
    expect(buttonBox!.width).toBeGreaterThanOrEqual(LAYOUT.MIN_BUTTON_SIZE * 2);
    expect(buttonBox!.height).toBeGreaterThanOrEqual(LAYOUT.MIN_BUTTON_SIZE);
  });
});
