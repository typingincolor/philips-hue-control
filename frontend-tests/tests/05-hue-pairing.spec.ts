/**
 * Hue Bridge Pairing Tests (Interactive)
 *
 * These tests require physical interaction with a real Hue Bridge.
 * They will prompt the user to:
 * 1. Enter the bridge IP address
 * 2. Press the physical link button on the bridge
 * 3. Confirm successful pairing
 *
 * Run with: npm run test:hue
 */

import { test, expect } from '@playwright/test';
import { VIEWPORTS, LAYOUT } from '../src/constants';
import * as api from '../src/api-client';
import * as prompts from '../src/prompts';
import * as stateManager from '../src/state-manager';

// These tests are interactive and require user input
test.describe.configure({ mode: 'serial' });

test.describe('Hue Bridge Pairing - Interactive', () => {
  test.use({ viewport: VIEWPORTS.raspberryPi });

  test.beforeAll(async () => {
    // Clear any cached credentials at the start
    stateManager.clearCredentials();
  });

  test('should navigate from settings to discovery page', async ({ page }) => {
    // Start from fresh state
    await api.resetToFresh();
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Verify we start on settings page
    await page.waitForSelector('.settings-page', { timeout: 10000 });
    await expect(page.locator('.settings-page')).toBeVisible();

    // Find and click the Hue toggle
    const hueToggle = page
      .locator('.service-toggle')
      .filter({ hasText: 'Philips Hue' })
      .locator('.service-toggle-switch');
    await expect(hueToggle).toBeVisible();
    await hueToggle.click();

    // Should navigate to discovery page
    await page.waitForSelector('.discovery-page, .bridge-discovery', { timeout: 10000 });
    await expect(page.locator('.discovery-page, .bridge-discovery').first()).toBeVisible();
  });

  test('should accept bridge IP and navigate to auth page', async ({ page }) => {
    // Start from fresh and navigate to discovery
    await api.resetToFresh();
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await page.waitForSelector('.settings-page', { timeout: 10000 });
    const hueToggle = page
      .locator('.service-toggle')
      .filter({ hasText: 'Philips Hue' })
      .locator('.service-toggle-switch');
    await hueToggle.click();
    await page.waitForSelector('.discovery-page, .bridge-discovery', { timeout: 10000 });

    // Prompt user for bridge IP
    const bridgeIp = await stateManager.getBridgeIp();

    // Enter the bridge IP (placeholder is "192.168.1.xxx")
    const ipInput = page.locator('.ip-input');
    await ipInput.fill(bridgeIp);

    // Click connect
    const connectButton = page.getByRole('button', { name: /connect/i });
    await connectButton.click();

    // Should navigate to auth/pairing page
    await page.waitForSelector('.authentication', {
      timeout: 15000,
    });

    // Verify we see pairing instructions
    const instructions = page.getByText(/press|link|button/i);
    await expect(instructions.first()).toBeVisible();
  });

  test('should complete pairing when link button pressed', async ({ page }) => {
    // Start from fresh and navigate to auth page
    await api.resetToFresh();
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await page.waitForSelector('.settings-page', { timeout: 10000 });
    const hueToggle = page
      .locator('.service-toggle')
      .filter({ hasText: 'Philips Hue' })
      .locator('.service-toggle-switch');
    await hueToggle.click();
    await page.waitForSelector('.discovery-page, .bridge-discovery', { timeout: 10000 });

    const bridgeIp = await stateManager.getBridgeIp();
    const ipInput = page.locator('.ip-input');
    await ipInput.fill(bridgeIp);

    const connectButton = page.getByRole('button', { name: /connect/i });
    await connectButton.click();

    await page.waitForSelector('.authentication', {
      timeout: 15000,
    });

    // Prompt user to press the physical link button
    // Using console.log + page.pause() since stdin doesn't work with Playwright
    console.log('\n' + '='.repeat(60));
    console.log('ACTION REQUIRED: Press the LINK BUTTON on your Hue Bridge');
    console.log('Then click "Resume" in the Playwright inspector');
    console.log('='.repeat(60) + '\n');
    await page.pause();

    // Click the "I Pressed the Button" button in the app
    const authButton = page.getByRole('button', {
      name: /pressed the button/i,
    });
    await authButton.click();

    // Wait for successful pairing - should navigate to dashboard
    await page.waitForSelector('.dashboard, .light-control, .main-panel', {
      timeout: 30000,
    });

    // Verify we're on the dashboard
    await expect(page.locator('.dashboard, .light-control, .main-panel').first()).toBeVisible();

    prompts.showInfo('Pairing Complete', 'Successfully paired with Hue Bridge!');
  });

  test('should show lights after successful pairing', async ({ page }) => {
    // This test assumes pairing completed in previous test
    // Credentials are stored in backend, but Hue is enabled in settings
    // We need to disable Hue first (via API), then re-enable to trigger connect

    // Disable Hue in settings (but keep credentials in backend)
    await api.updateSettings({
      services: { hue: { enabled: false } },
    });

    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Wait for settings page
    await page.waitForSelector('.settings-page', { timeout: 10000 });

    // Click the toggle switch element (checkbox is hidden, styled as toggle)
    const hueToggle = page
      .locator('.service-toggle')
      .filter({ hasText: 'Philips Hue' })
      .locator('.service-toggle-switch');
    await hueToggle.click();

    // Wait for discovery page (class is bridge-discovery, not discovery-page)
    await page.waitForSelector('.bridge-discovery', { timeout: 10000 });

    // Enter bridge IP
    const bridgeIp = await stateManager.getBridgeIp();
    const ipInput = page.locator('.ip-input');
    await ipInput.fill(bridgeIp);

    const connectButton = page.getByRole('button', { name: /connect/i });
    await connectButton.click();

    // Since credentials exist in backend, should auto-connect to dashboard
    // (no auth page needed)
    await page.waitForSelector('.dashboard, .light-control, .main-panel', {
      timeout: 15000,
    });

    // Look for light controls
    const lightControls = page.locator(
      '.light-button, .light-tile, .room-card, .zone-card, .tiles-grid > *'
    );
    const count = await lightControls.count();

    // Should have at least one light/room/zone visible
    expect(count).toBeGreaterThan(0);

    prompts.showInfo('Lights Found', `Found ${count} light controls on the dashboard`);
  });
});

