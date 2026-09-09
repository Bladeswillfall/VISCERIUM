import { test, expect } from '@playwright/test';

const calendarUrl = 'http://127.0.0.1:4321/calendar/okse/';

test.use({ viewport: { width: 390, height: 844 } });

test('calendar year controls reject years outside exact absolute-day arithmetic', async ({ page }) => {
  await page.goto(calendarUrl, { waitUntil: 'networkidle' });

  const root = page.locator('[data-vc-calendar-year-island]');
  await expect(root).toHaveAttribute('data-vc-calendar-year-mounted', 'true');

  const input = root.locator('[data-vc-calendar-year-input]');
  const renderedYear = root.locator('[data-vc-calendar-rendered-year]');
  const next = root.locator('[data-vc-calendar-year-step="1"]');

  const start = Number(await input.inputValue());
  await next.click();
  await expect(input).toHaveValue(String(start + 1));
  const renderedAfterStep = await renderedYear.textContent();

  await input.fill(String(Number.MAX_SAFE_INTEGER));
  await input.press('Enter');

  await expect(renderedYear).toHaveText(renderedAfterStep ?? '');
  const validationMessage = await input.evaluate((element) => element.validationMessage);
  expect(validationMessage).toContain('supported absolute-day range');
});

test('calendar edge tooltips stay inside a narrow viewport', async ({ page }) => {
  await page.goto(calendarUrl, { waitUntil: 'networkidle' });

  for (const selector of [
    '.calendar-days--month tr > .calendar-day:first-child a',
    '.calendar-days--month tr > .calendar-day:last-child a',
  ]) {
    const link = page.locator(selector).first();
    await link.evaluate((element) => {
      const tooltip = document.createElement('span');
      tooltip.className = 'calendar-day__events';
      tooltip.setAttribute('aria-hidden', 'true');
      tooltip.textContent = 'The Corporate Genetic Bidding Programme';
      element.append(tooltip);
    });
    const tooltip = link.locator('.calendar-day__events');
    await link.hover();
    await expect(tooltip).toHaveCSS('opacity', '1');

    const rect = await tooltip.evaluate((element) => {
      const box = element.getBoundingClientRect();
      return {
        left: box.left,
        right: box.right,
        viewportWidth: window.innerWidth,
      };
    });

    expect(rect.left).toBeGreaterThanOrEqual(0);
    expect(rect.right).toBeLessThanOrEqual(rect.viewportWidth);
  }
});

test('calendar interface roles use distinct label and section treatments', async ({ page }) => {
  await page.goto(calendarUrl, { waitUntil: 'networkidle' });

  const styles = await page.evaluate(() => {
    const style = (selector) => {
      const element = document.querySelector(selector);
      if (!(element instanceof HTMLElement)) throw new Error(`Missing ${selector}`);
      return getComputedStyle(element);
    };
    return {
      introBorder: style('.calendar-module__intro').borderBottomWidth,
      tailBorder: style('.calendar-module__tail').borderTopWidth,
      monthTransform: style('.calendar-month h3').textTransform,
      factTransform: style('.calendar-module__facts dt').textTransform,
      controlTransform: style('.calendar-module__year-controls label').textTransform,
      legendTransform: style('.calendar-legend h3').textTransform,
    };
  });

  expect(styles.introBorder).toBe('0px');
  expect(styles.tailBorder).toBe('0px');
  expect(styles.monthTransform).toBe('uppercase');
  expect(styles.factTransform).toBe('none');
  expect(styles.controlTransform).toBe('none');
  expect(styles.legendTransform).toBe('none');
});
