import { test, expect } from '@playwright/test';

const preview = 'http://127.0.0.1:4321';

test('published canon articles expose IndieWeb microformats', async ({ page }) => {
  await page.goto(`${preview}/degel-system/errack/`, { waitUntil: 'domcontentloaded' });

  const entry = page.locator('.codex-two-column-content.h-entry');
  await expect(entry).toHaveCount(1);

  const content = entry.locator('.sl-markdown-content.e-content');
  await expect(content).toHaveCount(1);
  await expect(content.locator('.right-sidebar-container')).toHaveCount(0);
  await expect(entry.locator('.p-name')).toHaveText('Errack');
  await expect(entry.locator('.u-url')).toHaveAttribute(
    'href',
    'https://www.viscerium.co.uk/degel-system/errack/',
  );

  const card = page.locator('.codex-header .h-card');
  await expect(card).toHaveCount(1);
  await expect(card.locator('.p-name')).toHaveText('VISCERIUM');
  await expect(card.locator('.u-url')).toHaveAttribute('href', 'https://www.viscerium.co.uk');
});

test('the homepage is not exposed as an article entry', async ({ page }) => {
  await page.goto(preview, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.h-entry')).toHaveCount(0);
});