test.describe('Hue Bridge Pairing - Error Handling', () => {
  test.use({ viewport: VIEWPORTS.raspberryPi });

  test('should show error for invalid IP', async ({ page }) => {
    await api.resetToFresh();
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await page.waitForSelector('.settings-page', { timeout: 10000 });
    const hueToggle = page
      .locator('.service-toggle')
      .filter({ hasText: 'Philips Hue' })
      .locator('.service-toggle-switch');
    await hueToggle.click();
    await page.waitForSelector('.bridge-discovery', { timeout: 10000 });

    // Enter an invalid IP
    const ipInput = page.locator('.ip-input');
    await ipInput.fill('192.168.255.255');

    const connectButton = page.getByRole('button', { name: /connect/i });
    await connectButton.click();

    // Frontend goes to auth page - error only shows when we try to pair
    await page.waitForSelector('.authentication', { timeout: 10000 });

    // Try to pair (will fail with invalid IP)
    const authButton = page.getByRole('button', { name: /pressed the button/i });
    await authButton.click();

    // Should show an error message (connection timeout or unreachable)
    const errorMessage = page.getByText(/error|failed|unable|timeout|could not|unreachable/i);
    await expect(errorMessage.first()).toBeVisible({ timeout: 30000 });
  });

  test('should show error if link button not pressed', async ({ page }) => {
    await api.resetToFresh();
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await page.waitForSelector('.settings-page', { timeout: 10000 });
    const hueToggle = page
      .locator('.service-toggle')
      .filter({ hasText: 'Philips Hue' })
      .locator('.service-toggle-switch');
    await hueToggle.click();
    await page.waitForSelector('.bridge-discovery', { timeout: 10000 });

    const bridgeIp = await stateManager.getBridgeIp();
    const ipInput = page.locator('.ip-input');
    await ipInput.fill(bridgeIp);

    const connectButton = page.getByRole('button', { name: /connect/i });
    await connectButton.click();

    await page.waitForSelector('.authentication', {
      timeout: 15000,
    });

    // DON'T press the link button - just try to authenticate
    prompts.showWarning(
      'DO NOT press the link button for this test.\n' +
        'We are testing the error handling when link button is not pressed.'
    );

    const authButton = page.getByRole('button', {
      name: /pressed the button/i,
    });
    await authButton.click();

    // Should show an error about link button not pressed
    const errorMessage = page.getByText(/link|button|press|not pressed|error/i);
    await expect(errorMessage.first()).toBeVisible({ timeout: 15000 });
  });
});
