import { test, expect } from '@playwright/test';

/**
 * Timeout Configuration E2E Tests
 *
 * These tests verify that the 2-second timeout requirement is met.
 * Tests should fail within 2 seconds when waiting for non-existent elements.
 *
 * IMPORTANT: These tests are designed to FAIL until timeout configuration is updated.
 * After configuration, the "should fail within 2 seconds" tests should pass,
 * demonstrating that timeouts are properly configured.
 */

test.describe('Timeout Configuration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?demo=true');
    // Wait for page to be ready - use longer timeout for navigation/load
    await page.waitForSelector('.main-panel', { timeout: 5000 });
  });

  test('should fail within 2 seconds for non-existent element', async ({ page }) => {
    // This test verifies the 2s timeout requirement
    // It should complete (pass or fail) in roughly 2 seconds, not 30 seconds

    const startTime = Date.now();

    try {
      // Wait for a non-existent element - this SHOULD fail
      await expect(page.locator('.non-existent-element-12345')).toBeVisible();
      // If we get here, something is wrong
      throw new Error('Expected toBeVisible to fail for non-existent element');
    } catch {
      const elapsedTime = Date.now() - startTime;

      // The timeout should be ~2000ms (with some tolerance for execution overhead)
      // Currently defaults to 5000ms, so this test will FAIL until config is updated
      expect(elapsedTime).toBeLessThan(2500); // 2s + 500ms tolerance
      expect(elapsedTime).toBeGreaterThan(1500); // Should wait at least 1.5s
    }
  });

  test('should fail within 2 seconds for waitForSelector', async ({ page }) => {
    const startTime = Date.now();

    try {
      // waitForSelector should also respect the 2s timeout
      await page.waitForSelector('.non-existent-selector-67890');
      throw new Error('Expected waitForSelector to fail for non-existent element');
    } catch {
      const elapsedTime = Date.now() - startTime;

      // Action timeout should be ~2000ms
      expect(elapsedTime).toBeLessThan(2500);
      expect(elapsedTime).toBeGreaterThan(1500);
    }
  });

  test('existing elements should still be found quickly', async ({ page }) => {
    // Verify that reducing timeouts doesn't break finding real elements
    // Use .main-panel which we already waited for in beforeEach
    const startTime = Date.now();

    await expect(page.locator('.main-panel')).toBeVisible();

    const elapsedTime = Date.now() - startTime;

    // Element we already waited for should be found instantly
    expect(elapsedTime).toBeLessThan(500);
  });
});

test.describe('Timeout Configuration - Navigation', () => {
  test('page navigation should complete within reasonable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/?demo=true');
    await expect(page.locator('.main-panel')).toBeVisible();

    const elapsedTime = Date.now() - startTime;

    // Navigation + initial render should be fast in demo mode
    expect(elapsedTime).toBeLessThan(3000);
  });
});
