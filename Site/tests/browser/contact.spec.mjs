import { test, expect } from '@playwright/test';

const baseUrl = process.env.CONTACT_TEST_BASE_URL ?? 'http://127.0.0.1:4321';
const contactUrl = `${baseUrl}/contact/`;
const supportUrl = `${baseUrl}/support/`;
const githubIssueUrl = 'https://github.com/Bladeswillfall/VISCERIUM/issues/new/choose';
const enabledContactEndpoint = 'https://contact-form.invalid/submit';

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
  await expect(page.locator('.contact-hero__body')).toContainText('GitHub so it can be tracked publicly.');
  await expect(page.locator('.contact-hero__body')).not.toContainText('use the contact form below');
  await expect(page.locator('.contact-public__intro > p')).toContainText('GitHub so it can be tracked publicly.');
  await expect(page.locator('.contact-github-card > p')).toContainText('GitHub so the discussion and fix stay attached');
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
  for (const row of headingGeometry) expect(row.descriptionTop).toBeGreaterThanOrEqual(row.headingBottom + 8);

  const headingStyles = await page.locator('#private-message-title').evaluate((heading) => ({
    display: getComputedStyle(heading).display,
    beforeContent: getComputedStyle(heading, '::before').content,
    afterContent: getComputedStyle(heading, '::after').content,
    marginBottom: Number.parseFloat(getComputedStyle(heading).marginBottom),
  }));

  expect(headingStyles.display).toBe('block');
  expect(headingStyles.beforeContent).toBe('none');
  expect(headingStyles.afterContent).toBe('none');
  expect(headingStyles.marginBottom).toBeGreaterThanOrEqual(16);
});

test('contact fixed-dark panels stay legible in light theme', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(contactUrl, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'light';
  });

  const colors = await page.evaluate(() => {
    const color = (selector) => getComputedStyle(document.querySelector(selector)).color;
    const background = (selector) => getComputedStyle(document.querySelector(selector)).backgroundColor;
    return {
      fixedHeading: color('.contact-hero h1'),
      fixedBody: color('.contact-hero__body'),
      githubHeading: color('.contact-github-card h3'),
      githubBody: color('.contact-github-card > p'),
      unavailableHeading: color('.contact-form-unavailable h3'),
      unavailableBody: color('.contact-form-unavailable > p'),
      formMeta: color('.contact-form-shell__top'),
      unavailableLink: color('.contact-form-unavailable .contact-inline-link'),
      actionText: color('.contact-secondary-action'),
      actionBackground: background('.contact-secondary-action'),
      cardBackground: background('.contact-github-card'),
      githubHeadingTransform: getComputedStyle(document.querySelector('.contact-github-card h3')).textTransform,
    };
  });

  expect(colors.githubHeading).toBe(colors.fixedHeading);
  expect(colors.githubBody).toBe(colors.fixedBody);
  expect(colors.unavailableHeading).toBe(colors.fixedHeading);
  expect(colors.unavailableBody).toBe(colors.fixedBody);
  expect(colors.formMeta).toBe(colors.fixedBody);
  expect(colors.unavailableLink).toBe(colors.fixedHeading);
  expect(colors.actionText).toBe(colors.fixedHeading);
  expect(colors.actionBackground).not.toBe(colors.actionText);
  expect(colors.actionBackground).not.toBe(colors.cardBackground);
  expect(colors.githubHeadingTransform).toBe('none');
});

test('enabled private contact form exercises every changed control', async ({ page }) => {
  test.skip(process.env.CONTACT_FORM_TEST_ENABLED !== '1', 'Runs only against the enabled contact fixture.');

  let submittedBody = '';
  await page.route('https://challenges.cloudflare.com/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
  });
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

  const geometry = await page.locator('.support-section__header, .support-contact__inner > div').evaluateAll((headers) => (
    headers.map((header) => {
      const heading = header.querySelector('h2')?.getBoundingClientRect();
      const description = header.querySelector(':scope > p:not(.support-eyebrow)')?.getBoundingClientRect();
      return heading && description ? {
        heading: { top: heading.top, right: heading.right, bottom: heading.bottom, left: heading.left },
        description: { top: description.top, right: description.right, bottom: description.bottom, left: description.left },
      } : null;
    }).filter(Boolean)
  ));

  expect(geometry).toHaveLength(4);
  for (const row of geometry) {
    const gap = 4;
    const clearsHeading = row.description.left >= row.heading.right + gap
      || row.description.right <= row.heading.left - gap
      || row.description.top >= row.heading.bottom + gap
      || row.description.bottom <= row.heading.top - gap;
    expect(clearsHeading).toBe(true);
  }
  await expect(page.locator('main')).not.toContainText(/\b(?:Worker|Resend|Turnstile|deployment)\b/i);
});
