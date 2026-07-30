import { test, expect } from '@playwright/test';

const startHereUrl = 'http://127.0.0.1:4321/start-here/';

const almostEqual = (left, right, tolerance = 2) => Math.abs(left - right) <= tolerance;
const spread = (values) => Math.max(...values) - Math.min(...values);

test.use({ viewport: { width: 1280, height: 900 } });

test('Start Here owns the full editorial canvas without the ordinary article masthead or rail', async ({ page }) => {
  await page.goto(startHereUrl, { waitUntil: 'domcontentloaded' });

  const sidebarContainer = page.locator('.right-sidebar-container');
  const primer = page.locator('.start-here-primer');

  await expect(primer).toBeVisible();
  await expect(sidebarContainer).toBeHidden();
  await expect(page.locator('.content-panel > .sl-container > .codex-header-figure')).toBeHidden();
  await expect(page.locator('.content-panel > .sl-container > h1#_top')).toBeHidden();
  await expect(page.locator('.content-panel > .sl-container > .codex-breadcrumbs')).toBeHidden();

  const geometry = await page.evaluate(() => {
    const twoColumn = document.querySelector('.codex-two-column-content');
    const mainPane = document.querySelector('.codex-main-pane');
    const main = document.querySelector('.codex-main-pane > main');
    const primerElement = document.querySelector('.start-here-primer');
    const hero = document.querySelector('.start-hero');
    if (
      !(twoColumn instanceof HTMLElement)
      || !(mainPane instanceof HTMLElement)
      || !(main instanceof HTMLElement)
      || !(primerElement instanceof HTMLElement)
      || !(hero instanceof HTMLElement)
    ) return null;

    const rect = (element) => element.getBoundingClientRect();
    const twoColumnRect = rect(twoColumn);
    const mainPaneRect = rect(mainPane);
    const mainRect = rect(main);
    const primerRect = rect(primerElement);
    const heroRect = rect(hero);

    return {
      twoColumnWidth: twoColumnRect.width,
      mainPaneWidth: mainPaneRect.width,
      mainWidth: mainRect.width,
      primerWidth: primerRect.width,
      heroWidth: heroRect.width,
      heroTopDelta: heroRect.top - mainRect.top,
      rightEdgeGap: twoColumnRect.right - primerRect.right,
      gridTemplateColumns: getComputedStyle(mainPane).gridTemplateColumns,
    };
  });

  expect(geometry).not.toBeNull();
  expect(almostEqual(geometry.mainPaneWidth, geometry.twoColumnWidth)).toBe(true);
  expect(almostEqual(geometry.mainWidth, geometry.mainPaneWidth)).toBe(true);
  expect(almostEqual(geometry.primerWidth, geometry.mainWidth)).toBe(true);
  expect(almostEqual(geometry.heroWidth, geometry.primerWidth)).toBe(true);
  expect(Math.abs(geometry.heroTopDelta)).toBeLessThanOrEqual(2);
  expect(Math.abs(geometry.rightEdgeGap)).toBeLessThanOrEqual(2);
  expect(geometry.gridTemplateColumns.split(' ').length).toBe(1);
});

test('era sequence alternates map and copy sides on desktop', async ({ page }) => {
  await page.goto(startHereUrl, { waitUntil: 'domcontentloaded' });
  const bands = page.locator('.start-era-band');
  await expect(bands).toHaveCount(4);

  const positions = await bands.evaluateAll((elements) => elements.map((element) => {
    const map = element.querySelector('.start-era-band__map');
    const copy = element.querySelector('.start-era-band__copy');
    if (!(map instanceof HTMLElement) || !(copy instanceof HTMLElement)) return null;
    return {
      mapLeft: map.getBoundingClientRect().left,
      copyLeft: copy.getBoundingClientRect().left,
    };
  }));

  expect(positions.every(Boolean)).toBe(true);
  expect(positions[0].mapLeft).toBeLessThan(positions[0].copyLeft);
  expect(positions[1].mapLeft).toBeGreaterThan(positions[1].copyLeft);
  expect(positions[2].mapLeft).toBeLessThan(positions[2].copyLeft);
  expect(positions[3].mapLeft).toBeGreaterThan(positions[3].copyLeft);
});

