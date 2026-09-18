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

test('header and sidebar artwork are visually centered inside their links', async ({ page }) => {
  await page.goto(`${baseUrl}/eras/entropy/characters/tpr.-bailey-pittman/`, { waitUntil: 'domcontentloaded' });

  const alignment = await page.evaluate(() => {
    const measure = (linkSelector, imageSelector) => {
      const link = document.querySelector(linkSelector);
      const image = document.querySelector(imageSelector);
      if (!(link instanceof HTMLElement) || !(image instanceof HTMLImageElement)) return null;

      const linkRect = link.getBoundingClientRect();
      const imageRect = image.getBoundingClientRect();
      return {
        linkCenter: linkRect.left + (linkRect.width / 2),
        imageCenter: imageRect.left + (imageRect.width / 2),
      };
    };

    return {
      header: measure('.codex-header-image-link', '.codex-header-image'),
      sidebar: measure('.codex-sidebar-image-link', '.codex-sidebar-image'),
    };
  });

  expect(alignment.header).not.toBeNull();
  expect(alignment.sidebar).not.toBeNull();
  expect(Math.abs(alignment.header.linkCenter - alignment.header.imageCenter)).toBeLessThanOrEqual(1);
  expect(Math.abs(alignment.sidebar.linkCenter - alignment.sidebar.imageCenter)).toBeLessThanOrEqual(1);
});

test('attribution records expose their asset source for GitHub editing', async ({ page }) => {
  await page.goto(`${baseUrl}/attribution/images/bailey-pittman-portrait-webp/`, { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { level: 1, name: 'Bailey Pittman — portrait' })).toBeVisible();

  const editLink = page.locator('a[href*="/edit/main/Vault/Assets/Attribution/Images/bailey-pittman-portrait.webp.md"]');
  await expect(editLink).toHaveCount(1);
});
