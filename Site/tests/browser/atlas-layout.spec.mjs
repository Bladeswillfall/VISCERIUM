import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 900 } });

test('canonical Atlas reports its real empty marker state', async ({ page }) => {
  await page.goto('http://127.0.0.1:4321/maps/errack-citadel/', { waitUntil: 'domcontentloaded' });

  const atlas = page.locator('[data-atlas]');
  await expect(atlas).toHaveAttribute('data-atlas-ready', 'true', { timeout: 10_000 });
  await expect(atlas.locator('.atlas__empty-note')).toContainText('no positioned markers have been published yet');
  await expect(atlas.locator('.atlas__marker-index')).toContainText('No markers have been placed on this map yet.');

  const search = atlas.locator('.atlas__toolbar').getByRole('searchbox', { name: 'Find a place' });
  await search.fill('unpublished place');
  await expect(atlas.locator('.atlas__toolbar .atlas-search__empty')).toHaveText('No matching markers.');
});

test('map routes remove the empty Starlight masthead wrapper', async ({ page }) => {
  await page.goto('http://127.0.0.1:4321/maps/errack-citadel/', { waitUntil: 'domcontentloaded' });

  const panels = page.locator('.codex-exploration-page main > .content-panel');
  expect(await panels.count()).toBeGreaterThan(1);
  await expect(panels.first()).toBeHidden();
  await expect(panels.last()).toBeVisible();
});

test('Atlas cards use a flush, readable and consistently aligned composition', async ({ page }) => {
  await page.goto('http://127.0.0.1:4321/maps/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts.ready);

  const grid = page.locator('.atlas-index .codex-map-grid');
  await expect(grid).toHaveClass(/not-content/);

  const cards = grid.locator(':scope > .codex-map-card');
  expect(await cards.count()).toBe(1);

  const layouts = await cards.evaluateAll((elements) => elements.map((card) => {
    const image = card.querySelector(':scope > img');
    const body = card.querySelector('.codex-map-card__body');
    const title = body?.querySelector(':scope > h2');
    const description = body?.querySelector(':scope > p:not(.atlas-index__meta)');
    const meta = body?.querySelector(':scope > .atlas-index__meta');
    if (!image || !body || !title || !description || !meta) return null;

    const cardStyle = getComputedStyle(card);
    const imageStyle = getComputedStyle(image);
    const bodyStyle = getComputedStyle(body);
    const metaStyle = getComputedStyle(meta);
    const cardRect = card.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();
    const titleRect = title.getBoundingClientRect();
    const descriptionRect = description.getBoundingClientRect();

    return {
      cardTop: cardRect.top,
      cardMarginTop: Number.parseFloat(cardStyle.marginTop),
      borderRadius: Number.parseFloat(cardStyle.borderTopLeftRadius),
      imageHeight: imageRect.height,
      imageMaxHeight: Number.parseFloat(imageStyle.maxHeight),
      imageMarginTop: Number.parseFloat(imageStyle.marginTop),
      imageMarginBottom: Number.parseFloat(imageStyle.marginBottom),
      imageObjectFit: imageStyle.objectFit,
      bodyMarginTop: Number.parseFloat(bodyStyle.marginTop),
      titleBottom: titleRect.bottom,
      descriptionTop: descriptionRect.top,
      gap: descriptionRect.top - titleRect.bottom,
      metaFontSize: Number.parseFloat(metaStyle.fontSize),
    };
  }).filter(Boolean));

  expect(layouts).toHaveLength(1);

  for (const layout of layouts) {
    expect(layout.cardMarginTop).toBe(0);
    expect(layout.borderRadius).toBeGreaterThanOrEqual(9.5);
    expect(layout.imageHeight).toBeLessThanOrEqual(240.5);
    expect(layout.imageMaxHeight).toBeLessThanOrEqual(240.5);
    expect(layout.imageMarginTop).toBe(0);
    expect(layout.imageMarginBottom).toBe(0);
    expect(layout.imageObjectFit).toBe('cover');
    expect(layout.bodyMarginTop).toBe(0);
    expect(layout.titleBottom).toBeLessThanOrEqual(layout.descriptionTop);
    expect(layout.gap).toBeGreaterThanOrEqual(14);
    expect(layout.metaFontSize).toBeGreaterThanOrEqual(10.5);
  }
});