test('breadcrumb choices keep consistent geometry while era choices carry distinct visual language', async ({ page }) => {
  await page.goto(startHereUrl, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.start-here-primer')).toBeVisible();

  const firstRow = page.locator('[data-breadcrumb-group="era"] .start-choice');
  await expect(firstRow).toHaveCount(4);
  const choiceGeometry = await firstRow.evaluateAll((elements) => elements.map((element) => {
    const style = getComputedStyle(element);
    return {
      height: element.getBoundingClientRect().height,
      radius: Number.parseFloat(style.borderTopLeftRadius),
      border: style.borderTopColor,
      background: style.backgroundImage,
    };
  }));

  expect(spread(choiceGeometry.map(({ height }) => height))).toBeLessThanOrEqual(2);
  expect(choiceGeometry.every(({ radius }) => radius > 0)).toBe(true);
  expect(new Set(choiceGeometry.map(({ border }) => border)).size).toBeGreaterThan(1);
  expect(new Set(choiceGeometry.map(({ background }) => background)).size).toBe(4);

  await page.locator('[data-breadcrumb-group="era"] [data-value="citadel"]').click();
  await page.locator('[data-breadcrumb-group="world"] [data-value="danger"]').click();
  await page.locator('[data-breadcrumb-group="thread"] [data-value="resonance"]').click();

  const routeCards = page.locator('.start-route-card');
  await expect(routeCards).toHaveCount(3);
  const routeHeights = await routeCards.evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().height));
  expect(spread(routeHeights)).toBeLessThanOrEqual(2);
});

