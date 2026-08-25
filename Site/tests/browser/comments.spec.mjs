import { test, expect } from '@playwright/test';

const preview = 'http://127.0.0.1:4321';
const loader = 'https://comments.viscerium.co.uk/web/embed.js';
const mockRemark42 = `
  window.__remarkCreates = window.__remarkCreates || 0;
  window.__remarkDestroys = window.__remarkDestroys || 0;
  window.__remarkGlobalDestroys = window.__remarkGlobalDestroys || 0;
  window.__remarkThemes = window.__remarkThemes || [];
  window.__remarkNodeMatches = false;
  window.REMARK42 = {
    createInstance(config) {
      window.__remarkCreates += 1;
      const root = document.querySelector('[data-remark42-root]');
      window.__remarkNodeMatches = config.node === root;
      if (root) root.textContent = 'Mock comments ready';
      return { destroy() { window.__remarkDestroys += 1; } };
    },
    changeTheme(theme) { window.__remarkThemes.push(theme); },
    destroy() { window.__remarkGlobalDestroys += 1; }
  };
  window.dispatchEvent(new Event('REMARK42::ready'));
`;

test('comments and webmentions sit below the complete article frame', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${preview}/degel-system/errack/`, { waitUntil: 'domcontentloaded' });

  const discussions = page.locator('.codex-discussions');
  await expect(discussions).toBeVisible();
  await expect(discussions.locator('viscerium-comments')).toHaveCount(1);
  await expect(discussions.locator('.codex-webmentions')).toHaveCount(1);
  await expect(page.locator('.codex-main-pane viscerium-comments')).toHaveCount(0);
  await expect(page.locator('.codex-main-pane .codex-webmentions')).toHaveCount(0);

  const placement = await page.evaluate(() => {
    const frame = document.querySelector('.page');
    const discussion = document.querySelector('.codex-discussions');
    const footer = document.querySelector('.ion-codex-footer');
    const sidebar = document.querySelector('.right-sidebar-container');
    if (
      !(frame instanceof HTMLElement)
      || !(discussion instanceof HTMLElement)
      || !(footer instanceof HTMLElement)
      || !(sidebar instanceof HTMLElement)
    ) return null;

    const followsFrame = Boolean(
      frame.compareDocumentPosition(discussion) & Node.DOCUMENT_POSITION_FOLLOWING
    );
    const precedesFooter = Boolean(
      discussion.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING
    );
    const frameStyle = getComputedStyle(frame);
    const discussionStyle = getComputedStyle(discussion);

    return {
      followsFrame,
      precedesFooter,
      discussionWidth: discussion.getBoundingClientRect().width,
      viewportWidth: window.innerWidth,
      discussionTop: discussion.getBoundingClientRect().top,
      sidebarBottom: sidebar.getBoundingClientRect().bottom,
      frameBottomLeftRadius: Number.parseFloat(frameStyle.borderBottomLeftRadius),
      frameBottomRightRadius: Number.parseFloat(frameStyle.borderBottomRightRadius),
      discussionBottomLeftRadius: Number.parseFloat(discussionStyle.borderBottomLeftRadius),
      discussionBottomRightRadius: Number.parseFloat(discussionStyle.borderBottomRightRadius),
    };
  });

  expect(placement).not.toBeNull();
  expect(placement.followsFrame).toBe(true);
  expect(placement.precedesFooter).toBe(true);
  expect(Math.abs(placement.discussionWidth - placement.viewportWidth)).toBeLessThanOrEqual(2);
  expect(placement.discussionTop).toBeGreaterThanOrEqual(placement.sidebarBottom - 24);
  expect(placement.frameBottomLeftRadius).toBe(0);
  expect(placement.frameBottomRightRadius).toBe(0);
  expect(placement.discussionBottomLeftRadius).toBeGreaterThan(0);
  expect(placement.discussionBottomRightRadius).toBeGreaterThan(0);
});

test('comments load near the viewport and clean up when their page is replaced', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 640 });
  let requests = 0;
  await page.route(loader, async (route) => {
    requests += 1;
    await route.fulfill({ status: 200, contentType: 'text/javascript', body: mockRemark42 });
  });

  await page.goto(`${preview}/degel-system/errack/`, { waitUntil: 'domcontentloaded' });
  const comments = page.locator('viscerium-comments');
  await expect(comments.locator('[data-remark42-root]')).toHaveText('Comments loading…');
  await page.waitForTimeout(250);
  expect(requests).toBe(0);

  await comments.scrollIntoViewIfNeeded();
  await expect.poll(() => requests).toBe(1);
  await expect(comments.locator('[data-remark42-root]')).toHaveText('Mock comments ready');
  await expect.poll(() => page.evaluate(() => window.__remarkCreates)).toBe(1);
  await expect.poll(() => page.evaluate(() => window.__remarkNodeMatches)).toBe(true);

  await page.evaluate(() => {
    document.documentElement.dataset.theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  });
  await expect.poll(() => page.evaluate(() => window.__remarkThemes.length)).toBeGreaterThan(0);

  await comments.evaluate((element) => element.remove());
  await expect.poll(() => page.evaluate(() => window.__remarkDestroys)).toBeGreaterThan(0);
});

test('comments load immediately when IntersectionObserver is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    delete window.IntersectionObserver;
  });
  let requests = 0;
  await page.route(loader, async (route) => {
    requests += 1;
    await route.fulfill({ status: 200, contentType: 'text/javascript', body: mockRemark42 });
  });

  await page.goto(`${preview}/degel-system/errack/`, { waitUntil: 'domcontentloaded' });
  await expect.poll(() => requests).toBe(1);
  await expect(page.locator('[data-remark42-root]')).toHaveText('Mock comments ready');
  await expect.poll(() => page.evaluate(() => window.__remarkNodeMatches)).toBe(true);
});

test('a failed comments load reports the problem and a later page can retry', async ({ page }) => {
  let attempts = 0;
  await page.route(loader, async (route) => {
    attempts += 1;
    if (attempts === 1) {
      await route.abort();
      return;
    }
    await route.fulfill({ status: 200, contentType: 'text/javascript', body: mockRemark42 });
  });

  await page.goto(`${preview}/degel-system/errack/`, { waitUntil: 'domcontentloaded' });
  const comments = page.locator('viscerium-comments');
  await comments.scrollIntoViewIfNeeded();
  await expect(comments.locator('[data-remark42-root]')).toHaveText('Comments are temporarily unavailable.');

  await comments.evaluate((element) => {
    const replacement = element.cloneNode(true);
    element.replaceWith(replacement);
  });
  const nextComments = page.locator('viscerium-comments');
  await nextComments.scrollIntoViewIfNeeded();
  await expect.poll(() => attempts).toBe(2);
  await expect(nextComments.locator('[data-remark42-root]')).toHaveText('Mock comments ready');
  await expect.poll(() => page.evaluate(() => window.__remarkNodeMatches)).toBe(true);
});
