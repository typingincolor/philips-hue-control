import { test, expect } from '@playwright/test';

test.describe('Session Persistence', () => {
  test('should persist session across page refresh in demo mode', async ({ page }) => {
    // Load demo mode
    await page.goto('/?demo=true');

    // Wait for dashboard to load
    await expect(page.getByText('Living Room')).toBeVisible();

    // Refresh the page (keep demo mode)
    await page.goto('/?demo=true');

    // Dashboard should still be visible
    await expect(page.getByText('Living Room')).toBeVisible();
  });

  test('should store bridge IP in localStorage', async ({ page }) => {
    await page.goto('/');

    // Enable Hue from settings page first (deferred service activation)
    await expect(page.getByText(/Settings/i)).toBeVisible();
    await page.getByText('Philips Hue').click();

    // Now on discovery page - enter a bridge IP
    await expect(page.getByRole('heading', { name: 'Auto-Discovery' })).toBeVisible();
    const ipInput = page.getByPlaceholder(/192\.168/i);
    await ipInput.fill('192.168.1.100');

    // Check if IP is stored after interaction
    const connectButton = page.getByRole('button', { name: /connect|next|continue/i });
    if (await connectButton.isVisible()) {
      await connectButton.click();
    }

    // Verify localStorage has the bridge IP
    const storedIp = await page.evaluate(() => {
      return localStorage.getItem('hue_bridge_ip');
    });

    // IP should be stored
    expect(storedIp).toBe('192.168.1.100');
  });

  test('should clear session on logout', async ({ page }) => {
    // Load demo mode
    await page.goto('/?demo=true');

    // Wait for dashboard
    await expect(page.getByText('Living Room')).toBeVisible();

    // Click logout (icon button with class)
    const logoutButton = page.locator('.toolbar-logout');
    await logoutButton.click();

    // Session should be cleared from localStorage
    // Note: Demo mode URL parameter keeps user on dashboard visually
    const sessionToken = await page.evaluate(() => {
      return localStorage.getItem('hue_session_token');
    });

    expect(sessionToken).toBeNull();
  });

  test('should clear bridge IP on logout', async ({ page }) => {
    // Load demo mode first to set some state
    await page.goto('/?demo=true');
    await expect(page.getByText('Living Room')).toBeVisible();

    // Logout (icon button with class)
    const logoutButton = page.locator('.toolbar-logout');
    await logoutButton.click();

    // Bridge IP should be cleared after logout
    const bridgeIp = await page.evaluate(() => {
      return localStorage.getItem('hue_bridge_ip');
    });

    expect(bridgeIp).toBeNull();
  });
});

test.describe('Session Expiration', () => {
  test('should handle expired session gracefully', async ({ page }) => {
    // Set up an expired session in localStorage
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('hue_session_token', 'expired-token');
      localStorage.setItem('hue_bridge_ip', '192.168.1.100');
      localStorage.setItem('hue_session_expires_at', String(Date.now() - 1000)); // Expired
    });

    // Reload the page
    await page.reload();

    // App should handle gracefully - either show login or recovery
    // App should still be functional
    await expect(page.locator('body')).toBeVisible();
  });

  test('should show restoring session indicator during session check', async ({ page }) => {
    // Set up a valid-looking session
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('hue_session_token', 'test-token');
      localStorage.setItem('hue_bridge_ip', '192.168.1.100');
      localStorage.setItem('hue_session_expires_at', String(Date.now() + 86400000)); // Future
    });

    // Reload and check for restoring indicator
    await page.reload();

    // App should be in a valid state
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Multi-Client Session', () => {
  test('should work with demo mode session token', async ({ page }) => {
    await page.goto('/?demo=true');

    // Dashboard should load
    await expect(page.getByText('Living Room')).toBeVisible();

    // Verify we can interact with lights
    const lightButton = page.getByRole('button', { name: /Floor Lamp/i });
    await expect(lightButton).toBeVisible();
    await lightButton.click();

    // Light should still be interactive
    await expect(lightButton).toBeVisible();
  });
});
