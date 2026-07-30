import { test, expect } from '@playwright/test';

const preview = 'http://127.0.0.1:4321';

test('release overview keeps generated headings separated and accent-coloured', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.goto(`${preview}/releases/`, { waitUntil: 'networkidle' });

  const result = await page.evaluate(() => {
    const content = document.querySelector('.sl-markdown-content');
    if (!(content instanceof HTMLElement)) return null;

    const h2 = Array.from(content.children).find((node) => node instanceof HTMLHeadingElement && node.tagName === 'H2');
    if (!(h2 instanceof HTMLHeadingElement)) return null;

    let h3 = h2.nextElementSibling;
    while (h3 && !(h3 instanceof HTMLHeadingElement && h3.tagName === 'H3')) {
      h3 = h3.nextElementSibling;
    }
    if (!(h3 instanceof HTMLHeadingElement)) return null;

    const h2Style = getComputedStyle(h2);
    const h3Style = getComputedStyle(h3);
    const h2Rect = h2.getBoundingClientRect();
    const h3Rect = h3.getBoundingClientRect();

    const probe = document.createElement('span');
    probe.style.color = 'var(--era-heading-accent, var(--sl-color-accent-high))';
    content.append(probe);
    const expectedAccent = getComputedStyle(probe).color;
    probe.remove();

    return {
      h2MarginBottom: h2Style.marginBottom,
      h3MarginTop: h3Style.marginTop,
      h3Color: h3Style.color,
      expectedAccent,
      gap: h3Rect.top - h2Rect.bottom,
      h2Text: h2.textContent?.trim() ?? '',
      h3Text: h3.textContent?.trim() ?? '',
    };
  });

  expect(result).not.toBeNull();
  expect(result.h2Text).toMatch(/0\.2\.0|0\.1\.0/);
  expect(result.h3Text.toLowerCase()).toMatch(/added|changed|notes/);
  expect(Number.parseFloat(result.h2MarginBottom)).toBeGreaterThanOrEqual(0);
  expect(Number.parseFloat(result.h3MarginTop)).toBeGreaterThan(0);
  expect(result.gap).toBeGreaterThanOrEqual(8);
  expect(result.h3Color).toBe(result.expectedAccent);
});

test('utility/generated pages do not inherit the hero-only mobile pull-up', async ({ page }) => {
  await page.setViewportSize({ width: 402, height: 874 });
  await page.goto(`${preview}/releases/`, { waitUntil: 'networkidle' });

  const result = await page.evaluate(() => {
    const content = document.querySelector('.sl-markdown-content');
    if (!(content instanceof HTMLElement)) return null;
    return {
      marginTop: getComputedStyle(content).marginTop,
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
    };
  });

  expect(result).not.toBeNull();
  expect(result.marginTop).not.toBe('-64px');
  expect(result.documentWidth).toBeLessThanOrEqual(result.viewportWidth + 1);
});
