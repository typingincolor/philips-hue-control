import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 800, height: 480 } });
const page = await context.newPage();

await page.goto('http://localhost:5173/?demo=true');
await page.waitForTimeout(3000);

const spotifyTab = page.locator('button:has-text("Spotify")');
await spotifyTab.click();
await page.waitForTimeout(1000);

await page.screenshot({ path: '/tmp/spotify-test.png' });
console.log('Screenshot saved');

await browser.close();
