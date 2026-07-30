import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 900 } });

test('Atlas search results stay above the map and its Leaflet layers', async ({ page }) => {
  await page.goto('http://127.0.0.1:4321/maps/exploration-demo-world/', { waitUntil: 'domcontentloaded' });

  const atlas = page.locator('[data-atlas]');
  await expect(atlas).toHaveAttribute('data-atlas-ready', 'true', { timeout: 10_000 });

  const search = atlas.locator('[data-atlas-search]').first();
  const results = atlas.locator('[data-atlas-search-results]').first();
  const frame = atlas.locator('.atlas__frame');

  await search.fill('demo');
  await expect(results).toBeVisible();
  await expect(results.locator('.atlas-search__result').first()).toBeVisible();

  const resultsBox = await results.boundingBox();
  const frameBox = await frame.boundingBox();
  expect(resultsBox).not.toBeNull();
  expect(frameBox).not.toBeNull();

  const overlapTop = Math.max(resultsBox.y + 1, frameBox.y + 1);
  const overlapBottom = Math.min(
    resultsBox.y + resultsBox.height - 1,
    frameBox.y + frameBox.height - 1,
  );
  expect(overlapBottom).toBeGreaterThan(overlapTop);

  const point = {
    x: resultsBox.x + Math.min(40, resultsBox.width / 2),
    y: overlapTop + ((overlapBottom - overlapTop) / 2),
  };
  const searchOwnsTopPixel = await page.evaluate(({ x, y }) => {
    const resultPanel = document.querySelector('[data-atlas-search-results]');
    const topElement = document.elementFromPoint(x, y);
    return Boolean(resultPanel && topElement && resultPanel.contains(topElement));
  }, point);

  expect(searchOwnsTopPixel).toBe(true);
});

test('map routes remove the empty Starlight masthead wrapper', async ({ page }) => {
  await page.goto('http://127.0.0.1:4321/maps/exploration-demo-world/', { waitUntil: 'domcontentloaded' });

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
  expect(await cards.count()).toBeGreaterThan(1);

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

  expect(layouts.length).toBeGreaterThan(1);

  // The grid is responsive and may wrap as maps are added. Require the desktop
  // first row to contain multiple aligned cards without treating later rows as
  // a vertical-alignment failure.
  const firstRowTop = layouts[0].cardTop;
  const firstRow = layouts.filter(({ cardTop }) => Math.abs(cardTop - firstRowTop) <= 1);
  expect(firstRow.length).toBeGreaterThan(1);
  expect(Math.max(...firstRow.map(({ cardTop }) => cardTop)) - Math.min(...firstRow.map(({ cardTop }) => cardTop))).toBeLessThanOrEqual(1);

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
