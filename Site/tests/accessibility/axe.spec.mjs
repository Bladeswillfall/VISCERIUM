import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const baseUrl = 'http://127.0.0.1:4321';
const wcagTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const routes = [
  ['home', '/'],
  ['start here', '/start-here/'],
  ['article', '/eras/citadel/'],
  ['calendar', '/calendar/'],
  ['world graph', '/graph/'],
  ['relationships', '/relationships/'],
  ['atlas', '/maps/errack-citadel/'],
  ['Askalia', '/eras/citadel/nations/republic-of-askalia/'],
  ['Satol', '/eras/citadel/nations/kingdom-of-satol/'],
  ['Okse', '/eras/citadel/nations/okse-dominion/'],
  ['support', '/support/'],
  ['contact', '/contact/'],
];

const skipTargetRoutes = [
  '/relationships/',
  '/graph/',
  '/maps/errack-citadel/',
  '/eras/citadel/relationships/',
  '/eras/smog/relationships/',
  '/eras/nearsight/relationships/',
  '/eras/entropy/relationships/',
];

const boundaryRoutes = [
  ['relationships', '/relationships/', [
    '.relationship-search input',
    '.relationship-control select',
    '.relationship-explorer__reset',
  ]],
  ['atlas', '/maps/errack-citadel/', [
    '.atlas-search input',
    '.atlas__reset',
  ]],
  ['start here', '/start-here/', ['[data-breadcrumb-group="world"] .start-choice']],
];

const eraBoundaryTokens = {
  citadel: '--era-e1-accent',
  smog: '--era-e2-accent',
  nearsight: '--era-e3-accent',
  entropy: '--era-e4-accent',
};

async function installTheme(page, theme) {
  await page.emulateMedia({ colorScheme: theme });
  await page.addInitScript((selectedTheme) => {
    localStorage.setItem('starlight-theme', selectedTheme);
  }, theme);
}

function formatViolations(violations) {
  return violations
    .map(({ id, impact, help, nodes }) => {
      const targets = nodes
        .slice(0, 3)
        .map((node) => node.target.join(' '))
        .join(', ');
      return `${impact ?? 'unknown'} ${id}: ${help} (${nodes.length} node(s))${targets ? `: ${targets}` : ''}`;
    })
    .join('\n');
}

for (const [name, path] of routes) {
  test(`${name} has no automatically detectable WCAG A/AA violations`, async ({ page }) => {
    await page.goto(`${baseUrl}${path}`, { waitUntil: 'networkidle' });

    const results = await new AxeBuilder({ page })
      .withTags(wcagTags)
      .analyze();

    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });
}

for (const path of skipTargetRoutes) {
  test(`${path} provides the Starlight skip-link target`, async ({ page }) => {
    await page.goto(`${baseUrl}${path}`, { waitUntil: 'networkidle' });
    await expect(page.locator('a.sl-skip-link')).toHaveAttribute('href', '#_top');
    await expect(page.locator('#_top')).toHaveCount(1);
  });
}

for (const theme of ['dark', 'light']) {
  for (const [name, path, selectors] of boundaryRoutes) {
    test(`${name} uses the strong control boundary in ${theme} mode`, async ({ page }) => {
      await installTheme(page, theme);
      await page.goto(`${baseUrl}${path}`, { waitUntil: 'networkidle' });

      const boundaries = await page.evaluate((controlSelectors) => {
        const probe = document.createElement('span');
        probe.style.color = 'var(--codex-border-strong)';
        document.body.append(probe);
        const strongBorder = getComputedStyle(probe).color;
        probe.remove();

        return controlSelectors.map((selector) => {
          const element = document.querySelector(selector);
          if (!(element instanceof HTMLElement)) return { selector, border: null, strongBorder };
          return { selector, border: getComputedStyle(element).borderTopColor, strongBorder };
        });
      }, selectors);

      for (const { selector, border, strongBorder } of boundaries) {
        expect(border, `${selector} should use the accessible control boundary token`).toBe(strongBorder);
      }
    });
  }

  test(`Start Here era choices use AA-tuned era boundaries in ${theme} mode`, async ({ page }) => {
    await installTheme(page, theme);
    await page.goto(`${baseUrl}/start-here/`, { waitUntil: 'networkidle' });

    const boundaries = await page.evaluate((tokenMap) => {
      const probe = document.createElement('span');
      document.body.append(probe);
      const results = Object.entries(tokenMap).map(([era, token]) => {
        const element = document.querySelector(`[data-breadcrumb-group="era"] .start-choice[data-value="${era}"]`);
        probe.style.color = `var(${token})`;
        return {
          era,
          border: element instanceof HTMLElement ? getComputedStyle(element).borderTopColor : null,
          expected: getComputedStyle(probe).color,
        };
      });
      probe.remove();
      return results;
    }, eraBoundaryTokens);

    for (const { era, border, expected } of boundaries) {
      expect(border, `${era} should use its AA-tuned era boundary`).toBe(expected);
    }
    expect(new Set(boundaries.map(({ border }) => border)).size).toBe(4);
  });
}

test('audited legacy articles expose semantic headings and no dead image wrappers', async ({ page }) => {
  for (const path of [
    '/eras/citadel/nations/republic-of-askalia/',
    '/eras/citadel/nations/kingdom-of-satol/',
    '/eras/citadel/nations/krass-dominion/',
  ]) {
    await page.goto(`${baseUrl}${path}`, { waitUntil: 'networkidle' });
    await expect(page.locator('main a[href^="/i/"], main a[href^="/w/viscerium/"]')).toHaveCount(0);
    const filenameAlts = await page.locator('main img[alt]').evaluateAll((images) => images
      .map((image) => image.getAttribute('alt') ?? '')
      .filter((alt) => /\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(alt.trim())));
    expect(filenameAlts, `${path} should not expose filenames as image alternatives`).toEqual([]);
  }

  for (const path of [
    '/eras/citadel/nations/republic-of-askalia/',
    '/eras/citadel/nations/kingdom-of-satol/',
  ]) {
    await page.goto(`${baseUrl}${path}`, { waitUntil: 'networkidle' });
    for (const heading of ['History', 'People', 'Major Exports', 'Wildlife']) {
      const element = page.getByRole('heading', { name: heading, exact: true });
      await expect(element).toHaveCount(1);
      expect(await element.evaluate((node) => node.tagName)).toBe('H2');
    }
  }
});

test('audited image alternatives do not expose filenames', async ({ page }) => {
  await page.goto(`${baseUrl}/degel-system/errack/`, { waitUntil: 'networkidle' });
  const filenameAlts = await page.locator('main img[alt]').evaluateAll((images) => images
    .map((image) => image.getAttribute('alt') ?? '')
    .filter((alt) => /\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(alt.trim())));
  expect(filenameAlts).toEqual([]);
});
