import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 820, height: 1_080 },
  { name: 'desktop', width: 1_440, height: 1_000 },
];

for (const theme of ['dark', 'light']) {
  for (const viewport of viewports) {
    test(`representative article remains readable in ${theme} at ${viewport.name} width`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.addInitScript((selectedTheme) => {
        localStorage.setItem('starlight-theme', selectedTheme);
      }, theme);
      await page.goto('http://127.0.0.1:4321/degel-system/errack/', { waitUntil: 'networkidle' });
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expect(page.getByRole('heading', { level: 1, name: 'Errack' })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);

      const layout = await page.evaluate(() => ({
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        mainWidth: document.querySelector('main')?.getBoundingClientRect().width ?? 0,
      }));
      expect(layout.horizontalOverflow).toBe(false);
      expect(layout.mainWidth).toBeGreaterThan(280);
    });
  }
}

for (const { theme, name, width, height } of [
  { theme: 'dark', name: 'mobile', width: 390, height: 844 },
  { theme: 'light', name: 'desktop', width: 1_440, height: 1_000 },
]) {
  test(`Start Here retains its editorial layout and controls in ${theme} at ${name} width`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.addInitScript((selectedTheme) => {
      localStorage.setItem('starlight-theme', selectedTheme);
    }, theme);
    await page.goto('http://127.0.0.1:4321/start-here/', { waitUntil: 'networkidle' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await expect(page.locator('.start-here-primer')).toBeVisible();

    await page.locator('[data-breadcrumb-group="era"] [data-value="citadel"]').click();
    await page.locator('[data-breadcrumb-group="world"] [data-value="danger"]').click();
    await page.locator('[data-breadcrumb-group="thread"] [data-value="resonance"]').click();
    await expect(page.locator('.start-route-card')).toHaveCount(3);
    expect(await page.evaluate(() => (
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    ))).toBe(false);
  });
}
