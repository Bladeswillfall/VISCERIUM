import { test, expect } from '@playwright/test';

const baseUrl = process.env.CONTACT_TEST_BASE_URL ?? 'http://127.0.0.1:4321';
const statementUrl = `${baseUrl}/statements/human-authorship-and-ai/`;

test('human authorship statement is published at its canonical route', async ({ page }) => {
  const response = await page.goto(statementUrl, { waitUntil: 'domcontentloaded' });

  expect(response?.status()).toBe(200);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Human Authorship, AI & the Tools We Use' }),
  ).toBeVisible();
});
