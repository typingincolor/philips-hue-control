/**
 * Hue Light Control Tests (Interactive)
 *
 * These tests verify light control functionality with a real Hue Bridge.
 * They require a paired bridge and will manipulate actual lights.
 *
 * Run with: npm run test:hue
 */

import { test, expect } from '@playwright/test';
import { VIEWPORTS, LAYOUT } from '../src/constants';
import * as api from '../src/api-client';
import * as prompts from '../src/prompts';

test.describe.configure({ mode: 'serial' });

test.describe('Hue Light Controls - Interactive', () => {
  test.use({ viewport: VIEWPORTS.raspberryPi });

  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard (assumes already paired)
    await page.goto('/');

    // If we land on settings, the bridge isn't connected
    const isSettings = await page.locator('.settings-page').isVisible();
    if (isSettings) {
      test.skip(true, 'Hue Bridge not connected - run pairing tests first');
    }

    await page.waitForSelector('.dashboard, .light-control, .main-panel', {
      timeout: 15000,
    });
  });

  test('should toggle room lights on and off', async ({ page }) => {
    // Find a room card
    const roomCard = page.locator('.room-card, .room-item').first();
    const isVisible = await roomCard.isVisible();

    if (!isVisible) {
      test.skip(true, 'No room cards visible');
    }

    // Get initial state indicator
    const initialState = await roomCard.getAttribute('data-state');

    // Click to toggle
    await roomCard.click();
    await page.waitForTimeout(1000);

    // Prompt user to confirm the lights changed
    const confirmed = await prompts.confirmReady('Did the lights in the room toggle on or off?');
    expect(confirmed).toBe(true);

    // Toggle back
    await roomCard.click();
    await page.waitForTimeout(1000);

    const confirmedBack = await prompts.confirmReady(
      'Did the lights toggle back to their original state?'
    );
    expect(confirmedBack).toBe(true);
  });

  test('should adjust brightness with slider', async ({ page }) => {
    // Find brightness slider
    const slider = page.locator('input[type="range"], .brightness-slider, .slider').first();
    const isVisible = await slider.isVisible();

    if (!isVisible) {
      test.skip(true, 'No brightness slider visible');
    }

    // Get current value
    const initialValue = await slider.inputValue();

    // Move slider to a different position
    await slider.fill('50');
    await page.waitForTimeout(1000);

    const confirmed = await prompts.confirmReady(
      'Did the light brightness change to approximately 50%?'
    );
    expect(confirmed).toBe(true);

    // Move to another position
    await slider.fill('100');
    await page.waitForTimeout(1000);

    const confirmedMax = await prompts.confirmReady(
      'Did the light brightness increase to maximum (100%)?'
    );
    expect(confirmedMax).toBe(true);

    // Restore original value
    await slider.fill(initialValue || '75');
  });

  test('should activate scene', async ({ page }) => {
    // Find scene buttons
    const sceneButton = page.locator('.scene-button, [data-testid="scene"]').first();
    const isVisible = await sceneButton.isVisible();

    if (!isVisible) {
      test.skip(true, 'No scene buttons visible');
    }

    // Get scene name for user prompt
    const sceneName = await sceneButton.textContent();

    // Click to activate scene
    await sceneButton.click();
    await page.waitForTimeout(1000);

    const confirmed = await prompts.confirmReady(
      `Did the lights change to the "${sceneName}" scene?`
    );
    expect(confirmed).toBe(true);
  });

  test('should navigate between rooms', async ({ page }) => {
    // Find room tabs or navigation
    const tabs = page.locator('.tab, .room-tab, [role="tab"]');
    const tabCount = await tabs.count();

    if (tabCount < 2) {
      test.skip(true, 'Not enough rooms to test navigation');
    }

    // Click second tab
    await tabs.nth(1).click();
    await page.waitForTimeout(500);

    // Verify content changed
    const secondTabName = await tabs.nth(1).textContent();
    prompts.showInfo('Navigation', `Navigated to: ${secondTabName}`);

    // Navigate back to first tab
    await tabs.nth(0).click();
    await page.waitForTimeout(500);

    const firstTabName = await tabs.nth(0).textContent();
    prompts.showInfo('Navigation', `Navigated back to: ${firstTabName}`);
  });

  test('light buttons should have proper touch targets', async ({ page }) => {
    const lightButtons = page.locator('.light-button, .light-control button');
    const count = await lightButtons.count();

    if (count === 0) {
      test.skip(true, 'No light buttons visible');
    }

    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = lightButtons.nth(i);
      const box = await button.boundingBox();

      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThanOrEqual(LAYOUT.MIN_BUTTON_SIZE);
      expect(box!.height).toBeGreaterThanOrEqual(LAYOUT.MIN_BUTTON_SIZE);
    }

    prompts.showInfo('Touch Targets', `Verified ${Math.min(count, 5)} buttons meet minimum size`);
  });
});

test.describe('Hue Dashboard - Real-time Updates', () => {
  test.use({ viewport: VIEWPORTS.raspberryPi });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const isSettings = await page.locator('.settings-page').isVisible();
    if (isSettings) {
      test.skip(true, 'Hue Bridge not connected');
    }
    await page.waitForSelector('.dashboard, .light-control, .main-panel', {
      timeout: 15000,
    });
  });

  test('should reflect external light changes', async ({ page }) => {
    prompts.showInfo(
      'External Control Test',
      'This test checks if the UI updates when lights are changed externally.\n\n' +
        'Please use the Hue app or physical switch to change a light.'
    );

    // Using page.pause() since stdin doesn't work with Playwright
    console.log('\n' + '='.repeat(60));
    console.log('Use the Hue app or switch to turn a light ON or OFF');
    console.log('Click "Resume" in Playwright inspector after making the change');
    console.log('='.repeat(60) + '\n');
    await page.pause();

    // Give time for WebSocket update
    await page.waitForTimeout(2000);

    const confirmed = await prompts.confirmReady(
      'Did the Home Control app reflect the change you made externally?'
    );
    expect(confirmed).toBe(true);
  });

  test('should update when scene activated externally', async ({ page }) => {
    // Using page.pause() since stdin doesn't work with Playwright
    console.log('\n' + '='.repeat(60));
    console.log('Use the Hue app to activate a different scene');
    console.log('Click "Resume" in Playwright inspector after activating');
    console.log('='.repeat(60) + '\n');
    await page.pause();

    await page.waitForTimeout(2000);

    const confirmed = await prompts.confirmReady('Did the Home Control app show the scene change?');
    expect(confirmed).toBe(true);
  });
});
