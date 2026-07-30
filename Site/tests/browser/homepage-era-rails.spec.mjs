import { test, expect } from '@playwright/test';

const preview = 'http://127.0.0.1:4321';

async function openHome(page, viewport) {
  await page.setViewportSize(viewport);
  await page.goto(`${preview}/`, { waitUntil: 'networkidle' });
}

test.describe('homepage era rails', () => {
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

  test('phone presents the era gateway as a snap rail with the next age visibly peeking in', async ({ page }) => {
    await openHome(page, { width: 390, height: 844 });

    const rail = page.locator('#home-era-gateway');
    await expect(rail).toBeVisible();
    await expect(page.locator('.home-era-scroll-hint')).toBeVisible();
    await expect(rail.locator('.home-era-card')).toHaveCount(4);

    const geometry = await rail.evaluate((element) => {
      const cards = [...element.querySelectorAll('.home-era-card')].map((card) => card.getBoundingClientRect());
      const style = getComputedStyle(element);
      return {
        display: style.display,
        overflowX: style.overflowX,
        snap: style.scrollSnapType,
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        viewportWidth: window.innerWidth,
        firstWidth: cards[0]?.width ?? 0,
        secondLeft: cards[1]?.left ?? Number.POSITIVE_INFINITY,
        secondRight: cards[1]?.right ?? Number.POSITIVE_INFINITY,
        documentOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      };
    });

    expect(geometry.display).toBe('grid');
    expect(geometry.overflowX).toBe('auto');
    expect(geometry.snap).toContain('mandatory');
    expect(geometry.scrollWidth).toBeGreaterThan(geometry.clientWidth + 200);
    expect(geometry.firstWidth).toBeGreaterThan(geometry.viewportWidth * 0.78);
    expect(geometry.firstWidth).toBeLessThan(geometry.viewportWidth * 0.9);
    expect(geometry.secondLeft).toBeLessThan(geometry.viewportWidth - 8);
    expect(geometry.secondRight).toBeGreaterThan(geometry.viewportWidth);
    expect(geometry.documentOverflow).toBe(false);

    await rail.evaluate((element) => element.scrollTo({ left: element.scrollWidth, behavior: 'instant' }));
    await expect.poll(() => rail.evaluate((element) => element.scrollLeft)).toBeGreaterThan(100);
    await expect(rail.locator('.home-era-card--entropy')).toBeInViewport();
  });

  test('phone chronology uses compact linked cards on the same horizontal interaction model', async ({ page }) => {
    await openHome(page, { width: 390, height: 844 });

    const viewport = page.locator('.home-timeline__viewport');
    const cards = viewport.locator('.home-tech-era');
    await expect(viewport).toBeVisible();
    await expect(cards).toHaveCount(4);
    await expect(viewport).toHaveAttribute('tabindex', '0');

    const geometry = await viewport.evaluate((element) => {
      const cardRects = [...element.querySelectorAll('.home-tech-era')].map((card) => card.getBoundingClientRect());
      const list = element.querySelector('.home-tech-timeline');
      const viewportStyle = getComputedStyle(element);
      const firstStyle = cardRects.length ? getComputedStyle(element.querySelector('.home-tech-era')) : null;
      return {
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        snap: viewportStyle.scrollSnapType,
        firstWidth: cardRects[0]?.width ?? 0,
        secondLeft: cardRects[1]?.left ?? Number.POSITIVE_INFINITY,
        viewportRight: element.getBoundingClientRect().right,
        listWidth: list?.getBoundingClientRect().width ?? 0,
        firstBorder: Number.parseFloat(firstStyle?.borderTopWidth ?? '0'),
      };
    });

    expect(geometry.scrollWidth).toBeGreaterThan(geometry.clientWidth + 200);
    expect(geometry.snap).toContain('mandatory');
    expect(geometry.firstWidth).toBeGreaterThan(280);
    expect(geometry.firstWidth).toBeLessThan(350);
    expect(geometry.secondLeft).toBeLessThan(geometry.viewportRight - 8);
    expect(geometry.listWidth).toBeGreaterThan(geometry.clientWidth);
    expect(geometry.firstBorder).toBeGreaterThan(0);
  });

  test('wide screens preserve the four-panel gateway while showing the chronology as one four-card row', async ({ page }) => {
    await openHome(page, { width: 1440, height: 980 });

    const rail = page.locator('#home-era-gateway');
    await expect(page.locator('.home-era-scroll-hint')).toBeHidden();

    const gateway = await rail.evaluate((element) => ({
      display: getComputedStyle(element).display,
      overflowX: getComputedStyle(element).overflowX,
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      visibleCards: [...element.querySelectorAll('.home-era-card')]
        .filter((card) => card.getBoundingClientRect().width > 0).length,
    }));

    expect(gateway.display).toBe('flex');
    expect(gateway.overflowX).toBe('hidden');
    expect(gateway.visibleCards).toBe(4);
    expect(gateway.scrollWidth).toBeLessThanOrEqual(gateway.clientWidth + 1);

    const timeline = await page.locator('.home-timeline__viewport').evaluate((element) => {
      const list = element.querySelector('.home-tech-timeline');
      return {
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        columns: list ? getComputedStyle(list).gridTemplateColumns.split(' ').length : 0,
      };
    });

    expect(timeline.columns).toBe(4);
    expect(timeline.scrollWidth).toBeLessThanOrEqual(timeline.clientWidth + 1);
  });
});
