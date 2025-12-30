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

  test('should submit credentials and receive 2FA prompt', async ({ page }) => {
    // Navigate to Hive login
    await api.resetToFresh();
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await page.waitForSelector('.settings-page', { timeout: 10000 });
    const hiveToggle = page.locator('.service-toggle').filter({ hasText: 'Hive Heating' });
    await hiveToggle.click();
    await page.waitForSelector('.hive-login, .hive-auth, form', { timeout: 10000 });

    // Get credentials from user
    const creds = await stateManager.getHiveCredentials();

    // Fill in credentials
    const emailInput = page.getByPlaceholder(/email/i);
    const passwordInput = page.getByPlaceholder(/password/i);

    await emailInput.fill(creds.username);
    await passwordInput.fill(creds.password);

    // Submit login
    const loginButton = page.getByRole('button', { name: /connect|login|sign in/i });
    await loginButton.click();

    // Should show 2FA input
    await page.waitForSelector(
      'input[placeholder*="code"], input[placeholder*="2FA"], .verification-code',
      { timeout: 30000 }
    );

    prompts.showInfo('2FA Required', 'Check your phone for the SMS verification code from Hive');
  });

  test('should complete login with 2FA code', async ({ page }) => {
    // This test continues from the previous one
    // Navigate to Hive login
    await api.resetToFresh();
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await page.waitForSelector('.settings-page', { timeout: 10000 });
    const hiveToggle = page.locator('.service-toggle').filter({ hasText: 'Hive Heating' });
    await hiveToggle.click();
    await page.waitForSelector('.hive-login, .hive-auth, form', { timeout: 10000 });

    // Get credentials
    const creds = await stateManager.getHiveCredentials();

    // Fill and submit credentials
    const emailInput = page.getByPlaceholder(/email/i);
    const passwordInput = page.getByPlaceholder(/password/i);
    await emailInput.fill(creds.username);
    await passwordInput.fill(creds.password);

    const loginButton = page.getByRole('button', { name: /connect|login|sign in/i });
    await loginButton.click();

    // Wait for 2FA prompt
    await page.waitForSelector(
      'input[placeholder*="code"], input[placeholder*="2FA"], .verification-code',
      { timeout: 30000 }
    );

    // Get 2FA code from user
    const code = await prompts.prompt2FACode();

    // Enter the 2FA code
    const codeInput = page
      .locator('input[placeholder*="code"], input[placeholder*="2FA"], .verification-code input')
      .first();
    await codeInput.fill(code);

    // Submit 2FA
    const verifyButton = page.getByRole('button', { name: /verify|submit|confirm/i });
    await verifyButton.click();

    // Should complete login and show Hive connected
    await page.waitForSelector('.hive-connected, .hive-status, .thermostat', {
      timeout: 30000,
    });

    prompts.showInfo('Login Complete', 'Successfully connected to Hive!');
  });

  test('should show Hive status after login', async ({ page }) => {
    // Check Hive connection status via API
    const hiveStatus = await api.getHiveConnection();

    if (!hiveStatus.connected) {
      test.skip(true, 'Hive not connected - run login tests first');
    }

    await page.goto('/');
    await page.waitForSelector('.dashboard, .light-control, .main-panel', {
      timeout: 15000,
    });

    // Look for Hive/thermostat controls
    const hiveControls = page.locator(
      '.thermostat, .hive-control, .heating-control, [data-service="hive"]'
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
    // This test needs valid credentials to reach 2FA stage
    const hiveStatus = await api.getHiveConnection();

    // Skip if already connected (no need to test)
    if (hiveStatus.connected) {
      test.skip(true, 'Hive already connected');
    }

    await api.resetToFresh();
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await page.waitForSelector('.settings-page', { timeout: 10000 });
    const hiveToggle = page.locator('.service-toggle').filter({ hasText: 'Hive Heating' });
    await hiveToggle.click();
    await page.waitForSelector('.hive-login, .hive-auth, form', { timeout: 10000 });

    // Get real credentials to reach 2FA
    const creds = await stateManager.getHiveCredentials();

    const emailInput = page.getByPlaceholder(/email/i);
    const passwordInput = page.getByPlaceholder(/password/i);
    await emailInput.fill(creds.username);
    await passwordInput.fill(creds.password);

    const loginButton = page.getByRole('button', { name: /connect|login|sign in/i });
    await loginButton.click();

    // Wait for 2FA prompt
    await page.waitForSelector(
      'input[placeholder*="code"], input[placeholder*="2FA"], .verification-code',
      { timeout: 30000 }
    );

    // Enter wrong 2FA code
    prompts.showWarning(
      'Entering an INVALID 2FA code to test error handling.\n' +
        'You will receive a real SMS code - do NOT enter it.'
    );

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

    expect(emailBox!.height).toBeGreaterThanOrEqual(LAYOUT.MIN_BUTTON_SIZE);
    expect(passwordBox!.height).toBeGreaterThanOrEqual(LAYOUT.MIN_BUTTON_SIZE);
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
    expect(buttonBox!.width).toBeGreaterThanOrEqual(LAYOUT.MIN_BUTTON_SIZE * 2);
    expect(buttonBox!.height).toBeGreaterThanOrEqual(LAYOUT.MIN_BUTTON_SIZE);
  });
});
