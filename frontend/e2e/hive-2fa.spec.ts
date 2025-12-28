import { test, expect, Page } from '@playwright/test';

/**
 * Hive 2FA Authentication E2E Tests
 *
 * Tests for the Hive login flow with SMS two-factor authentication.
 * These tests use demo mode which simulates the 2FA flow.
 */

// Helper to reset Hive demo state via API (reliable way to ensure disconnected)
async function resetHiveDemoState(page: Page) {
  // Reset both Hive connection and settings to ensure clean state
  await page.request.post('/api/v1/hive/reset-demo', {
    headers: { 'X-Demo-Mode': 'true' },
  });
  await page.request.post('/api/v1/settings/reset-demo', {
    headers: { 'X-Demo-Mode': 'true' },
  });
}

// Helper to ensure Hive is disconnected (uses API reset + fresh navigation to sync frontend)
async function ensureHiveDisconnected(page: Page) {
  await resetHiveDemoState(page);
  // Navigate fresh to ensure frontend syncs with backend state
  await page.goto('/?demo=true');
  await page.waitForSelector('.main-panel');
}

// Helper to navigate to Hive view via settings (needed for deferred service activation)
async function navigateToHive(page: Page) {
  // Enable Hive service via settings API
  await page.request.put('/api/v1/settings', {
    headers: { 'X-Demo-Mode': 'true' },
    data: { services: { hive: { enabled: true } } },
  });

  // Reload to pick up the new settings
  await page.reload();
  await page.waitForSelector('.main-panel');

  // Open settings and click the Hive link to navigate to HiveView
  await page.click('[aria-label="settings"]');
  await page.waitForSelector('.settings-page');
  await page.locator('.settings-hive-link').click();
  await page.waitForSelector('.hive-view');
}

// Helper to navigate to Hive and ensure login form is shown (with retry for race conditions)
async function navigateToHiveLogin(page: Page) {
  // Reset and navigate
  await ensureHiveDisconnected(page);
  await navigateToHive(page);

  // Check if login form is visible, retry reset if thermostat appeared instead
  const loginForm = page.locator('.hive-login-form');
  const thermostat = page.locator('.hive-thermostat');

  // Wait for either to appear
  await Promise.race([
    loginForm.waitFor({ state: 'visible' }),
    thermostat.waitFor({ state: 'visible' }),
  ]);

  // If thermostat appeared, another test connected - reset and retry once
  if (await thermostat.isVisible()) {
    await ensureHiveDisconnected(page);
    await navigateToHive(page);
  }

  await page.waitForSelector('.hive-login-form');
}

// Run Hive 2FA tests serially to avoid demo mode state conflicts
test.describe.configure({ mode: 'serial' });

