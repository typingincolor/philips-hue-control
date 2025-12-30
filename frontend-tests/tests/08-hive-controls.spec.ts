/**
 * Hive Control Tests (Interactive)
 *
 * These tests verify Hive heating/hot water control functionality.
 * They require a connected Hive account and will manipulate actual controls.
 *
 * Run with: npm run test:hive
 */

import { test, expect } from '@playwright/test';
import { VIEWPORTS, LAYOUT } from '../src/constants';
import * as api from '../src/api-client';
import * as prompts from '../src/prompts';

test.describe.configure({ mode: 'serial' });

test.describe('Hive Heating Controls - Interactive', () => {
  test.use({ viewport: VIEWPORTS.raspberryPi });

  test.beforeEach(async ({ page }) => {
    // Check Hive connection
    const hiveStatus = await api.getHiveConnection();
    if (!hiveStatus.connected) {
      test.skip(true, 'Hive not connected - run login tests first');
    }

    await page.goto('/');
    await page.waitForSelector('.dashboard, .light-control, .main-panel', {
      timeout: 15000,
    });
  });

  test('should display thermostat control', async ({ page }) => {
    const thermostat = page.locator(
      '.thermostat, .hive-control, .heating-control, [data-service="hive"]'
    );
    const isVisible = await thermostat.first().isVisible();

    if (!isVisible) {
      test.skip(true, 'No thermostat control visible');
    }

    await expect(thermostat.first()).toBeInViewport();

    const box = await thermostat.first().boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(LAYOUT.MIN_BUTTON_SIZE * 2);
    expect(box!.height).toBeGreaterThanOrEqual(LAYOUT.MIN_BUTTON_SIZE * 2);
  });

  test('should show current temperature', async ({ page }) => {
    // Look for temperature display
    const tempDisplay = page.locator(
      '.current-temp, .temperature, [data-testid="current-temperature"]'
    );
    const tempText = page.getByText(/\d+°/);

    const hasTemp = (await tempDisplay.count()) > 0 || (await tempText.count()) > 0;

    if (!hasTemp) {
      test.skip(true, 'No temperature display found');
    }

    const element = (await tempDisplay.count()) > 0 ? tempDisplay.first() : tempText.first();
    await expect(element).toBeVisible();

    prompts.showInfo(
      'Temperature Display',
      `Current temperature shown: ${await element.textContent()}`
    );
  });

  test('should adjust target temperature', async ({ page }) => {
    // Find temperature adjustment controls (up/down buttons or slider)
    const tempUp = page.locator(
      '.temp-up, .increase-temp, [aria-label*="increase"], button:has-text("+")'
    );
    const tempDown = page.locator(
      '.temp-down, .decrease-temp, [aria-label*="decrease"], button:has-text("-")'
    );

    const hasControls = (await tempUp.count()) > 0 && (await tempDown.count()) > 0;

    if (!hasControls) {
      test.skip(true, 'Temperature adjustment controls not found');
    }

    // Get current target temp if displayed
    const targetTemp = page.locator('.target-temp, .set-temp');
    const initialTemp =
      (await targetTemp.count()) > 0 ? await targetTemp.first().textContent() : 'unknown';

    prompts.showInfo('Temperature Adjustment', `Initial target temperature: ${initialTemp}`);

    // Increase temperature
    await tempUp.first().click();
    await page.waitForTimeout(1000);

    const confirmed = await prompts.confirmReady(
      'Did the target temperature increase by 0.5°C or 1°C?'
    );
    expect(confirmed).toBe(true);

    // Decrease back to original
    await tempDown.first().click();
    await page.waitForTimeout(1000);

    const confirmedBack = await prompts.confirmReady('Did the target temperature decrease back?');
    expect(confirmedBack).toBe(true);
  });

  test('should toggle heating mode', async ({ page }) => {
    // Find heating mode toggle/button
    const modeToggle = page.locator('.heating-mode, .mode-toggle, [data-testid="heating-mode"]');
    const modeButton = page.getByRole('button', { name: /schedule|manual|off|boost/i });

    const hasMode = (await modeToggle.count()) > 0 || (await modeButton.count()) > 0;

    if (!hasMode) {
      test.skip(true, 'Heating mode control not found');
    }

    const control = (await modeToggle.count()) > 0 ? modeToggle.first() : modeButton.first();

    const currentMode = await control.textContent();
    prompts.showInfo('Heating Mode', `Current mode: ${currentMode}`);

    // Click to change mode
    await control.click();
    await page.waitForTimeout(1000);

    const confirmed = await prompts.confirmReady(
      'Did the heating mode change (e.g., Schedule → Manual → Off)?'
    );
    expect(confirmed).toBe(true);

    // Note: We don't automatically restore the mode as it could affect user's heating
    prompts.showWarning(
      'Remember to set your heating mode back to your preferred setting after testing.'
    );
  });
});

