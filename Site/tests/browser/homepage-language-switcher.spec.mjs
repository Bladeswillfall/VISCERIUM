import { test, expect } from '@playwright/test';

for (const path of ['/', '/fr/', '/de/', '/es/', '/zh/', '/ru/', '/ja/']) {
  test(`language switcher stays in the header on ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 920 });
    await page.goto(`http://127.0.0.1:4321${path}`, { waitUntil: 'domcontentloaded' });

    const headerMenu = page.locator('.codex-header [data-codex-language-menu]');
    const settings = page.locator('.codex-header [data-reader-settings-trigger]');

    await expect(headerMenu).toBeVisible();
    await expect(page.locator('.home-gateway [data-codex-language-menu]')).toHaveCount(0);

    const [menuBox, settingsBox] = await Promise.all([
      headerMenu.boundingBox(),
      settings.boundingBox(),
    ]);
    expect(menuBox).not.toBeNull();
    expect(settingsBox).not.toBeNull();
    expect(Math.abs(menuBox.y - settingsBox.y)).toBeLessThan(4);
    expect(menuBox.x).toBeGreaterThan(settingsBox.x);
  });
}

test('language switcher is not mounted on ordinary Codex pages', async ({ page }) => {
  await page.goto('http://127.0.0.1:4321/start-here/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-codex-language-menu]')).toHaveCount(0);
});


test('language menu shows a flag for every test language', async ({ page }) => {
  await page.goto('http://127.0.0.1:4321/', { waitUntil: 'domcontentloaded' });
  const menu = page.locator('[data-codex-language-menu]');
  await menu.locator('summary').click();
  await expect(menu.locator('.codex-language-menu__flag')).toHaveCount(7);
});

test('Japanese homepage localizes the shared shell', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 920 });
  await page.goto('http://127.0.0.1:4321/ja/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('.codex-search-trigger')).toContainText('検索');
  await expect(page.locator('[data-sidebar-row="Eras"] .large').first()).toHaveText('時代');
  await expect(page.locator('.footer-wayfinder__primary')).toHaveText('ここから始める');
  await expect(page.locator('.policy-link__title')).toHaveText('コンテンツと制作に関する声明');

  await page.locator('[data-reader-settings-trigger]').click();
  await expect(page.locator('#reader-settings-title')).toHaveText('閲覧設定');
  await expect(page.locator('[data-reader-theme-group] legend')).toContainText('表示');
});
