import { test, expect } from '@playwright/test';

const baseUrl = process.env.CONTACT_TEST_BASE_URL ?? 'http://127.0.0.1:4321';
const supportUrl = `${baseUrl}/support/`;

test.use({ viewport: { width: 1280, height: 900 } });

test('support interactive surfaces stay rounded and legible in light mode', async ({ page }) => {
  await page.goto(supportUrl, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'light';
  });

  const readSurface = (locator) => locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      background: style.backgroundColor,
      color: style.color,
      radius: Number.parseFloat(style.borderRadius),
    };
  });

  const issueCard = page.locator('.support-card').first();
  await issueCard.hover();
  const issueSurface = await readSurface(issueCard);
  expect(issueSurface.background).not.toBe('rgb(0, 0, 0)');
  expect(issueSurface.background).not.toBe(issueSurface.color);
  expect(issueSurface.radius).toBeGreaterThan(0);

  const activeSocial = page.locator('.support-social--active').first();
  await activeSocial.hover();
  const socialSurface = await readSurface(activeSocial);
  expect(socialSurface.background).not.toBe('rgb(0, 0, 0)');
  expect(socialSurface.radius).toBeGreaterThan(0);

  const staticSocialRadius = await page.locator('.support-social:not(.support-social--active)').first().evaluate(
    (element) => Number.parseFloat(getComputedStyle(element).borderRadius),
  );
  const supporterRadius = await page.locator('.support-placeholder').first().evaluate(
    (element) => Number.parseFloat(getComputedStyle(element).borderRadius),
  );
  expect(staticSocialRadius).toBe(0);
  expect(supporterRadius).toBe(0);

  const contactAction = page.locator('.support-contact__action');
  await contactAction.hover();
  const contactSurface = await readSurface(contactAction);
  expect(contactSurface.background).not.toBe('rgb(0, 0, 0)');
  expect(contactSurface.background).not.toBe(contactSurface.color);
  expect(contactSurface.radius).toBeGreaterThan(0);

  const discordMark = page.locator('.support-social').filter({ hasText: 'Discord' }).locator('.support-social__mark');
  await expect(discordMark).toBeVisible();
  expect(await discordMark.evaluate((element) => getComputedStyle(element).color)).toBe('rgb(0, 0, 0)');
});

test('support serves the requested black Discord icon without clipping its source shape', async ({ request }) => {
  const response = await request.get(`${baseUrl}/icons/discord.svg`);
  expect(response.ok()).toBe(true);

  const svg = await response.text();
  expect(svg).toContain('viewBox="0 -1 24 25"');
  expect(svg).toContain('fill="#000"');
  expect(svg).toContain('M19.5 2.75C19.815 3.421');
});
