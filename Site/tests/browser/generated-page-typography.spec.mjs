import { test, expect } from '@playwright/test';

const preview = 'http://127.0.0.1:4321';

test('release overview uses release-specific heading and date styles', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.goto(`${preview}/releases/`, { waitUntil: 'networkidle' });

  const result = await page.evaluate(() => {
    const content = document.querySelector('.sl-markdown-content');
    if (!(content instanceof HTMLElement)) return null;

    const h2 = Array.from(content.children).find((node) => node instanceof HTMLHeadingElement && node.tagName === 'H2');
    if (!(h2 instanceof HTMLHeadingElement)) return null;

    let h3 = h2.nextElementSibling;
    // Do not mistake a category in the next release for this release's heading.
    while (h3 && h3.tagName !== 'H2' && h3.tagName !== 'H3') {
      h3 = h3.nextElementSibling;
    }
    if (!(h3 instanceof HTMLHeadingElement)) return null;

    const date = content.querySelector('time[datetime]');
    const firstItem = h3.nextElementSibling?.querySelector('li');
    const h2Style = getComputedStyle(h2);
    const h3Style = getComputedStyle(h3);
    const dateStyle = date ? getComputedStyle(date) : null;
    const h2Rect = h2.getBoundingClientRect();
    const h3Rect = h3.getBoundingClientRect();

    const probe = document.createElement('span');
    probe.style.color = 'var(--sl-color-gray-2)';
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
      isReleaseContent: content.classList.contains('vc-release-content'),
      dateText: date?.textContent?.trim() ?? '',
      dateTime: date?.getAttribute('datetime') ?? '',
      dateDisplay: dateStyle?.display ?? '',
      dateMarginTop: dateStyle?.marginTop ?? '',
      dateFontWeight: dateStyle?.fontWeight ?? '',
      h3FontSize: h3Style.fontSize,
      h2AfterContent: getComputedStyle(h2, '::after').content,
      badgeText: firstItem ? getComputedStyle(firstItem, '::before').content : '',
    };
  });

  expect(result).not.toBeNull();
  expect(result.h2Text).toMatch(/\b\d+\.\d+\.\d+\b/);
  expect(result.h2Text).not.toMatch(/Unreleased/i);
  expect(result.h3Text.toLowerCase()).toMatch(/added|changed|notes/);
  expect(result.isReleaseContent).toBe(true);
  expect(result.dateTime).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  expect(result.dateText).toMatch(/2026/);
  expect(result.dateText).not.toContain('starlightChangelogs.');
  expect(result.dateDisplay).toBe('block');
  expect(Number.parseFloat(result.dateMarginTop)).toBeGreaterThan(0);
  expect(result.dateFontWeight).toBe('600');
  expect(Number.parseFloat(result.h3FontSize)).toBeLessThan(16);
  expect(result.h2AfterContent).toBe('none');
  const expectedBadge = /added/i.test(result.h3Text) ? 'ADDED' : /changed/i.test(result.h3Text) ? 'UPDATED' : 'NOTICE';
  expect(result.badgeText).toContain(expectedBadge);
  expect(Number.parseFloat(result.h2MarginBottom)).toBeGreaterThanOrEqual(0);
  expect(Number.parseFloat(result.h3MarginTop)).toBeGreaterThan(0);
  expect(result.gap).toBeGreaterThanOrEqual(8);
  expect(result.h3Color).toBe(result.expectedAccent);
});

test('release notes are unboxed and have distinct light-theme labels', async ({ page }) => {
  await page.goto(`${preview}/releases/`, { waitUntil: 'networkidle' });

  const result = await page.evaluate(() => {
    const labels = {};
    const kinds = ['added', 'changed', 'fixed'];
    for (const kind of kinds) {
      const item = document.querySelector(`.vc-release-content > h3[id^="${kind}"] + ul > li`);
      if (!(item instanceof HTMLLIElement)) return null;
      const rowStyle = getComputedStyle(item);
      labels[kind] = {
        border: rowStyle.borderLeftWidth,
        background: rowStyle.backgroundColor,
      };
    }

    document.documentElement.dataset.theme = 'light';
    const whiteProbe = document.createElement('span');
    whiteProbe.style.color = 'var(--codex-fixed-light)';
    document.body.append(whiteProbe);
    labels.expectedWhite = getComputedStyle(whiteProbe).color;
    whiteProbe.remove();
    for (const kind of kinds) {
      const item = document.querySelector(`.vc-release-content > h3[id^="${kind}"] + ul > li`);
      const badge = getComputedStyle(item, '::before');
      labels[kind].lightBadge = badge.backgroundColor;
      labels[kind].lightText = badge.color;
    }
    return labels;
  });

  expect(result).not.toBeNull();
  for (const kind of ['added', 'changed', 'fixed']) {
    expect(result[kind].border).toBe('0px');
    expect(result[kind].background).toBe('rgba(0, 0, 0, 0)');
    expect(result[kind].lightText).toBe(result.expectedWhite);
  }
  expect(result.added.lightBadge).toBe('rgb(8, 114, 72)');
  expect(result.changed.lightBadge).toBe('rgb(49, 92, 155)');
  expect(result.fixed.lightBadge).toBe('rgb(135, 52, 166)');
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
