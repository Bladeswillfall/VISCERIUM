import { test, expect } from '@playwright/test';

const baseUrl = process.env.CONTACT_TEST_BASE_URL ?? 'http://127.0.0.1:4321';
const statementUrl = `${baseUrl}/statements/human-authorship-and-ai/`;
const policyUrl = `${baseUrl}/policies/content-production/`;

test('human authorship statement is published at its canonical route', async ({ page }) => {
  const response = await page.goto(statementUrl, { waitUntil: 'domcontentloaded' });

  expect(response?.status()).toBe(200);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Human Authorship, AI & the Tools We Use' }),
  ).toBeVisible();
});

test('policy and commentary suppress Starlight previous/next pagination', async ({ page }) => {
  for (const url of [policyUrl, statementUrl]) {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    await expect(page.locator('.pagination-links')).toBeHidden();
  }
});

test('content production policy disables community interactions', async ({ page }) => {
  const policyResponse = await page.goto(policyUrl, { waitUntil: 'domcontentloaded' });
  expect(policyResponse?.status()).toBe(200);

  await expect(page.locator('.codex-discussions')).toHaveCount(0);
  await expect(page.locator('viscerium-kudos')).toHaveCount(0);
  await expect(page.locator('viscerium-comments')).toHaveCount(0);
  await expect(page.locator('codex-webmentions')).toHaveCount(0);

  const commentaryResponse = await page.goto(statementUrl, { waitUntil: 'domcontentloaded' });
  expect(commentaryResponse?.status()).toBe(200);
  await expect(page.locator('.codex-discussions')).toBeVisible();
  await expect(page.locator('viscerium-kudos')).toHaveCount(1);
});

test('Elias Vail signature remains visible, themed, and responsive', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto(statementUrl, { waitUntil: 'networkidle' });
  expect(response?.status()).toBe(200);

  const signature = page.getByRole('img', { name: 'Handwritten signature of Elias Vail' });
  await expect(signature).toBeVisible();

  const bounds = await signature.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds.width).toBeLessThanOrEqual(390);

  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'light';
  });
  expect(await signature.evaluate((element) => getComputedStyle(element).filter)).toBe('none');
  expect(await signature.evaluate((element) => getComputedStyle(element).opacity)).toBe('0.3');

  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'dark';
  });
  expect(await signature.evaluate((element) => getComputedStyle(element).filter)).not.toBe('none');
  expect(await signature.evaluate((element) => getComputedStyle(element).opacity)).toBe('0.7');
  await expect(signature).toBeVisible();
});
