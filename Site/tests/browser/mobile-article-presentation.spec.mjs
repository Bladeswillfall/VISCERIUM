import { test, expect } from '@playwright/test';

const errackUrl = 'http://127.0.0.1:4321/degel-system/errack/';

test.describe('mobile article presentation', () => {
  test.use({ viewport: { width: 402, height: 874 } });

  test('Errack uses the compact mobile article composition without horizontal overflow', async ({ page }) => {
    await page.goto(errackUrl, { waitUntil: 'networkidle' });

    const result = await page.evaluate(() => {
      const content = document.querySelector('.sl-markdown-content');
      const figure = document.querySelector('.content-panel > .sl-container > .codex-header-figure');
      const image = figure?.querySelector('.codex-header-image');
      const paragraph = document.querySelector('.sl-markdown-content > p');
      const badge = document.querySelector('.codex-universal-badge');

      if (!(content instanceof HTMLElement)
        || !(figure instanceof HTMLElement)
        || !(image instanceof HTMLImageElement)
        || !(paragraph instanceof HTMLParagraphElement)
        || !(badge instanceof HTMLElement)) {
        return null;
      }

      const contentStyle = getComputedStyle(content);
      const badgeStyle = getComputedStyle(badge);
      const figureRect = figure.getBoundingClientRect();
      const imageRect = image.getBoundingClientRect();
      const paragraphRect = paragraph.getBoundingClientRect();

      return {
        contentMarginTop: contentStyle.marginTop,
        contentPaddingLeft: Number.parseFloat(contentStyle.paddingLeft),
        badgeFontSize: badgeStyle.fontSize,
        figureRect: figureRect.toJSON(),
        imageRect: imageRect.toJSON(),
        paragraphRect: paragraphRect.toJSON(),
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
      };
    });

    expect(result).not.toBeNull();
    expect(result.contentMarginTop).toBe('-64px');
    expect(result.badgeFontSize).toBe('8px');
    expect(result.figureRect.left).toBeCloseTo(0, 0);
    expect(result.figureRect.right).toBeCloseTo(result.viewportWidth, 0);
    expect(result.imageRect.left).toBeCloseTo(result.figureRect.left, 0);
    expect(result.imageRect.right).toBeCloseTo(result.figureRect.right, 0);
    expect(result.paragraphRect.left).toBeGreaterThan(result.figureRect.left + result.contentPaddingLeft - 1);
    expect(result.documentWidth).toBeLessThanOrEqual(result.viewportWidth + 1);
  });
});

test('mobile article overrides do not leak to desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto(errackUrl, { waitUntil: 'networkidle' });

  const result = await page.evaluate(() => {
    const content = document.querySelector('.sl-markdown-content');
    const badge = document.querySelector('.codex-universal-badge');
    const figure = document.querySelector('.content-panel > .sl-container > .codex-header-figure');
    if (!(content instanceof HTMLElement) || !(badge instanceof HTMLElement) || !(figure instanceof HTMLElement)) return null;

    return {
      contentMarginTop: getComputedStyle(content).marginTop,
      badgeFontSize: Number.parseFloat(getComputedStyle(badge).fontSize),
      figureWidth: figure.getBoundingClientRect().width,
      viewportWidth: window.innerWidth,
    };
  });

  expect(result).not.toBeNull();
  expect(result.contentMarginTop).not.toBe('-64px');
  expect(result.badgeFontSize).toBeGreaterThan(8);
  expect(result.figureWidth).toBeLessThan(result.viewportWidth);
});
