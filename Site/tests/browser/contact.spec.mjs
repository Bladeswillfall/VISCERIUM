import { test, expect } from '@playwright/test';

const baseUrl = process.env.CONTACT_TEST_BASE_URL ?? 'http://127.0.0.1:4321';
const contactUrl = `${baseUrl}/contact/`;
const supportUrl = `${baseUrl}/support/`;
const githubIssueUrl = 'https://github.com/Bladeswillfall/VISCERIUM/issues/new/choose';
const enabledContactEndpoint = 'https://contact-form.invalid/submit';
const turnstileTestKey = '1x00000000000000000000AA';

test.use({ viewport: { width: 390, height: 844 } });

test('contact page keeps public issues secondary when private messaging is unavailable', async ({ page, context }) => {
  await context.route(`${githubIssueUrl}*`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'text/plain', body: 'GitHub issue chooser test fixture' });
  });
  await page.goto(contactUrl, { waitUntil: 'networkidle' });

  await expect(page.getByRole('heading', { name: 'Contact', exact: true })).toBeVisible();
  await expect(page.getByText('Public channel', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Submit an Issue.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Send a message.' })).toBeVisible();
  await expect(page.getByText('Private messages are unavailable.')).toBeVisible();
  await expect(page.locator('.contact-hero__body')).toContainText('Private contact is temporarily unavailable.');
  await expect(page.locator('.contact-hero__body')).not.toContainText('use the contact form below');
  await expect(page.locator('.contact-hero__mark')).toHaveCSS('mask-image', /viscerium-logo\.svg/);
  await expect(page.locator('.contact-github-card .codex-icon')).toBeVisible();
  await expect(page.getByRole('link', { name: 'GitHub', exact: true }).first()).toHaveAttribute(
    'href',
    'https://github.com/Bladeswillfall/VISCERIUM/issues',
  );

  const submitIssue = page.getByRole('link', { name: 'Submit an issue', exact: true });
  await expect(submitIssue).toHaveAttribute('href', githubIssueUrl);
  const popupPromise = page.waitForEvent('popup');
  await submitIssue.click();
  const popup = await popupPromise;
  await expect(popup).toHaveURL(githubIssueUrl);
  await popup.close();

  await expect(page.locator('form')).toHaveCount(0);
  await expect(page.locator('.cf-turnstile')).toHaveCount(0);
  await expect(page.locator('script[src*="challenges.cloudflare.com"]')).toHaveCount(0);
  await expect(page.locator('.right-sidebar-container')).toHaveCount(0);
  await expect(page.locator('.codex-discussions')).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://www.viscerium.co.uk/contact/',
  );

  const geometry = await page.evaluate(() => {
    const hero = document.querySelector('.contact-hero');
    const publicSection = document.querySelector('.contact-public');
    if (!(hero instanceof HTMLElement) || !(publicSection instanceof HTMLElement)) return null;
    return {
      pageWidth: document.body.scrollWidth,
      heroHeight: hero.getBoundingClientRect().height,
      publicDocumentTop: publicSection.getBoundingClientRect().top + window.scrollY,
      viewportHeight: window.innerHeight,
    };
  });

  expect(geometry).not.toBeNull();
  expect(geometry.pageWidth).toBeLessThanOrEqual(390);
  expect(geometry.heroHeight).toBeGreaterThanOrEqual(geometry.viewportHeight * 0.5 - 1);
  expect(geometry.publicDocumentTop).toBeLessThan(geometry.viewportHeight);
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
    const publicSection = document.querySelector('.contact-public');
    if (
      !(twoColumn instanceof HTMLElement)
      || !(main instanceof HTMLElement)
      || !(contact instanceof HTMLElement)
      || !(hero instanceof HTMLElement)
      || !(publicSection instanceof HTMLElement)
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
      heroHeight: heroRect.height,
      heroTopDelta: heroRect.top - mainRect.top,
      publicTop: publicSection.getBoundingClientRect().top,
      viewportHeight: window.innerHeight,
    };
  });

  expect(geometry).not.toBeNull();
  expect(Math.abs(geometry.mainWidth - geometry.twoColumnWidth)).toBeLessThanOrEqual(2);
  expect(Math.abs(geometry.contactWidth - geometry.mainWidth)).toBeLessThanOrEqual(2);
  expect(Math.abs(geometry.heroWidth - geometry.contactWidth)).toBeLessThanOrEqual(2);
  expect(Math.abs(geometry.heroTopDelta)).toBeLessThanOrEqual(2);
  expect(geometry.heroHeight).toBeGreaterThanOrEqual(geometry.viewportHeight * 0.5 - 1);
  expect(geometry.publicTop).toBeLessThan(geometry.viewportHeight);

  const headingGeometry = await page.locator('.contact-intro').evaluateAll((intros) => (
    intros.map((intro) => {
      const heading = intro.querySelector('h2')?.getBoundingClientRect();
      const description = intro.querySelector(':scope > p:not(.contact-eyebrow)')?.getBoundingClientRect();
      return heading && description ? { headingBottom: heading.bottom, descriptionTop: description.top } : null;
    }).filter(Boolean)
  ));

  expect(headingGeometry).toHaveLength(2);
  for (const row of headingGeometry) expect(row.descriptionTop).toBeGreaterThanOrEqual(row.headingBottom);
});

test('enabled private contact form exercises every changed control', async ({ page }) => {
  test.skip(process.env.CONTACT_FORM_TEST_ENABLED !== '1', 'Runs only against the enabled contact fixture.');

  let submittedBody = '';
  await page.route(enabledContactEndpoint, async (route) => {
    submittedBody = route.request().postData() ?? '';
    await route.fulfill({ status: 200, contentType: 'text/plain', body: 'Contact form accepted for browser test.' });
  });

  await page.goto(contactUrl, { waitUntil: 'domcontentloaded' });

  const form = page.locator('form.contact-form');
  await expect(form).toBeVisible();
  await expect(form).toHaveAttribute('action', enabledContactEndpoint);
  await expect(page.locator('.contact-hero__body')).toContainText('use the contact form below to email us');

  await page.locator('#contact-name').fill('Review Test');
  await page.locator('#contact-email').fill('review@example.test');
  await page.locator('#contact-subject').fill('Contact form browser check');
  await page.locator('#contact-message').fill('This confirms that the enabled contact controls accept input and submit.');

  const turnstile = page.locator('.cf-turnstile');
  await expect(turnstile).toHaveAttribute('data-sitekey', turnstileTestKey);
  await expect(page.locator('script[src*="challenges.cloudflare.com"]')).toHaveCount(1);
  await expect(turnstile.locator('iframe')).toBeVisible({ timeout: 15_000 });

  const requestPromise = page.waitForRequest(
    (request) => request.url() === enabledContactEndpoint && request.method() === 'POST',
  );
  await page.getByRole('button', { name: 'Send message' }).click();
  await requestPromise;

  expect(submittedBody).toContain('Review Test');
  expect(submittedBody).toContain('review@example.test');
  expect(submittedBody).toContain('Contact form browser check');
  expect(submittedBody).toContain('This confirms that the enabled contact controls accept input and submit.');
});

test('support status copy clears every section heading', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(supportUrl, { waitUntil: 'networkidle' });

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