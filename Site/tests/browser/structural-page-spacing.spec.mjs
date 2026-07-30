import { test, expect } from '@playwright/test';

const categoryUrl = 'http://127.0.0.1:4321/eras/citadel/events/';
const startHereUrl = 'http://127.0.0.1:4321/start-here/';

test.use({ viewport: { width: 1280, height: 900 } });

test('category indexes keep positive H2 separation instead of article compression', async ({ page }) => {
  await page.goto(categoryUrl, { waitUntil: 'domcontentloaded' });

  await expect(page.locator('.codex-page-classifier--structural')).toHaveCount(1);
  const heading = page.getByRole('heading', { name: 'Pages in this category' });
  await expect(heading).toBeVisible();

  const marginBottom = await heading.evaluate((element) => getComputedStyle(element).marginBottom);
  expect(marginBottom).not.toBe('-24px');
  expect(Number.parseFloat(marginBottom)).toBeGreaterThanOrEqual(0);
});

test('Start Here is classified as structural despite using article frontmatter', async ({ page }) => {
  await page.goto(startHereUrl, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.codex-page-classifier--structural')).toHaveCount(1);
  await expect(page.locator('.codex-page-classifier--article')).toHaveCount(0);
});
