import { test, expect } from '@playwright/test';

const baseUrl = 'http://127.0.0.1:4321';

test.use({ viewport: { width: 1440, height: 900 } });

test('reader-facing artwork links to attribution records', async ({ page }) => {
  await page.goto(`${baseUrl}/eras/entropy/characters/tpr.-bailey-pittman/`, { waitUntil: 'domcontentloaded' });

  await expect(page.locator('.codex-sidebar-image-link')).toHaveAttribute(
    'href',
    '/attribution/images/bailey-pittman-portrait-webp/',
  );

  const inlineArtwork = page.locator('.vc-image-link');
  await expect(inlineArtwork).toHaveCount(2);
  await expect(inlineArtwork.nth(0)).toHaveAttribute(
    'href',
    '/attribution/images/bailey-pittman-fieldwear-webp/',
  );
  await expect(inlineArtwork.nth(1)).toHaveAttribute(
    'href',
    '/attribution/images/bailey-pittman-prosthetics-webp/',
  );

  await page.goto(`${baseUrl}/degel-system/errack/`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.codex-header-image-link')).toHaveAttribute(
    'href',
    '/attribution/images/errack-header-webp/',
  );
  await expect(page.locator('.codex-sidebar-image-link')).toHaveAttribute(
    'href',
    '/attribution/images/errack-webp/',
  );
});

test('header and sidebar artwork stay centered inside their links', async ({ page }) => {
  await page.goto(`${baseUrl}/eras/entropy/characters/tpr.-bailey-pittman/`, { waitUntil: 'domcontentloaded' });

  const alignment = await page.evaluate(() => {
    const header = document.querySelector('.codex-header-image');
    const sidebar = document.querySelector('.codex-sidebar-image');
    const read = (image) => {
      const style = image ? getComputedStyle(image) : null;
      return style ? {
        marginLeft: style.marginLeft,
        marginRight: style.marginRight,
        objectPosition: style.objectPosition,
      } : null;
    };
    return { header: read(header), sidebar: read(sidebar) };
  });

  expect(alignment.header).not.toBeNull();
  expect(alignment.sidebar).not.toBeNull();
  expect(alignment.header.objectPosition).toBe('50% 50%');
  expect(alignment.sidebar.objectPosition).toBe('50% 50%');
  expect(alignment.header.marginLeft).toBe(alignment.header.marginRight);
  expect(alignment.sidebar.marginLeft).toBe(alignment.sidebar.marginRight);
});

test('attribution records expose their asset source for GitHub editing', async ({ page }) => {
  await page.goto(`${baseUrl}/attribution/images/bailey-pittman-portrait-webp/`, { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { level: 1, name: 'Bailey Pittman — portrait' })).toBeVisible();

  const editLink = page.locator('a[href*="/edit/main/Vault/Assets/Attribution/Images/bailey-pittman-portrait.webp.md"]');
  await expect(editLink).toHaveCount(1);
});
