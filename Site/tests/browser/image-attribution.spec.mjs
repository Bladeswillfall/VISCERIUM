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
  await expect(page.locator('a[href="/attribution/images/errack-rings-webp/"] > img')).toHaveCount(1);
  await expect(page.locator('main')).not.toContainText('](/attribution/images/errack-rings-webp/)');
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
        linkWidth: linkRect.width,
        imageWidth: imageRect.width,
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
  expect(alignment.header.imageWidth).toBeLessThan(alignment.header.linkWidth);
  expect(Math.abs(alignment.sidebar.linkCenter - alignment.sidebar.imageCenter)).toBeLessThanOrEqual(1);
});

test('attribution records use a dedicated metadata table without the article sidebar', async ({ page }) => {
  await page.goto(`${baseUrl}/attribution/images/bailey-pittman-portrait-webp/`, { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { level: 1, name: 'Bailey Pittman — portrait' })).toBeVisible();
  await expect(page.locator('.right-sidebar-container')).toHaveCount(0);
  await expect(page.locator('.codex-header-image')).toBeVisible();
  await expect(page.locator('.codex-header-image-link')).toHaveCount(0);

  const table = page.locator('.codex-attribution-table');
  await expect(table).toBeVisible();
  await expect(table).toContainText('Jake Saunders / MrBizcocho');

  const artistWebsite = table.getByRole('link', { name: /Visit artist website/ });
  await expect(artistWebsite).toHaveAttribute('href', 'https://twitter.com/Mrbizc8');

  const originalArtworkRow = table.getByRole('row').filter({ hasText: 'Original artwork' });
  await expect(originalArtworkRow).toContainText('Not recorded');

  const altTextRow = table.getByRole('row').filter({ hasText: 'Alt text' });
  await expect(altTextRow).toContainText('Not recorded');

  const rightsBadge = table.locator('.codex-rights-badge');
  await expect(rightsBadge).toHaveAttribute('data-rights-kind', 'copyright');
  await expect(rightsBadge).toContainText('Copyright');

  const editLink = page.locator('a[href*="/edit/main/Vault/Assets/Attribution/Images/bailey-pittman-portrait.webp.md"]');
  await expect(editLink).toHaveCount(1);
});

test('external attribution records display their artwork', async ({ page }) => {
  const sourceRoot = 'https://wa-cdn.nyc3.cdn.digitaloceanspaces.com/user-data/production/4e045179-ba57-4130-8eed-cfdd0223c3d7/uploads/images';
  const filenames = [
    '0e0f4f66d44a0c03ce3ec042978a6a2f',
    '598b4c8d3d6aaae231daefd475d4888a',
    '70c9317a764228e870cb7d68d604a64b',
    '8959261124e62edee28ea6301fa6e1f2',
  ];

  for (const filename of filenames) {
    await page.goto(`${baseUrl}/attribution/external/wa-cdn-nyc3-cdn-digitaloceanspaces-com/${filename}-png/`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.codex-header-image')).toHaveAttribute('src', `${sourceRoot}/${filename}.png`);
  }
});
