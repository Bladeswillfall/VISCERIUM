import { test, expect } from '@playwright/test';

const citadelUrl = 'http://127.0.0.1:4321/eras/citadel/';

test.use({ viewport: { width: 1280, height: 900 } });

test('CITADEL primer uses the era map, authored voice and non-card information blocks', async ({ page }) => {
  await page.goto(citadelUrl, { waitUntil: 'domcontentloaded' });

  const primer = page.locator('[data-era-primer="citadel"]');
  await expect(primer).toBeVisible();
  await expect(primer).toHaveClass(/\bnot-content\b/);
  await expect(page.locator('.calendar-date-badge')).toBeHidden();
  await expect(page.locator('.codex-page-classifier--era-homepage')).toHaveCount(1);

  await expect(primer).toContainText('the creeping blight of Myrkild looms ever larger');
  await expect(primer).toContainText('fortresses on wheels');

  const map = primer.locator('.era-primer__map');
  const mapImage = map.locator('img');
  await expect(mapImage).toHaveAttribute('src', '/assets/images/citadel-era-map.webp');

  const geometry = await page.evaluate(() => {
    const mapElement = document.querySelector('.era-primer__map');
    const essentials = [...document.querySelectorAll('.era-primer__essential')];
    const powers = [...document.querySelectorAll('.era-primer__power')];
    const hero = document.querySelector('.era-primer__hero');
    const essential = essentials[0];
    const power = powers[0];
    if (
      !(mapElement instanceof HTMLElement)
      || !(essential instanceof HTMLElement)
      || !(power instanceof HTMLElement)
      || !(hero instanceof HTMLElement)
      || !(essentials[1] instanceof HTMLElement)
      || !(powers[1] instanceof HTMLElement)
    ) return null;

    const mapRect = mapElement.getBoundingClientRect();
    return {
      mapRatio: mapRect.width / mapRect.height,
      essentialRadius: getComputedStyle(essential).borderTopLeftRadius,
      essentialBackground: getComputedStyle(essential).backgroundColor,
      powerRadius: getComputedStyle(power).borderTopLeftRadius,
      powerBackground: getComputedStyle(power).backgroundColor,
      heroRadius: getComputedStyle(hero).borderTopLeftRadius,
      firstEssentialMarginTop: getComputedStyle(essential).marginTop,
      secondEssentialMarginTop: getComputedStyle(essentials[1]).marginTop,
      firstPowerMarginTop: getComputedStyle(power).marginTop,
      secondPowerMarginTop: getComputedStyle(powers[1]).marginTop,
    };
  });

  expect(geometry).not.toBeNull();
  expect(geometry.mapRatio).toBeGreaterThan(1.95);
  expect(geometry.mapRatio).toBeLessThan(2.05);
  expect(geometry.essentialRadius).toBe('0px');
  expect(geometry.powerRadius).toBe('0px');
  expect(geometry.heroRadius).toBe('0px');
  expect(geometry.essentialBackground).toBe('rgba(0, 0, 0, 0)');
  expect(geometry.powerBackground).toBe('rgba(0, 0, 0, 0)');
  expect(geometry.firstEssentialMarginTop).toBe(geometry.secondEssentialMarginTop);
  expect(geometry.firstPowerMarginTop).toBe(geometry.secondPowerMarginTop);
  expect(geometry.firstPowerMarginTop).toBe('0px');
});

test('era homepages keep structural heading spacing and omit article-only footer furniture', async ({ page }) => {
  await page.goto(citadelUrl, { waitUntil: 'networkidle' });

  const indexHeading = page.getByRole('heading', { name: 'Pages in this category' });
  await expect(indexHeading).toBeVisible();

  const marginBottom = await indexHeading.evaluate((element) => getComputedStyle(element).marginBottom);
  expect(marginBottom).not.toBe('-24px');
  expect(Number.parseFloat(marginBottom)).toBeGreaterThanOrEqual(0);

  await expect(page.locator('.codex-contributors')).toHaveCount(0);
  await expect(page.locator('.codex-webmentions')).toHaveCount(0);
  await expect(page.locator('.pagination-links')).toHaveCount(0);
  await expect(page.locator('giscus-comments')).toBeHidden();
});