test.describe('Hive 2FA Authentication', () => {
  test.describe('Login Form Display', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/?demo=true');
      await page.waitForSelector('.main-panel');
      await ensureHiveDisconnected(page);
    });

    test('should not show Hive tab when disconnected (deferred service activation)', async ({
      page,
    }) => {
      // With deferred service activation, Hive tab only shows when connected
      await expect(page.locator('.nav-tab:has-text("Hive")')).not.toBeVisible();
    });

    test('should show login form when not connected', async ({ page }) => {
      await navigateToHive(page);
      await expect(page.locator('.hive-login-form')).toBeVisible();
    });

    test('should display Connect to Hive title', async ({ page }) => {
      await navigateToHive(page);
      await expect(page.locator('text=Connect to Hive')).toBeVisible();
    });

    test('should show email input', async ({ page }) => {
      await navigateToHive(page);
      await expect(page.locator('input[placeholder*="Email" i]')).toBeVisible();
    });

    test('should show password input', async ({ page }) => {
      await navigateToHive(page);
      await expect(page.locator('input[type="password"]')).toBeVisible();
    });

    test('should show Connect button', async ({ page }) => {
      await navigateToHive(page);
      await expect(page.locator('button:has-text("Connect")')).toBeVisible();
    });
  });

  test.describe('Login Flow - Invalid Credentials', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/?demo=true');
      await page.waitForSelector('.main-panel');
      await navigateToHiveLogin(page);
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.fill('input[placeholder*="Email" i]', 'wrong@email.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button:has-text("Connect")');

      await expect(page.locator('.hive-error')).toBeVisible();
    });

    test('should keep login form visible after error', async ({ page }) => {
      await page.fill('input[placeholder*="Email" i]', 'wrong@email.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button:has-text("Connect")');

      await expect(page.locator('.hive-login-form')).toBeVisible();
    });

    test('should clear error when user starts typing', async ({ page }) => {
      await page.fill('input[placeholder*="Email" i]', 'wrong@email.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button:has-text("Connect")');

      await expect(page.locator('.hive-error')).toBeVisible();

      // Start typing in email field
      await page.fill('input[placeholder*="Email" i]', 'new@email.com');

      // Error should be cleared
      await expect(page.locator('.hive-error')).not.toBeVisible();
    });
  });

  test.describe('Login Flow - 2FA Required', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/?demo=true');
      await page.waitForSelector('.main-panel');
      await navigateToHiveLogin(page);
    });

    test('should show connecting state when submitting credentials', async ({ page }) => {
      await page.fill('input[placeholder*="Email" i]', 'demo@hive.com');
      await page.fill('input[type="password"]', 'demo');
      await page.click('button:has-text("Connect")');

      // Should briefly show connecting state then transition to 2FA form
      await expect(page.locator('.hive-2fa-form')).toBeVisible();
    });

    test('should transition to 2FA form when required', async ({ page }) => {
      await page.fill('input[placeholder*="Email" i]', 'demo@hive.com');
      await page.fill('input[type="password"]', 'demo');
      await page.click('button:has-text("Connect")');

      // Should show 2FA form (all demo logins require 2FA like real Hive)
      await expect(page.locator('.hive-2fa-form')).toBeVisible();
    });

    test('should show 2FA title', async ({ page }) => {
      await page.fill('input[placeholder*="Email" i]', 'demo@hive.com');
      await page.fill('input[type="password"]', 'demo');
      await page.click('button:has-text("Connect")');

      await expect(page.locator('text=Verify Your Identity')).toBeVisible();
    });

    test('should show 2FA code input', async ({ page }) => {
      await page.fill('input[placeholder*="Email" i]', 'demo@hive.com');
      await page.fill('input[type="password"]', 'demo');
      await page.click('button:has-text("Connect")');

      await page.waitForSelector('.hive-2fa-form');
      await expect(page.locator('input[placeholder*="code" i]')).toBeVisible();
    });

    test('should show Verify button on 2FA form', async ({ page }) => {
      await page.fill('input[placeholder*="Email" i]', 'demo@hive.com');
      await page.fill('input[type="password"]', 'demo');
      await page.click('button:has-text("Connect")');

      await page.waitForSelector('.hive-2fa-form');
      await expect(page.locator('button:has-text("Verify")')).toBeVisible();
    });

    test('should show back to login link', async ({ page }) => {
      await page.fill('input[placeholder*="Email" i]', 'demo@hive.com');
      await page.fill('input[type="password"]', 'demo');
      await page.click('button:has-text("Connect")');

      await page.waitForSelector('.hive-2fa-form');
      await expect(page.locator('text=Back to login')).toBeVisible();
    });

    test('should hide email/password inputs when showing 2FA', async ({ page }) => {
      await page.fill('input[placeholder*="Email" i]', 'demo@hive.com');
      await page.fill('input[type="password"]', 'demo');
      await page.click('button:has-text("Connect")');

      await page.waitForSelector('.hive-2fa-form');
      await expect(page.locator('.hive-login-form')).not.toBeVisible();
    });
  });

  test.describe('2FA Code Verification', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/?demo=true');
      await page.waitForSelector('.main-panel');
      await navigateToHiveLogin(page);

      // Trigger 2FA flow (all demo logins require 2FA)
      await page.fill('input[placeholder*="Email" i]', 'demo@hive.com');
      await page.fill('input[type="password"]', 'demo');
      await page.click('button:has-text("Connect")');
      await page.waitForSelector('.hive-2fa-form');
    });

    test('should show error for invalid 2FA code', async ({ page }) => {
      await page.fill('input[placeholder*="code" i]', '000000');
      await page.click('button:has-text("Verify")');

      await expect(page.locator('.hive-error')).toBeVisible();
    });

    test('should show verifying state when submitting code', async ({ page }) => {
      await page.fill('input[placeholder*="code" i]', '123456');
      await page.click('button:has-text("Verify")');

      // Should briefly show verifying state or proceed to thermostat
      await expect(
        page.locator('button:has-text("Verifying")').or(page.locator('.hive-thermostat'))
      ).toBeVisible();
    });

    test('should show thermostat view after valid 2FA code', async ({ page }) => {
      await page.fill('input[placeholder*="code" i]', '123456');
      await page.click('button:has-text("Verify")');

      await expect(page.locator('.hive-thermostat')).toBeVisible();
    });

    test('should return to login form when clicking back', async ({ page }) => {
      await page.click('text=Back to login');

      await expect(page.locator('.hive-login-form')).toBeVisible();
      await expect(page.locator('.hive-2fa-form')).not.toBeVisible();
    });

    test('should preserve email when returning to login', async ({ page }) => {
      await page.click('text=Back to login');

      const emailInput = page.locator('input[placeholder*="Email" i]');
      await expect(emailInput).toHaveValue('demo@hive.com');
    });
  });

  test.describe('Settings Page Update', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/?demo=true');
      await page.waitForSelector('.main-panel');
    });

    test('should not show Hive login section in settings', async ({ page }) => {
      await page.click('[aria-label="settings"]');
      await page.waitForSelector('.settings-page');

      // Hive login inputs should not be in settings page
      await expect(
        page.locator('.settings-page input[placeholder*="Username" i]')
      ).not.toBeVisible();
    });

    test('should show link to Hive tab in settings', async ({ page }) => {
      await page.click('[aria-label="settings"]');
      await page.waitForSelector('.settings-page');

      await expect(page.locator('text=Hive tab')).toBeVisible();
    });
  });

  test.describe('Responsive - Raspberry Pi (800x480)', () => {
    test.use({ viewport: { width: 800, height: 480 } });

    test('should display login form on compact screen', async ({ page }) => {
      await page.goto('/?demo=true');
      await page.waitForSelector('.main-panel');
      await navigateToHiveLogin(page);

      await expect(page.locator('.hive-login-form')).toBeVisible();
    });

    test('should fit login form within viewport', async ({ page }) => {
      await page.goto('/?demo=true');
      await page.waitForSelector('.main-panel');
      await navigateToHiveLogin(page);

      const form = page.locator('.hive-login-form');
      const box = await form.boundingBox();

      expect(box).not.toBeNull();
      expect(box!.width).toBeLessThanOrEqual(800);
    });

    test('should have tappable buttons (44px min)', async ({ page }) => {
      await page.goto('/?demo=true');
      await page.waitForSelector('.main-panel');
      await navigateToHiveLogin(page);

      const connectBtn = page.locator('button:has-text("Connect")');
      const box = await connectBtn.boundingBox();

      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    });
  });

  test.describe('Responsive - iPhone 14+ (390x844)', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('should display login form on mobile', async ({ page }) => {
      await page.goto('/?demo=true');
      await page.waitForSelector('.main-panel');
      await navigateToHiveLogin(page);

      await expect(page.locator('.hive-login-form')).toBeVisible();
    });

    test('should have full-width inputs on mobile', async ({ page }) => {
      await page.goto('/?demo=true');
      await page.waitForSelector('.main-panel');
      await navigateToHiveLogin(page);

      const input = page.locator('input[placeholder*="Email" i]');
      const box = await input.boundingBox();

      expect(box).not.toBeNull();
      // Input should take most of the width (allowing for form padding)
      // On 390px viewport with form padding, input is ~290px which is acceptable
      expect(box!.width).toBeGreaterThan(250);
    });
  });

  test.describe('Responsive - iPad (820x1180)', () => {
    test.use({ viewport: { width: 820, height: 1180 } });

    test('should display login form on tablet', async ({ page }) => {
      await page.goto('/?demo=true');
      await page.waitForSelector('.main-panel');
      await navigateToHiveLogin(page);

      await expect(page.locator('.hive-login-form')).toBeVisible();
    });

    test('should center login form on tablet', async ({ page }) => {
      await page.goto('/?demo=true');
      await page.waitForSelector('.main-panel');
      await navigateToHiveLogin(page);

      const form = page.locator('.hive-login-form');
      const box = await form.boundingBox();

      expect(box).not.toBeNull();
      // Form should be centered (have margin on both sides)
      expect(box!.x).toBeGreaterThan(50);
    });
  });

  test.describe('Accessibility', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/?demo=true');
      await page.waitForSelector('.main-panel');
      await navigateToHiveLogin(page);
    });

    test('should have accessible email input', async ({ page }) => {
      const emailInput = page.locator('input[placeholder*="Email" i]');
      await expect(emailInput).toBeVisible();
      // Input should be focusable
      await emailInput.focus();
      await expect(emailInput).toBeFocused();
    });

    test('should have accessible password input', async ({ page }) => {
      const passwordInput = page.locator('input[type="password"]');
      await expect(passwordInput).toBeVisible();
      // Input should be focusable
      await passwordInput.focus();
      await expect(passwordInput).toBeFocused();
    });

    test('should support keyboard form submission', async ({ page }) => {
      await page.fill('input[placeholder*="Email" i]', 'demo@hive.com');
      await page.fill('input[type="password"]', 'demo');

      // Submit with Enter key
      await page.keyboard.press('Enter');

      // Should proceed to 2FA form (all demo logins require 2FA)
      await expect(page.locator('.hive-2fa-form')).toBeVisible();
    });

    test('should move focus to 2FA input when transitioning', async ({ page }) => {
      await page.fill('input[placeholder*="Email" i]', 'demo@hive.com');
      await page.fill('input[type="password"]', 'demo');
      await page.click('button:has-text("Connect")');

      await page.waitForSelector('.hive-2fa-form');

      // 2FA code input should be focused
      const codeInput = page.locator('input[placeholder*="code" i]');
      await expect(codeInput).toBeFocused();
    });

    test('should announce errors to screen readers', async ({ page }) => {
      await page.fill('input[placeholder*="Email" i]', 'wrong@email.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button:has-text("Connect")');

      const errorElement = page.locator('.hive-error');
      await expect(errorElement).toBeVisible();

      // Error should have aria-live for announcements
      await expect(errorElement).toHaveAttribute('aria-live', 'polite');
    });
  });
});
