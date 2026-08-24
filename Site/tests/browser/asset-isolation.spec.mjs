import { test, expect } from '@playwright/test';

test('ordinary articles do not load specialist route assets', async ({ page }) => {
  const requested = [];
  page.on('request', (request) => requested.push(request.url()));

  await page.goto('http://127.0.0.1:4321/degel-system/errack/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(250);

  const specialist = requested.filter((url) => (
    /\/(?:renderer|TimelineApp|timeline-canvas|WorldGraph|cytoscape|WorldMap|RelationshipGraph)[._-]/i.test(url)
    || /comments\.viscerium\.co\.uk/i.test(url)
  ));
  expect(specialist).toEqual([]);
});
