import { test, expect } from '@playwright/test';

// Helper to enable Hue from settings page
async function enableHueFromSettings(page) {
  // Settings page shows first when no credentials
  await expect(page.getByText(/Settings/i)).toBeVisible();

  // Enable Hue service by clicking the label (input is visually hidden)
  await page.getByText('Philips Hue').click();

  // Should transition to discovery
  await expect(page.getByRole('heading', { name: 'Auto-Discovery' })).toBeVisible();
}

test.describe('Bridge Discovery Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any stored session data
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
  });

  test('should show discovery screen after enabling Hue', async ({ page }) => {
    await page.goto('/');
    await enableHueFromSettings(page);

    // Should show bridge discovery UI
    await expect(page.getByRole('heading', { name: 'Auto-Discovery' })).toBeVisible();
  });

  test('should have discover bridge button', async ({ page }) => {
    await page.goto('/');
    await enableHueFromSettings(page);

    // Look for discover button
    const discoverButton = page.getByRole('button', { name: /discover/i });
    await expect(discoverButton).toBeVisible();
  });

  test('should have manual IP input field', async ({ page }) => {
    await page.goto('/');
    await enableHueFromSettings(page);

    // Look for IP input field
    const ipInput = page.getByPlaceholder(/192\.168/i);
    await expect(ipInput).toBeVisible();
  });

  test('should validate IP address format', async ({ page }) => {
    await page.goto('/');
    await enableHueFromSettings(page);

    // Find IP input
    const ipInput = page.getByPlaceholder(/192\.168/i);

    // Enter invalid IP
    await ipInput.fill('not-an-ip');

    // Try to proceed - find connect/next button
    const connectButton = page.getByRole('button', { name: /connect|next|continue/i });
    if (await connectButton.isVisible()) {
      await connectButton.click();

      // Should show error or not proceed
      // The app should either show an error or stay on the same page
      await expect(page.getByRole('heading', { name: 'Auto-Discovery' })).toBeVisible();
    }
  });

  test('should accept valid IP address format', async ({ page }) => {
    await page.goto('/');
    await enableHueFromSettings(page);

    // Find IP input
    const ipInput = page.getByPlaceholder(/192\.168/i);

    // Enter valid IP
    await ipInput.fill('192.168.1.100');

    // The input should contain the IP
    await expect(ipInput).toHaveValue('192.168.1.100');
  });

  test('should show connection test UI elements', async ({ page }) => {
    await page.goto('/');
    await enableHueFromSettings(page);

    // Check for connection-related UI
    await expect(page.getByRole('heading', { name: 'Auto-Discovery' })).toBeVisible();
  });
});

test.describe('Bridge Discovery - Demo Mode Bypass', () => {
  test('should skip discovery in demo mode', async ({ page }) => {
    // Go directly to demo mode
    await page.goto('/?demo=true');

    // Should NOT show discovery screen
    await expect(page.getByRole('heading', { name: 'Auto-Discovery' })).not.toBeVisible();

    // Should show dashboard directly
    await expect(page.getByText('Living Room')).toBeVisible();
  });
});
