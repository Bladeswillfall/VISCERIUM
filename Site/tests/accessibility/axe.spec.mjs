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
  ['support', '/support/'],
  ['contact', '/contact/'],
];

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