test('Start Here suppresses article social and discussion modules', async ({ page }) => {
  await page.goto(startHereUrl, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.start-here-primer')).toBeVisible();

  await expect(page.locator('.codex-contributors')).toBeHidden();
  await expect(page.locator('.codex-webmentions')).toBeHidden();
  await expect(page.locator('giscus-comments')).toBeHidden();
});

test('light mode uses warm paper with accessible editorial and map contrast', async ({ page }) => {
  await page.goto(startHereUrl, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'light';
  });

  const state = await page.evaluate(() => {
    const primer = document.querySelector('.start-here-primer');
    const timeline = document.querySelector('.start-timeline');
    const hero = document.querySelector('.start-hero');
    const breadcrumb = document.querySelector('.start-breadcrumb');
    const choice = document.querySelector('.start-choice');
    const choiceSecondary = document.querySelector('.start-choice span');
    const breadcrumbInner = document.querySelector('.start-breadcrumb__inner');
    const timelineHeading = document.querySelector('.start-timeline h2');
    const timelineLead = document.querySelector('.start-timeline .start-lead');
    const routeEmpty = document.querySelector('.start-route__empty');
    const bands = [...document.querySelectorAll('.start-era-band')];

    if (
      !(primer instanceof HTMLElement)
      || !(timeline instanceof HTMLElement)
      || !(hero instanceof HTMLElement)
      || !(breadcrumb instanceof HTMLElement)
      || !(choice instanceof HTMLElement)
      || !(choiceSecondary instanceof HTMLElement)
      || !(breadcrumbInner instanceof HTMLElement)
      || !(timelineHeading instanceof HTMLElement)
      || !(timelineLead instanceof HTMLElement)
      || bands.length !== 4
    ) return null;

    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return null;

    const rgba = (value) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
      return [r / 255, g / 255, b / 255, a / 255];
    };

    const composite = (foreground, background) => {
      const alpha = foreground[3] + background[3] * (1 - foreground[3]);
      if (alpha === 0) return [0, 0, 0, 0];
      return [
        (foreground[0] * foreground[3] + background[0] * background[3] * (1 - foreground[3])) / alpha,
        (foreground[1] * foreground[3] + background[1] * background[3] * (1 - foreground[3])) / alpha,
        (foreground[2] * foreground[3] + background[2] * background[3] * (1 - foreground[3])) / alpha,
        alpha,
      ];
    };

    const channel = (value) => value <= 0.04045
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4;

    const luminance = ([r, g, b]) => (
      0.2126 * channel(r)
      + 0.7152 * channel(g)
      + 0.0722 * channel(b)
    );

    const contrast = (foregroundValue, backgroundValue) => {
      const background = rgba(backgroundValue);
      const foreground = composite(rgba(foregroundValue), background);
      const lighter = Math.max(luminance(foreground), luminance(background));
      const darker = Math.min(luminance(foreground), luminance(background));
      return (lighter + 0.05) / (darker + 0.05);
    };

    const timelineBg = getComputedStyle(timeline).backgroundColor;
    const primerBg = getComputedStyle(primer).backgroundColor;
    const choiceBg = getComputedStyle(choice).backgroundColor;

    const eraContrast = bands.map((band) => {
      const path = band.querySelector('.start-map-mark path');
      const paragraph = band.querySelector('.start-era-band__copy p');
      const number = band.querySelector('.start-era-band__number');
      const action = band.querySelector('.start-era-band__action');
      if (
        !(path instanceof SVGElement)
        || !(paragraph instanceof HTMLElement)
        || !(number instanceof HTMLElement)
        || !(action instanceof HTMLElement)
      ) return null;

      const bandBg = getComputedStyle(band).backgroundColor;
      return {
        fill: getComputedStyle(path).fill,
        map: contrast(getComputedStyle(path).fill, bandBg),
        paragraph: contrast(getComputedStyle(paragraph).color, bandBg),
        number: contrast(getComputedStyle(number).color, bandBg),
        action: contrast(getComputedStyle(action).color, bandBg),
      };
    });

    return {
      primerBg,
      timelineBg,
      heroBg: getComputedStyle(hero).backgroundColor,
      breadcrumbBg: getComputedStyle(breadcrumb).backgroundColor,
      choiceBg,
      breadcrumbPaddingTop: Number.parseFloat(getComputedStyle(breadcrumbInner).paddingTop),
      timelineHeadingContrast: contrast(getComputedStyle(timelineHeading).color, timelineBg),
      timelineLeadContrast: contrast(getComputedStyle(timelineLead).color, timelineBg),
      choiceSecondaryContrast: contrast(getComputedStyle(choiceSecondary).color, choiceBg),
      routeEmptyContrast: routeEmpty instanceof HTMLElement
        ? contrast(getComputedStyle(routeEmpty).color, primerBg)
        : null,
      eraContrast,
    };
  });

  expect(state).not.toBeNull();
  expect(state.timelineBg).toBe(state.primerBg);
  expect(state.heroBg).not.toBe(state.timelineBg);
  expect(state.breadcrumbBg).not.toBe(state.heroBg);
  expect(state.choiceBg).not.toBe(state.heroBg);
  expect(state.breadcrumbPaddingTop).toBeGreaterThanOrEqual(64);

  expect(state.timelineHeadingContrast).toBeGreaterThanOrEqual(4.5);
  expect(state.timelineLeadContrast).toBeGreaterThanOrEqual(4.5);
  expect(state.choiceSecondaryContrast).toBeGreaterThanOrEqual(4.5);
  if (state.routeEmptyContrast !== null) expect(state.routeEmptyContrast).toBeGreaterThanOrEqual(4.5);

  expect(state.eraContrast.every(Boolean)).toBe(true);
  expect(new Set(state.eraContrast.map(({ fill }) => fill)).size).toBe(4);
  for (const ratios of state.eraContrast) {
    expect(ratios.map).toBeGreaterThanOrEqual(3);
    expect(ratios.paragraph).toBeGreaterThanOrEqual(4.5);
    expect(ratios.number).toBeGreaterThanOrEqual(4.5);
    expect(ratios.action).toBeGreaterThanOrEqual(4.5);
  }
});
