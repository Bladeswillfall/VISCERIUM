import { test, expect } from '@playwright/test';

const preview = 'http://127.0.0.1:4321';

async function openHome(page, viewport) {
  await page.setViewportSize(viewport);
  await page.goto(`${preview}/`, { waitUntil: 'networkidle' });
}

test.describe('homepage reading routes', () => {
  test('landing page is structural and keeps its own H2 spacing', async ({ page }) => {
    await openHome(page, { width: 1440, height: 980 });

    await expect(page.locator('.codex-page-classifier--homepage')).toHaveCount(1);
    await expect(page.locator('.codex-page-classifier--structural')).toHaveCount(1);
    await expect(page.locator('.codex-page-classifier--article')).toHaveCount(0);

    const heading = page.locator('#home-continuum-title');
    await expect(heading).toBeVisible();
    const marginBottom = await heading.evaluate((element) => getComputedStyle(element).marginBottom);
    expect(marginBottom).not.toBe('-24px');
    expect(Number.parseFloat(marginBottom)).toBeGreaterThan(0);
  });

  test('phone shows all four era choices in a compact two-column grid', async ({ page }) => {
    await openHome(page, { width: 390, height: 844 });

    const gateway = page.locator('#home-era-gateway');
    await expect(gateway).toBeVisible();
    await expect(page.locator('.home-era-scroll-hint')).toBeHidden();
    await expect(gateway.locator('.home-era-card')).toHaveCount(4);

    const geometry = await gateway.evaluate((element) => {
      const items = [...element.querySelectorAll(':scope > li')].map((item) => item.getBoundingClientRect());
      const cards = [...element.querySelectorAll('.home-era-card')].map((card) => card.getBoundingClientRect());
      const style = getComputedStyle(element);
      return {
        display: style.display,
        columns: style.gridTemplateColumns.split(' ').length,
        overflowX: style.overflowX,
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        firstWidth: cards[0]?.width ?? 0,
        secondWidth: cards[1]?.width ?? 0,
        firstRowTop: items[0]?.top ?? 0,
        secondRowTop: items[1]?.top ?? 0,
        thirdRowTop: items[2]?.top ?? 0,
        documentOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      };
    });

    expect(geometry.display).toBe('grid');
    expect(geometry.columns).toBe(2);
    expect(geometry.overflowX).toBe('visible');
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
    expect(geometry.firstWidth).toBeGreaterThan(150);
    expect(geometry.firstWidth).toBeLessThan(190);
    expect(Math.abs(geometry.firstWidth - geometry.secondWidth)).toBeLessThan(2);
    expect(Math.abs(geometry.firstRowTop - geometry.secondRowTop)).toBeLessThan(2);
    expect(geometry.thirdRowTop).toBeGreaterThan(geometry.firstRowTop + 100);
    expect(geometry.documentOverflow).toBe(false);
  });

  test('primary homepage routes expose named Rybbit events', async ({ page }) => {
    await openHome(page, { width: 1440, height: 980 });

    await expect(page.locator('.home-button[href="/start-here/"]')).toHaveAttribute('data-rybbit-event', 'home_start_click');
    await expect(page.locator('.home-era-card[data-rybbit-event="home_era_click"]')).toHaveCount(4);
    await expect(page.locator('.home-era-card--citadel')).toHaveAttribute('data-rybbit-prop-era', 'CITADEL');
    await expect(page.locator('.home-route-card[data-rybbit-event="home_route_click"]')).toHaveCount(3);

    const order = await page.locator('#home-routes').evaluate((routes) => {
      const continuum = document.querySelector('#home-continuum');
      return continuum ? Boolean(routes.compareDocumentPosition(continuum) & Node.DOCUMENT_POSITION_FOLLOWING) : false;
    });
    expect(order).toBe(true);
  });

  test('wide screens preserve the four-panel era gateway', async ({ page }) => {
    await openHome(page, { width: 1440, height: 980 });

    const gateway = page.locator('#home-era-gateway');
    await expect(page.locator('.home-era-scroll-hint')).toBeHidden();

    const geometry = await gateway.evaluate((element) => ({
      display: getComputedStyle(element).display,
      overflowX: getComputedStyle(element).overflowX,
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      visibleCards: [...element.querySelectorAll('.home-era-card')]
        .filter((card) => card.getBoundingClientRect().width > 0).length,
    }));

    expect(geometry.display).toBe('flex');
    expect(geometry.overflowX).toBe('hidden');
    expect(geometry.visibleCards).toBe(4);
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
  });
});
