import { test, expect } from '@playwright/test';

const routes = [
  ['/degel-system/errack/', '.codex-page-title'],
  ['/maps/', '.atlas-index'],
  ['/relationships/', '.relationship-page'],
  ['/graph/', '.world-graph'],
  ['/calendar/', '.calendar-module'],
  ['/eras/citadel/events/', '.codex-alpha-index'],
  ['/support/', '.support-page'],
  ['/contact/', '.contact-page'],
  ['/', '.home-gateway'],
  ['/start-here/', '.start-here-primer'],
];

for (const [name, viewport] of [
  ['desktop', { width: 1440, height: 1000 }],
  ['mobile', { width: 390, height: 844 }],
]) {
  test(`published route matrix remains visible and unclipped on ${name}`, async ({ page }) => {
    await page.setViewportSize(viewport);

    for (const [path, selector] of routes) {
      const response = await page.goto(`http://127.0.0.1:4321${path}`, { waitUntil: 'domcontentloaded' });
      expect(response?.ok(), path).toBe(true);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator(selector).first(), path).toBeVisible();

      const geometry = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        mainTextLength: document.querySelector('main')?.textContent?.trim().length ?? 0,
      }));
      expect(geometry.scrollWidth, `${path} horizontal overflow`).toBeLessThanOrEqual(geometry.clientWidth + 1);
      expect(geometry.mainTextLength, `${path} visible content`).toBeGreaterThan(40);
    }
  });
}
