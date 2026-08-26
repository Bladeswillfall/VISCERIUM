import { test, expect } from '@playwright/test';

const preview = 'http://127.0.0.1:4321';

test('article webmentions explain the feature after comments', async ({ page }) => {
  await page.route('https://webmention.io/api/mentions.jf2**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ type: 'feed', children: [] }),
    });
  });

  await page.goto(`${preview}/degel-system/errack/`, { waitUntil: 'domcontentloaded' });

  const comments = page.locator('viscerium-comments');
  const webmentions = page.locator('.codex-webmentions');
  await expect(comments).toHaveCount(1);
  await expect(webmentions).toBeVisible();

  const commentsBeforeWebmentions = await page.evaluate(() => {
    const commentsElement = document.querySelector('viscerium-comments');
    const webmentionsElement = document.querySelector('.codex-webmentions');
    return Boolean(
      commentsElement
      && webmentionsElement
      && (commentsElement.compareDocumentPosition(webmentionsElement) & Node.DOCUMENT_POSITION_FOLLOWING)
    );
  });
  expect(commentsBeforeWebmentions).toBe(true);

  await expect(webmentions.getByRole('heading', { level: 2, name: 'Responses from elsewhere' })).toBeVisible();
  await expect(webmentions).toContainText(
    'Webmentions are enabled. If you publish a response to this article on your own website, it can appear here.',
  );

  const explainer = webmentions.getByRole('link', { name: 'What is a Webmention?' });
  await expect(explainer).toHaveAttribute('href', 'https://indieweb.org/Webmention');
  await expect(explainer).toHaveAttribute('target', '_blank');
});