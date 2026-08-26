import { test, expect } from '@playwright/test';

const homeUrl = 'http://127.0.0.1:4321/';
const citadelUrl = 'http://127.0.0.1:4321/eras/citadel/';

test.use({ viewport: { width: 1280, height: 900 } });

test('homepage does not load smart tooltip positioning code', async ({ page }) => {
  const requestedPaths = [];
  page.on('request', (request) => requestedPaths.push(new URL(request.url()).pathname));

  await page.goto(homeUrl, { waitUntil: 'networkidle' });

  expect(requestedPaths.some((pathname) => pathname.includes('floating-position'))).toBe(false);
  await expect(page.locator('.codex-smart-tooltip')).toHaveCount(0);
});

test('era primer context tips escape clipped cards and remain inside their safe zone', async ({ page }) => {
  await page.goto(citadelUrl, { waitUntil: 'networkidle' });

  const primer = page.locator('[data-era-primer="citadel"]');
  const traits = primer.locator('.era-primer__trait');
  const tooltip = page.locator('.codex-smart-tooltip');

  for (const trigger of [traits.first(), traits.last()]) {
    await trigger.hover();
    await expect(tooltip).toBeVisible();

    const geometry = await page.evaluate(() => {
      const primerElement = document.querySelector('[data-era-primer="citadel"]');
      const tooltipElement = document.querySelector('.codex-smart-tooltip');
      if (!(primerElement instanceof HTMLElement) || !(tooltipElement instanceof HTMLElement)) return null;

      const primerRect = primerElement.getBoundingClientRect();
      const tooltipRect = tooltipElement.getBoundingClientRect();
      return {
        bodyLevel: tooltipElement.parentElement === document.body,
        primerLeft: primerRect.left,
        primerRight: primerRect.right,
        tooltipLeft: tooltipRect.left,
        tooltipRight: tooltipRect.right,
        viewportWidth: window.innerWidth,
        placement: tooltipElement.dataset.placement,
        alignment: tooltipElement.dataset.alignment,
      };
    });

    expect(geometry).not.toBeNull();
    expect(geometry.bodyLevel).toBe(true);
    expect(geometry.tooltipLeft).toBeGreaterThanOrEqual(Math.max(12, geometry.primerLeft + 12) - 1);
    expect(geometry.tooltipRight).toBeLessThanOrEqual(Math.min(geometry.viewportWidth - 12, geometry.primerRight - 12) + 1);
    expect(['top', 'bottom', 'right', 'left']).toContain(geometry.placement);
    expect(['center', 'start', 'end']).toContain(geometry.alignment);
  }
});

test('keyboard focus retains accessible copy and Escape dismisses the tooltip', async ({ page }) => {
  await page.goto(citadelUrl, { waitUntil: 'networkidle' });

  const trigger = page.locator('[data-era-primer="citadel"] .era-primer__trait').first();
  const tooltip = page.locator('.codex-smart-tooltip');
  await trigger.focus();
  await expect(tooltip).toBeVisible();

  const accessibleLabel = await trigger.getAttribute('aria-label');
  const tooltipText = await tooltip.textContent();
  expect(accessibleLabel).toContain(tooltipText);

  await page.keyboard.press('Escape');
  await expect(tooltip).toBeHidden();
  await expect(trigger).toBeFocused();
});
