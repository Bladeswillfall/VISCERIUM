import { test, expect } from '@playwright/test';

const preview = 'http://127.0.0.1:4321';
const cases = [
  ['CITADEL', '/eras/citadel/events/the-galdyr-compact/', '--sl-color-red-high'],
  ['SMOG', '/eras/smog/events/the-grey-armistice/', '--era-e2-accent-high'],
  ['NEARSIGHT', '/eras/nearsight/events/tcsc-bastion-doctrine-adopted/', '--era-e3-accent-high'],
  ['ENTROPY', '/eras/entropy/events/the-vodr-signal-bloom/', '--era-e4-accent-high'],
];

test('Appreciate control follows the active era context', async ({ page }) => {
  for (const [era, path, token] of cases) {
    await page.goto(`${preview}${path}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('data-era-context', era);
    await expect(page.locator('.kudos-button')).toBeAttached();

    const colours = await page.evaluate((tokenName) => {
      const button = document.querySelector('.kudos-button');
      if (!(button instanceof HTMLElement)) throw new Error('Missing Appreciate button');

      const probe = document.createElement('span');
      probe.style.color = `var(${tokenName})`;
      document.body.append(probe);
      const expected = getComputedStyle(probe).color;
      probe.remove();

      return {
        actual: getComputedStyle(button).color,
        expected,
      };
    }, token);

    expect(colours.actual).toBe(colours.expected);
  }
});
