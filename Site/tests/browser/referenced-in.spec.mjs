import { test, expect } from '@playwright/test';

const preview = 'http://127.0.0.1:4321';

async function expectReferencedByErrack(page, path) {
  await page.goto(`${preview}${path}`, { waitUntil: 'networkidle' });
  const section = page.locator('.codex-referenced-in');
  await expect(section).toBeVisible();
  await expect(section.getByRole('heading', { name: 'Referenced in', exact: true })).toBeVisible();
  await expect(section.getByRole('link', { name: 'Errack', exact: true })).toHaveAttribute('href', '/degel-system/errack/');
}

test('real authored lore links generate Referenced in records', async ({ page }) => {
  await expectReferencedByErrack(page, '/degel-system/degel/');
  await expectReferencedByErrack(page, '/degel-system/eye-of-vordr/');
  await expectReferencedByErrack(page, '/degel-system/eye-of-visi/');
});
