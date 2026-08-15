import { test, expect } from '@playwright/test';

const articleUrl = 'http://127.0.0.1:4321/degel-system/errack/';
const categoryUrl = 'http://127.0.0.1:4321/eras/citadel/tags/factions/';

test.use({ viewport: { width: 1280, height: 900 } });

test('reading time appears below article titles but not on category pages', async ({ page }) => {
  await page.goto(articleUrl, { waitUntil: 'networkidle' });

  const readingTime = page.locator('[data-reading-time]');
  await expect(readingTime).toHaveCount(1);
  await expect(readingTime).toHaveText(/^\d+ min read$/);

  const correctOrder = await page.evaluate(() => {
    const title = document.querySelector('h1#_top');
    const reading = document.querySelector('[data-reading-time]');
    const breadcrumbs = document.querySelector('.codex-breadcrumbs');
    if (!title || !reading) return false;

    const readingFollowsTitle = Boolean(
      title.compareDocumentPosition(reading) & Node.DOCUMENT_POSITION_FOLLOWING,
    );
    const readingPrecedesBreadcrumbs = !breadcrumbs || Boolean(
      reading.compareDocumentPosition(breadcrumbs) & Node.DOCUMENT_POSITION_FOLLOWING,
    );
    return readingFollowsTitle && readingPrecedesBreadcrumbs;
  });

  expect(correctOrder).toBe(true);

  await page.goto(categoryUrl, { waitUntil: 'networkidle' });
  await expect(page.locator('[data-reading-time]')).toHaveCount(0);
});
