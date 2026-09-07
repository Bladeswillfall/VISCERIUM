import { test, expect } from '@playwright/test';

const baseUrl = process.env.CONTACT_TEST_BASE_URL ?? 'http://127.0.0.1:4321';
const supportUrl = `${baseUrl}/support/`;

test.use({ viewport: { width: 1280, height: 900 } });

test('support card geometry and light-mode surfaces stay legible', async ({ page }) => {
  await page.goto(supportUrl, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'light';
  });

  const readSurface = (locator) => locator.evaluate((element) => {
    const style = getComputedStyle(element);
    const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
    return {
      background: style.backgroundColor,
      color: style.color,
      radius: Number.parseFloat(style.borderRadius),
      heightRem: element.getBoundingClientRect().height / rootFontSize,
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
  expect(socialSurface.radius).toBe(0);
  expect(socialSurface.heightRem).toBeLessThan(9);

  const staticSocialRadius = await page.locator('.support-social:not(.support-social--active)').first().evaluate(
    (element) => Number.parseFloat(getComputedStyle(element).borderRadius),
  );
  const supporterRadius = await page.locator('.support-placeholder').first().evaluate(
    (element) => Number.parseFloat(getComputedStyle(element).borderRadius),
  );
  expect(staticSocialRadius).toBe(0);
  expect(supporterRadius).toBe(0);

  const watermark = page.locator('.support-placeholder__watermark').first();
  await expect(watermark).toBeVisible();
  const watermarkState = await watermark.evaluate((element) => {
    const card = element.closest('.support-placeholder');
    const cardWidth = card?.getBoundingClientRect().width ?? 0;
    return {
      ariaHidden: element.getAttribute('aria-hidden'),
      pointerEvents: getComputedStyle(element).pointerEvents,
      widthRatio: cardWidth > 0 ? element.getBoundingClientRect().width / cardWidth : 0,
      lightColor: getComputedStyle(element).color,
    };
  });
  expect(watermarkState.ariaHidden).toBe('true');
  expect(watermarkState.pointerEvents).toBe('none');
  expect(watermarkState.widthRatio).toBeGreaterThanOrEqual(0.4);
  expect(watermarkState.widthRatio).toBeLessThanOrEqual(0.55);

  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'dark';
  });
  expect(await watermark.evaluate((element) => getComputedStyle(element).color)).not.toBe(watermarkState.lightColor);
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'light';
  });

  const supporterStatus = await page.locator('.support-status').first().evaluate((element) => {
    const statusStyle = getComputedStyle(element);
    const supporter = element.closest('.support-placeholder');
    const description = supporter?.querySelector('p');
    return {
      color: statusStyle.color,
      borderColor: statusStyle.borderTopColor,
      supporterBackground: supporter ? getComputedStyle(supporter).backgroundColor : '',
      descriptionColor: description ? getComputedStyle(description).color : '',
    };
  });
  expect(supporterStatus.color).toBe(supporterStatus.descriptionColor);
  expect(supporterStatus.borderColor).not.toBe(supporterStatus.supporterBackground);

  const contactAction = page.locator('.support-contact__action');
  await contactAction.hover();
  const contactSurface = await readSurface(contactAction);
  expect(contactSurface.background).not.toBe('rgb(0, 0, 0)');
  expect(contactSurface.background).not.toBe(contactSurface.color);
  expect(contactSurface.radius).toBeGreaterThan(0);

  const discordMark = page.locator('.support-social').filter({ hasText: 'Discord' }).locator('.support-social__mark');
  await expect(discordMark).toBeVisible();
  expect(await discordMark.evaluate((element) => getComputedStyle(element).color)).toMatch(
    /^(rgb\(0, 0, 0\)|oklch\(0 0 0\))$/,
  );
});

test('support serves the supplied black Discord icon without changing its geometry', async ({ request }) => {
  const response = await request.get(`${baseUrl}/icons/discord.svg`);
  expect(response.ok()).toBe(true);

  const svg = await response.text();
  expect(svg).toContain('viewBox="0 -28.5 256 256"');
  expect(svg).toContain('fill="#000"');
  expect(svg).toContain('M216.856339,16.5966031');
});
