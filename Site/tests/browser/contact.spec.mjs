import { test, expect } from '@playwright/test';

const contactUrl = 'http://127.0.0.1:4321/contact/';

test.use({ viewport: { width: 390, height: 844 } });

test('contact page keeps public issues secondary when private messaging is unavailable', async ({ page }) => {
  await page.goto(contactUrl, { waitUntil: 'networkidle' });

  await expect(page.getByRole('heading', { name: 'Contact', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Submit an Issue.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Send a message.' })).toBeVisible();
  await expect(page.getByText('Private messages are unavailable.')).toBeVisible();
  await expect(page.locator('.contact-github-card .codex-icon')).toBeVisible();
  await expect(page.getByRole('link', { name: 'GitHub', exact: true }).first()).toHaveAttribute(
    'href',
    'https://github.com/Bladeswillfall/VISCERIUM/issues',
  );
  await expect(page.getByRole('link', { name: 'Submit an issue' })).toHaveAttribute(
    'href',
    'https://github.com/Bladeswillfall/VISCERIUM/issues/new/choose',
  );
  await expect(page.locator('form')).toHaveCount(0);
  await expect(page.locator('.cf-turnstile')).toHaveCount(0);
  await expect(page.locator('script[src*="challenges.cloudflare.com"]')).toHaveCount(0);
  await expect(page.locator('.right-sidebar-container')).toHaveCount(0);
  await expect(page.locator('.codex-discussions')).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://www.viscerium.co.uk/contact/',
  );

  const pageWidth = await page.locator('body').evaluate((body) => body.scrollWidth);
  expect(pageWidth).toBeLessThanOrEqual(390);
});

test('contact page owns the full custom canvas on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(contactUrl, { waitUntil: 'networkidle' });

  await expect(page.locator('.contact-page')).toBeVisible();
  await expect(page.locator('.right-sidebar-container')).toHaveCount(0);
  await expect(page.locator('.codex-discussions')).toHaveCount(0);
  await expect(page.locator('.content-panel > .sl-container > .codex-header-figure')).toBeHidden();
  await expect(page.locator('.content-panel > .sl-container > h1#_top')).toBeHidden();
  await expect(page.locator('.content-panel > .sl-container > .codex-breadcrumbs')).toBeHidden();

  const geometry = await page.evaluate(() => {
    const twoColumn = document.querySelector('.codex-two-column-content');
    const main = document.querySelector('.codex-main-pane > main');
    const contact = document.querySelector('.contact-page');
    const hero = document.querySelector('.contact-hero');
    if (
      !(twoColumn instanceof HTMLElement)
      || !(main instanceof HTMLElement)
      || !(contact instanceof HTMLElement)
      || !(hero instanceof HTMLElement)
    ) return null;

    const twoColumnRect = twoColumn.getBoundingClientRect();
    const mainRect = main.getBoundingClientRect();
    const contactRect = contact.getBoundingClientRect();
    const heroRect = hero.getBoundingClientRect();
    return {
      twoColumnWidth: twoColumnRect.width,
      mainWidth: mainRect.width,
      contactWidth: contactRect.width,
      heroWidth: heroRect.width,
      heroTopDelta: heroRect.top - mainRect.top,
    };
  });

  expect(geometry).not.toBeNull();
  expect(Math.abs(geometry.mainWidth - geometry.twoColumnWidth)).toBeLessThanOrEqual(2);
  expect(Math.abs(geometry.contactWidth - geometry.mainWidth)).toBeLessThanOrEqual(2);
  expect(Math.abs(geometry.heroWidth - geometry.contactWidth)).toBeLessThanOrEqual(2);
  expect(Math.abs(geometry.heroTopDelta)).toBeLessThanOrEqual(2);
});

test('support status copy clears every section heading', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('http://127.0.0.1:4321/support/', { waitUntil: 'networkidle' });

  const geometry = await page.locator('.support-section > header, .support-contact > div').evaluateAll((headers) => (
    headers.map((header) => {
      const heading = header.querySelector('h2')?.getBoundingClientRect();
      const description = header.querySelector('p')?.getBoundingClientRect();
      return heading && description ? { headingBottom: heading.bottom, descriptionTop: description.top } : null;
    }).filter(Boolean)
  ));

  expect(geometry.length).toBeGreaterThan(0);
  for (const row of geometry) expect(row.descriptionTop).toBeGreaterThanOrEqual(row.headingBottom + 4);
  await expect(page.locator('main')).not.toContainText(/\b(?:Worker|Resend|Turnstile|deployment)\b/i);
});
