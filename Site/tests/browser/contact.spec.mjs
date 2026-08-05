import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

test('contact page clearly marks private messaging as unavailable', async ({ page }) => {
  await page.goto('http://127.0.0.1:4321/contact/', { waitUntil: 'networkidle' });

  await expect(page.getByRole('heading', { name: 'Contact us' })).toBeVisible();
  await expect(page.getByText('Private messages are not available right now.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open support page' })).toHaveAttribute('href', '/support/');
  await expect(page.locator('form')).toHaveCount(0);
  await expect(page.locator('.cf-turnstile')).toHaveCount(0);
  await expect(page.locator('script[src*="challenges.cloudflare.com"]')).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://www.viscerium.co.uk/contact/',
  );

  const pageWidth = await page.locator('body').evaluate((body) => body.scrollWidth);
  expect(pageWidth).toBeLessThanOrEqual(390);

  const noteRows = await page.locator('.support-note').evaluateAll((notes) => notes.map((note) => (
    [...note.children].map((child) => {
      const rect = child.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom };
    })
  )));

  for (const rows of noteRows) {
    for (let index = 1; index < rows.length; index += 1) {
      expect(rows[index].top).toBeGreaterThanOrEqual(rows[index - 1].bottom);
    }
  }

  await page.getByRole('link', { name: 'Open support page' }).click();
  await expect(page).toHaveURL('http://127.0.0.1:4321/support/');
  await expect(page.getByRole('heading', { name: 'Support', exact: true })).toBeVisible();
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