test.describe('Hive Hot Water Controls - Interactive', () => {
  test.use({ viewport: VIEWPORTS.raspberryPi });

  test.beforeEach(async ({ page }) => {
    const hiveStatus = await api.getHiveConnection();
    if (!hiveStatus.connected) {
      test.skip(true, 'Hive not connected');
    }

    await page.goto('/');
    await page.waitForSelector('.dashboard, .light-control, .main-panel', {
      timeout: 15000,
    });
  });

  test('should display hot water control', async ({ page }) => {
    const hotWater = page.locator('.hot-water, .water-control, [data-testid="hot-water"]');
    const hotWaterText = page.getByText(/hot water/i);

    const hasControl = (await hotWater.count()) > 0 || (await hotWaterText.count()) > 0;

    if (!hasControl) {
      test.skip(true, 'No hot water control visible (may not be available)');
    }

    const control = (await hotWater.count()) > 0 ? hotWater.first() : hotWaterText.first();
    await expect(control).toBeVisible();
  });

  test('should toggle hot water boost', async ({ page }) => {
    const boostButton = page.locator(
      '.boost-button, [data-testid="boost"], button:has-text("Boost")'
    );

    if ((await boostButton.count()) === 0) {
      test.skip(true, 'Boost button not found');
    }

    await boostButton.first().click();
    await page.waitForTimeout(1000);

    const confirmed = await prompts.confirmReady(
      'Did hot water boost activate? (Check if boost indicator appeared)'
    );
    expect(confirmed).toBe(true);

    // Try to deactivate boost
    await boostButton.first().click();
    await page.waitForTimeout(1000);

    prompts.showInfo(
      'Boost Test Complete',
      'Hot water boost toggled. Check your Hive app to verify.'
    );
  });
});

test.describe('Hive Dashboard Layout', () => {
  test.use({ viewport: VIEWPORTS.raspberryPi });

  test.beforeEach(async ({ page }) => {
    const hiveStatus = await api.getHiveConnection();
    if (!hiveStatus.connected) {
      test.skip(true, 'Hive not connected');
    }

    await page.goto('/');
    await page.waitForSelector('.dashboard, .light-control, .main-panel', {
      timeout: 15000,
    });
  });

  test('Hive controls should fit within viewport', async ({ page }) => {
    const hiveSection = page.locator('.hive-section, .heating-section, [data-service="hive"]');

    if ((await hiveSection.count()) === 0) {
      test.skip(true, 'Hive section not found');
    }

    const box = await hiveSection.first().boundingBox();
    const viewport = page.viewportSize();

    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();

    if (box && viewport) {
      // Should be fully within viewport
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    }
  });

  test('Hive controls should have minimum touch targets', async ({ page }) => {
    const buttons = page.locator(
      '.hive-section button, .heating-section button, [data-service="hive"] button'
    );
    const count = await buttons.count();

    if (count === 0) {
      test.skip(true, 'No Hive buttons found');
    }

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();

      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThanOrEqual(LAYOUT.MIN_BUTTON_SIZE);
      expect(box!.height).toBeGreaterThanOrEqual(LAYOUT.MIN_BUTTON_SIZE);
    }

    prompts.showInfo(
      'Touch Targets',
      `Verified ${count} Hive buttons meet minimum size requirements`
    );
  });

  test('Hive and Hue controls should not overlap', async ({ page }) => {
    const hiveSection = page
      .locator('.hive-section, .heating-section, [data-service="hive"]')
      .first();
    const hueSection = page.locator('.hue-section, .light-section, [data-service="hue"]').first();

    const hiveVisible = await hiveSection.isVisible();
    const hueVisible = await hueSection.isVisible();

    if (!hiveVisible || !hueVisible) {
      test.skip(true, 'Both Hive and Hue sections not visible');
    }

    const hiveBox = await hiveSection.boundingBox();
    const hueBox = await hueSection.boundingBox();

    if (hiveBox && hueBox) {
      const horizontalOverlap =
        hiveBox.x < hueBox.x + hueBox.width && hiveBox.x + hiveBox.width > hueBox.x;
      const verticalOverlap =
        hiveBox.y < hueBox.y + hueBox.height && hiveBox.y + hiveBox.height > hueBox.y;

      // They shouldn't overlap in both dimensions
      expect(horizontalOverlap && verticalOverlap).toBe(false);
    }
  });
});
