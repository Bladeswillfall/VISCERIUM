import { test, expect } from '@playwright/test';

const preview = 'http://127.0.0.1:4321';
const eraPages = [
  {
    id: 'citadel',
    title: 'CITADEL',
    source: 'CITADEL.md',
    marker: 'Beyond the walls, the lone traveller courts death.',
    map: '/assets/images/citadel-era-map.webp',
    mapHref: '/maps/errack-citadel/',
  },
  {
    id: 'smog',
    title: 'SMOG',
    source: 'SMOG.md',
    marker: 'Progress has learned to march in formation.',
    map: '/assets/images/errack.webp',
    mapHref: '/maps/',
  },
  {
    id: 'nearsight',
    title: 'NEARSIGHT',
    source: 'NEARSIGHT.md',
    marker: 'The world can be watched from orbit and still remain unseen.',
    map: '/assets/images/errack.webp',
    mapHref: '/maps/',
  },
  {
    id: 'entropy',
    title: 'ENTROPY',
    source: 'ENTROPY.md',
    marker: 'The old dominion is ash. Survival has become a multi-world campaign.',
    map: '/assets/images/errack.webp',
    mapHref: '/maps/',
  },
];

const eraUrl = (id) => `${preview}/eras/${id}/`;

test.use({ viewport: { width: 1280, height: 900 } });

for (const era of eraPages) {
  test(`${era.title} uses the shared era-homepage treatment and its Vault-owned primer`, async ({ page }) => {
    await page.goto(eraUrl(era.id), { waitUntil: 'networkidle' });

    const primer = page.locator(`[data-era-primer="${era.id}"]`);
    await expect(primer).toBeVisible();
    await expect(primer).toHaveClass(new RegExp(`\\bera-primer--${era.id}\\b`));
    await expect(primer).toHaveClass(/\bnot-content\b/);
    await expect(primer).toContainText(era.marker);

    await expect(page.locator('.calendar-date-badge')).toBeHidden();
    await expect(page.locator('.codex-page-classifier--era-homepage')).toHaveCount(1);
    await expect(page.locator('.codex-page-classifier--article')).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Edit page/ })).toHaveAttribute(
      'href',
      `https://github.com/Bladeswillfall/VISCERIUM/edit/main/Vault/Lore/Eras/${era.source}`,
    );

    const map = primer.locator('.era-primer__map');
    await expect(map).toHaveAttribute('href', era.mapHref);
    await expect(map.locator('img')).toHaveAttribute('src', era.map);

    const geometry = await primer.evaluate((element) => {
      const mapElement = element.querySelector('.era-primer__map');
      const essentials = [...element.querySelectorAll('.era-primer__essential')];
      const powers = [...element.querySelectorAll('.era-primer__power')];
      const eyebrow = element.querySelector('.era-primer__eyebrow');
      if (
        !(mapElement instanceof HTMLElement)
        || !(essentials[0] instanceof HTMLElement)
        || !(essentials[1] instanceof HTMLElement)
        || !(powers[0] instanceof HTMLElement)
        || !(powers[1] instanceof HTMLElement)
        || !(eyebrow instanceof HTMLElement)
      ) return null;

      const mapRect = mapElement.getBoundingClientRect();
      return {
        mapRatio: mapRect.width / mapRect.height,
        firstEssentialMarginTop: getComputedStyle(essentials[0]).marginTop,
        secondEssentialMarginTop: getComputedStyle(essentials[1]).marginTop,
        firstPowerMarginTop: getComputedStyle(powers[0]).marginTop,
        secondPowerMarginTop: getComputedStyle(powers[1]).marginTop,
        accent: getComputedStyle(eyebrow).color,
      };
    });

    expect(geometry).not.toBeNull();
    expect(geometry.mapRatio).toBeGreaterThan(1.95);
    expect(geometry.mapRatio).toBeLessThan(2.05);
    expect(geometry.firstEssentialMarginTop).toBe(geometry.secondEssentialMarginTop);
    expect(geometry.firstPowerMarginTop).toBe(geometry.secondPowerMarginTop);
    expect(geometry.firstPowerMarginTop).toBe('0px');
    expect(geometry.accent).not.toBe('');

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
}

test('the four primers use distinct era accents', async ({ page }) => {
  const accents = [];

  for (const era of eraPages) {
    await page.goto(eraUrl(era.id), { waitUntil: 'domcontentloaded' });
    const accent = await page.locator(`[data-era-primer="${era.id}"] .era-primer__eyebrow`).first().evaluate(
      (element) => getComputedStyle(element).color,
    );
    accents.push(accent);
  }

  expect(new Set(accents).size).toBe(eraPages.length);
});

test('CITADEL retains its supplied map and flat editorial information blocks', async ({ page }) => {
  await page.goto(eraUrl('citadel'), { waitUntil: 'domcontentloaded' });

  const primer = page.locator('[data-era-primer="citadel"]');
  await expect(primer).toContainText('the creeping blight of Myrkild looms ever larger');
  await expect(primer).toContainText('fortresses on wheels');

  const geometry = await primer.evaluate((element) => {
    const essential = element.querySelector('.era-primer__essential');
    const power = element.querySelector('.era-primer__power');
    const hero = element.querySelector('.era-primer__hero');
    if (
      !(essential instanceof HTMLElement)
      || !(power instanceof HTMLElement)
      || !(hero instanceof HTMLElement)
    ) return null;

    return {
      essentialRadius: getComputedStyle(essential).borderTopLeftRadius,
      essentialBackground: getComputedStyle(essential).backgroundColor,
      powerRadius: getComputedStyle(power).borderTopLeftRadius,
      powerBackground: getComputedStyle(power).backgroundColor,
      heroRadius: getComputedStyle(hero).borderTopLeftRadius,
    };
  });

  expect(geometry).not.toBeNull();
  expect(geometry.essentialRadius).toBe('0px');
  expect(geometry.powerRadius).toBe('0px');
  expect(geometry.heroRadius).toBe('0px');
  expect(geometry.essentialBackground).toBe('rgba(0, 0, 0, 0)');
  expect(geometry.powerBackground).toBe('rgba(0, 0, 0, 0)');
});

test('CITADEL map opens the canonical Atlas entry', async ({ page }) => {
  await page.goto(eraUrl('citadel'), { waitUntil: 'domcontentloaded' });
  await page.locator('[data-era-primer="citadel"] .era-primer__map').click();

  await expect(page).toHaveURL(`${preview}/maps/errack-citadel/`);
  await expect(page.getByRole('heading', { name: 'Errack — CITADEL', level: 1 })).toBeVisible();
  await expect(page.locator('[data-atlas]')).toBeVisible();
  await expect(page.locator('.atlas__empty-note')).toContainText('no positioned markers');
});
