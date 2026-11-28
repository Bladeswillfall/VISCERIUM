import { test, expect } from '@playwright/test';

const preview = 'http://127.0.0.1:4321';
const phone = { width: 390, height: 844 };

async function useAtlasMarkerFixture(page) {
  await page.route('**/maps/errack-citadel/', async (route) => {
    const response = await route.fetch();
    const html = (await response.text()).replace(
      /(<script[^>]*data-atlas-payload[^>]*>)([\s\S]*?)(<\/script>)/,
      (_, opening, json, closing) => {
        const payload = JSON.parse(json);
        payload.markers = [{ title: 'Review Harbour', x: 50, y: 50, type: 'city', page: '/start-here/' }];
        return opening + JSON.stringify(payload) + closing;
      },
    );
    await route.fulfill({ response, body: html });
  });
}

for (const mobile of [false, true]) {
  test(`relationship search announces results and retains focus on ${mobile ? 'mobile' : 'desktop'}`, async ({ page }) => {
    await page.setViewportSize(mobile ? phone : { width: 1440, height: 1000 });
    await page.goto(`${preview}/relationships/`);
    const root = page.locator('[data-relationship-explorer]');
    await expect(root).toHaveAttribute('data-relationship-ready', 'true');
    await expect(root.getByRole('region', { name: 'Relationship list', exact: true })).toBeVisible();
    await expect(root.getByRole('group', {
      name: mobile ? 'Mobile relationship controls' : 'Relationship graph controls', exact: true,
    })).toBeVisible();
    const trigger = root.getByRole('button', { name: 'Search relationships', exact: true });
    if (mobile) await trigger.click();
    const shell = mobile ? root.locator('#relationship-mobile-search') : root.locator('.relationship-explorer__toolbar');
    const search = shell.getByRole('searchbox', { includeHidden: true });
    const status = shell.getByRole('status', { includeHidden: true });
    const results = shell.locator('[data-relationship-search-results]');
    await expect(results).toHaveAttribute('id', /.+/);
    await expect(search).toHaveAttribute('aria-controls', await results.getAttribute('id'));
    await expect(status).toBeEmpty();
    await search.fill('zzzzzzzzz-no-entity');
    await expect(status).toHaveText('No matching entities.');
    await search.fill('Askalia');
    const buttons = results.getByRole('button');
    await expect(buttons.first()).toBeVisible();
    await expect(status).toHaveText(`Search results: ${await buttons.count()}.`);
    await search.fill('');
    await expect(status).toBeEmpty();
    await search.fill('Askalia');
    await buttons.first().focus();
    await page.keyboard.press('Enter');
    if (mobile) {
      const inspector = root.getByRole('dialog', { name: 'Relationship details' });
      await expect(inspector).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(inspector).toBeHidden();
      await expect(trigger).toBeFocused();
    } else {
      await expect(search).toBeFocused();
      await search.fill('Askalia');
      await expect(status).toHaveText(/^Search results: \d+\.$/);
      await shell.getByRole('button', { name: 'Reset', exact: true }).click();
      await expect(search).toHaveValue('');
    }
    await expect(status).toBeEmpty();
  });
}

for (const reducedMotion of ['reduce', 'no-preference']) {
  test(`Atlas search and reset honour ${reducedMotion} motion and restore inspector focus`, async ({ page }) => {
    await page.setViewportSize(phone);
    await page.emulateMedia({ reducedMotion });
    await useAtlasMarkerFixture(page);
    await page.goto(`${preview}/maps/errack-citadel/`);
    const root = page.locator('[data-atlas]');
    await expect(root).toHaveAttribute('data-atlas-ready', 'true');
    await page.evaluate(() => {
      const original = window.L.Map.prototype.setView;
      window.mapAnimationRequests = [];
      window.L.Map.prototype.setView = function (centre, zoom, options) {
        window.mapAnimationRequests.push(options?.animate);
        return original.call(this, centre, zoom, options);
      };
    });
    const trigger = root.getByRole('button', { name: 'Search map', exact: true });
    await trigger.click();
    const shell = root.locator('.atlas__mobile-search');
    const search = shell.getByRole('searchbox', { includeHidden: true });
    const status = shell.getByRole('status', { includeHidden: true });
    const results = shell.locator('[data-atlas-search-results]');
    await expect(results).toHaveAttribute('id', /.+/);
    await expect(search).toHaveAttribute('aria-controls', await results.getAttribute('id'));
    await search.fill('zzzzzzzzz-no-marker');
    await expect(status).toHaveText('No matching markers.');
    await search.fill('Review Harbour');
    await expect(status).toHaveText('Search results: 1.');
    await results.getByRole('button').focus();
    await page.keyboard.press('Enter');
    const inspector = root.getByRole('dialog', { name: 'Location details' });
    await expect(inspector).toBeVisible();
    await inspector.getByRole('button', { name: 'Close location details' }).click();
    await expect(trigger).toBeFocused();
    await expect(status).toBeEmpty();
    await trigger.click();
    await search.fill('Review Harbour');
    await expect(status).toHaveText('Search results: 1.');
    await root.getByRole('button', { name: 'Reset map view', exact: true }).click();
    await expect(status).toBeEmpty();
    await expect(search).toHaveValue('');
    expect(await page.evaluate(() => window.mapAnimationRequests)).toEqual([
      reducedMotion !== 'reduce', reducedMotion !== 'reduce',
    ]);
  });
}
