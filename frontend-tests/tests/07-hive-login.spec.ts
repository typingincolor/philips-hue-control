/**
 * Hive Login Tests (Interactive)
 *
 * These tests require real Hive credentials and 2FA verification.
 * They will prompt the user for:
 * 1. Hive email and password
 * 2. SMS 2FA verification code
 *
 * Run with: npm run test:hive
 */

import { test, expect } from '@playwright/test';
import { VIEWPORTS, LAYOUT } from '../src/constants';
import * as api from '../src/api-client';
import * as prompts from '../src/prompts';
import * as stateManager from '../src/state-manager';

// These tests are interactive and require user input
test.describe.configure({ mode: 'serial' });

test.describe('Hive Login - Interactive', () => {
  test.use({ viewport: VIEWPORTS.raspberryPi });

  test.beforeAll(async () => {
    stateManager.clearCredentials();
  });

  test('should navigate from settings to Hive login', async ({ page }) => {
    // Start from fresh state
    await api.resetToFresh();
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Verify we start on settings page
    await page.waitForSelector('.settings-page', { timeout: 10000 });
    await expect(page.locator('.settings-page')).toBeVisible();

    // Find and click the Hive toggle
    const hiveToggle = page.locator('.service-toggle').filter({ hasText: 'Hive Heating' });
    await expect(hiveToggle).toBeVisible();
    await hiveToggle.click();

    // Should show Hive login form
    await page.waitForSelector('.hive-login, .hive-auth, form', { timeout: 10000 });

    // Verify login form elements are visible
    const emailInput = page.getByPlaceholder(/email/i);
    const passwordInput = page.getByPlaceholder(/password/i);

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('should complete full login with 2FA', async ({ page }) => {
    // Requires HIVE_EMAIL and HIVE_PASSWORD env vars
    const email = process.env.HIVE_EMAIL;
    const password = process.env.HIVE_PASSWORD;
    if (!email || !password) {
      test.skip(true, 'Set HIVE_EMAIL and HIVE_PASSWORD env vars to run this test');
    }

    // Navigate to Hive login
    await api.resetToFresh();
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await page.waitForSelector('.settings-page', { timeout: 10000 });
    const hiveToggle = page.locator('.service-toggle').filter({ hasText: 'Hive Heating' });
    await hiveToggle.click();
    await page.waitForSelector('.hive-login, .hive-auth, form', { timeout: 10000 });

    // Fill in credentials from env vars
    const emailInput = page.getByPlaceholder(/email/i);
    const passwordInput = page.getByPlaceholder(/password/i);

    await emailInput.fill(email!);
    await passwordInput.fill(password!);

    // Submit login
    const loginButton = page.getByRole('button', { name: /connect|login|sign in/i });
    await loginButton.click();

    // Should show 2FA input
    await page.waitForSelector('.hive-2fa-form, input[placeholder*="code"]', { timeout: 30000 });

    // Pause for user to enter 2FA code manually
    console.log('\n' + '='.repeat(60));
    console.log('2FA CODE REQUIRED');
    console.log('1. Check your phone for SMS from Hive');
    console.log('2. Enter the 6-digit code in the browser');
    console.log('3. Click Verify in the app');
    console.log('4. Click "Resume" in Playwright inspector when done');
    console.log('='.repeat(60) + '\n');
    await page.pause();

    // Should complete login and show Hive tiles grid
    await page.waitForSelector('[data-testid="hive-tiles-grid"], .hive-view .tiles-grid', {
      timeout: 30000,
    });

    console.log('\n' + '='.repeat(60));
    console.log('LOGIN COMPLETE - Successfully connected to Hive!');
    console.log('='.repeat(60) + '\n');
  });

  test('should show Hive status after login', async ({ page }) => {
    // Check Hive connection status via API
    let hiveStatus;
    try {
      hiveStatus = await api.getHiveConnection();
    } catch {
      test.skip(true, 'Hive connection endpoint not available');
      return;
    }

    if (!hiveStatus.connected) {
      test.skip(true, 'Hive not connected - run login tests first');
    }

    await page.goto('/');
    await page.waitForSelector('.dashboard, .light-control, .main-panel', {
      timeout: 15000,
    });

    // Look for Hive view with tiles grid
    const hiveControls = page.locator(
      '[data-testid="hive-tiles-grid"], .hive-view .tiles-grid, .hive-tile'
    );
    const count = await hiveControls.count();

    expect(count).toBeGreaterThan(0);
    prompts.showInfo('Hive Controls', `Found ${count} Hive control(s) on dashboard`);
  });
});

test.describe('Hive Login - Error Handling', () => {
  test.use({ viewport: VIEWPORTS.raspberryPi });

  test('should show error for invalid credentials', async ({ page }) => {
    await api.resetToFresh();
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await page.waitForSelector('.settings-page', { timeout: 10000 });
    const hiveToggle = page.locator('.service-toggle').filter({ hasText: 'Hive Heating' });
    await hiveToggle.click();
    await page.waitForSelector('.hive-login, .hive-auth, form', { timeout: 10000 });

    // Enter invalid credentials
    const emailInput = page.getByPlaceholder(/email/i);
    const passwordInput = page.getByPlaceholder(/password/i);

    await emailInput.fill('invalid@example.com');
    await passwordInput.fill('wrongpassword123');

    const loginButton = page.getByRole('button', { name: /connect|login|sign in/i });
    await loginButton.click();

    // Should show error message
    const errorMessage = page.getByText(/error|invalid|incorrect|failed/i);
    await expect(errorMessage.first()).toBeVisible({ timeout: 30000 });
  });

  test('should show error for invalid 2FA code', async ({ page }) => {
    // Requires HIVE_EMAIL and HIVE_PASSWORD env vars
    const email = process.env.HIVE_EMAIL;
    const password = process.env.HIVE_PASSWORD;
    if (!email || !password) {
      test.skip(true, 'Set HIVE_EMAIL and HIVE_PASSWORD env vars to run this test');
    }

    // Skip if already connected (no need to test)
    let hiveStatus;
    try {
      hiveStatus = await api.getHiveConnection();
      if (hiveStatus.connected) {
        test.skip(true, 'Hive already connected');
      }
    } catch {
      // Not connected, which is what we want for this test
    }

    await api.resetToFresh();
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await page.waitForSelector('.settings-page', { timeout: 10000 });
    const hiveToggle = page.locator('.service-toggle').filter({ hasText: 'Hive Heating' });
    await hiveToggle.click();
    await page.waitForSelector('.hive-login, .hive-auth, form', { timeout: 10000 });

    // Use credentials from env vars
    const emailInput = page.getByPlaceholder(/email/i);
    const passwordInput = page.getByPlaceholder(/password/i);
    await emailInput.fill(email!);
    await passwordInput.fill(password!);

    const loginButton = page.getByRole('button', { name: /connect|login|sign in/i });
    await loginButton.click();

    // Wait for 2FA prompt
    await page.waitForSelector(
      'input[placeholder*="code"], input[placeholder*="2FA"], .verification-code',
      { timeout: 30000 }
    );

    // Enter wrong 2FA code
    console.log('\n' + '!'.repeat(60));
    console.log('WARNING: Entering INVALID 2FA code to test error handling');
    console.log('You will receive a real SMS - do NOT enter that code');
    console.log('!'.repeat(60) + '\n');

    const codeInput = page
      .locator('input[placeholder*="code"], input[placeholder*="2FA"], .verification-code input')
      .first();
    await codeInput.fill('000000');

    const verifyButton = page.getByRole('button', { name: /verify|submit|confirm/i });
    await verifyButton.click();

    // Should show error
    const errorMessage = page.getByText(/error|invalid|incorrect|wrong/i);
    await expect(errorMessage.first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Hive Login - Layout Checks', () => {
  test.use({ viewport: VIEWPORTS.raspberryPi });

  test('login form should fit on Raspberry Pi screen', async ({ page }) => {
    await api.resetToFresh();
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await page.waitForSelector('.settings-page', { timeout: 10000 });
    const hiveToggle = page.locator('.service-toggle').filter({ hasText: 'Hive Heating' });
    await hiveToggle.click();
    await page.waitForSelector('.hive-login, .hive-auth, form', { timeout: 10000 });

    // Check no scrolling needed
    const needsScroll = await page.evaluate(() => {
      return document.documentElement.scrollHeight > document.documentElement.clientHeight;
    });

    expect(needsScroll).toBe(false);
  });

  test('input fields should have adequate touch targets', async ({ page }) => {
    await api.resetToFresh();
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await page.waitForSelector('.settings-page', { timeout: 10000 });
    const hiveToggle = page.locator('.service-toggle').filter({ hasText: 'Hive Heating' });
    await hiveToggle.click();
    await page.waitForSelector('.hive-login, .hive-auth, form', { timeout: 10000 });

    const emailInput = page.getByPlaceholder(/email/i);
    const passwordInput = page.getByPlaceholder(/password/i);

    const emailBox = await emailInput.boundingBox();
    const passwordBox = await passwordInput.boundingBox();

    expect(emailBox).not.toBeNull();
    expect(passwordBox).not.toBeNull();

    // On compact screens (≤480px height), touch targets are 36px instead of 44px
    expect(emailBox!.height).toBeGreaterThanOrEqual(LAYOUT.MIN_BUTTON_SIZE_COMPACT);
    expect(passwordBox!.height).toBeGreaterThanOrEqual(LAYOUT.MIN_BUTTON_SIZE_COMPACT);
  });

  test('login button should have adequate touch target', async ({ page }) => {
    await api.resetToFresh();
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await page.waitForSelector('.settings-page', { timeout: 10000 });
    const hiveToggle = page.locator('.service-toggle').filter({ hasText: 'Hive Heating' });
    await hiveToggle.click();
    await page.waitForSelector('.hive-login, .hive-auth, form', { timeout: 10000 });

    const loginButton = page.getByRole('button', { name: /connect|login|sign in/i });
    const buttonBox = await loginButton.boundingBox();

    expect(buttonBox).not.toBeNull();
    // On compact screens (≤480px height), touch targets are 36px instead of 44px
    expect(buttonBox!.width).toBeGreaterThanOrEqual(LAYOUT.MIN_BUTTON_SIZE_COMPACT * 2);
    expect(buttonBox!.height).toBeGreaterThanOrEqual(LAYOUT.MIN_BUTTON_SIZE_COMPACT);
  });
});
