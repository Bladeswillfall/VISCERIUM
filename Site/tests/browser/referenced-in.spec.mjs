import { test, expect } from '@playwright/test';

const preview = 'http://127.0.0.1:4321';

async function expectReferencedByErrack(page, path) {
  await page.goto(`${preview}${path}`, { waitUntil: 'networkidle' });
  const section = page.locator('.codex-referenced-in');
  await expect(section).toBeVisible();
  await expect(section.getByRole('heading', { name: 'Referenced by', exact: true })).toBeVisible();
  await expect(section.getByRole('link', { name: 'Errack', exact: true })).toHaveAttribute('href', '/degel-system/errack/');
}

test('real authored lore links generate Referenced by records', async ({ page }) => {
  await expectReferencedByErrack(page, '/degel-system/degel/');
  await expectReferencedByErrack(page, '/degel-system/eye-of-vordr/');
  await expectReferencedByErrack(page, '/degel-system/eye-of-visi/');
});

test('authored outbound lore links render as References in the same Index bracket', async ({ page }) => {
  await page.goto(`${preview}/degel-system/errack/`, { waitUntil: 'networkidle' });
  const section = page.locator('.codex-referenced-in');
  await expect(section).toBeVisible();
  await expect(section.getByRole('heading', { name: 'References', exact: true })).toBeVisible();
  await expect(section.getByRole('link', { name: 'Degel', exact: true })).toHaveAttribute('href', '/degel-system/degel/');
  await expect(section.locator('.codex-referenced-in-bracket-label')).toHaveText('Index');
});
