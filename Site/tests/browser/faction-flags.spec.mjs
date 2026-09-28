import { test, expect } from '@playwright/test';

const preview = 'http://127.0.0.1:4321';

async function checkImage(image, src, width) {
  await expect(image).toHaveAttribute('src', src);
  const loadedWidth = await image.evaluate(async (element) => {
    element.loading = 'eager';
    await element.decode();
    return element.naturalWidth;
  });
  expect(loadedWidth).toBe(width);
}

test('NEARSIGHT powers and their articles use their published flags', async ({ page }) => {
  const factions = [
    ['Allied Special Tactics Union', 'astu', '/eras/nearsight/events/formation-of-astu/', 'ASTU-flag.webp'],
    ['Trans-Continental Socialist Confederation', 'tcsc', '/eras/nearsight/events/tcsc-bastion-doctrine-adopted/', 'TCSC-flag.webp'],
  ];

  await page.goto(`${preview}/eras/nearsight/`);
  for (const [title, , href, file] of factions) {
    const card = page.locator('.era-primer__power').filter({ hasText: title });
    await expect(card.getByRole('link', { name: title })).toHaveAttribute('href', href);
    await checkImage(card.locator('img'), `/assets/images/${file}`, 1600);
  }

  for (const [, , href, file] of factions) {
    await page.goto(`${preview}${href}`);
    await checkImage(page.locator('.codex-header-image'), `/assets/images/${file}`, 1600);
  }
});

test('Krass article and Start Here use the same managed flag', async ({ page }) => {
  const asset = '/assets/images/Krass-Dominion-flag.webp';
  await page.goto(`${preview}/eras/citadel/nations/krass-dominion/`);
  await checkImage(page.locator('.codex-sidebar-image'), asset, 2047);

  await page.goto(`${preview}/start-here/`);
  await checkImage(page.locator('.start-culture__flag--krass'), asset, 2047);
});
