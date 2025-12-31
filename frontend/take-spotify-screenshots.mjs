import { chromium } from '@playwright/test';

const viewports = [
  { name: 'rpi', width: 800, height: 480 },
  { name: '832x481', width: 832, height: 481 },  // Just above RPi height
  { name: '832x581', width: 832, height: 581 },
  { name: '900x600', width: 900, height: 600 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
];

const browser = await chromium.launch();

for (const vp of viewports) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await context.newPage();

  await page.goto('http://localhost:5173/?demo=true');
  await page.waitForTimeout(2000);

  const spotifyTab = page.locator('button:has-text("Spotify")');
  await spotifyTab.click();
  await page.waitForTimeout(1000);

  await page.screenshot({ path: `/tmp/spotify-${vp.name}.png` });
  console.log(`Screenshot saved: spotify-${vp.name}.png (${vp.width}x${vp.height})`);

  await context.close();
}

await browser.close();
