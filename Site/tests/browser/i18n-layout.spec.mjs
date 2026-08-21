import { test, expect } from '@playwright/test';
import { findVaultNoteRoute } from '../helpers/vault-note.mjs';

const okseDominionPath = await findVaultNoteRoute({
  title: 'Okse Dominion',
  type: 'faction',
  era: 'CITADEL',
});

async function openTimeline(page) {
  await page.goto('http://127.0.0.1:4321/timelines/', { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: 'The VISCERIUM Timeline', exact: true }).first().click();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('[data-vc-island-mounted="true"]')).toHaveCount(1, { timeout: 5_000 });
}

test('long translated timeline controls remain usable in RTL', async ({ page }) => {
  await page.setViewportSize({ width: 720, height: 980 });
  await openTimeline(page);

  await page.evaluate(() => {
    document.documentElement.dir = 'rtl';
    const timeline = document.querySelector('[data-vc-timeline-island]');
    if (timeline instanceof HTMLElement) timeline.dir = 'rtl';
    const values = {
      '.vc-timeline-field-label': [
        'Kalendersystem für historische Aufzeichnungen',
        'Ereignisse in der gesamten Chronik durchsuchen',
        'Zeilen nach geschichtlichem Zusammenhang anordnen',
      ],
      '.vc-timeline-field-hint': [
        'Datumsdarstellung auswählen',
        'Veröffentlichte Einträge filtern',
        'Zusammengehörige Aufzeichnungen gruppieren',
      ],
      '.vc-timeline-action-heading': [
        'Darstellungsmodus',
        'Zwischen Treffern navigieren',
        'Zeitraum und Maßstab',
      ],
      '.vc-timeline-command-label': [
        'Chronikansicht öffnen',
        'Vorheriger passender Eintrag',
        'Nächster passender Eintrag',
        'Größeren Zeitraum anzeigen',
        'Kleineren Zeitraum anzeigen',
        'Standardzeitraum wiederherstellen',
      ],
    };

    for (const [selector, labels] of Object.entries(values)) {
      document.querySelectorAll(selector).forEach((element, index) => {
        element.textContent = labels[index] ?? labels.at(-1);
      });
    }
  });

  const toolbar = page.locator('.vc-timeline-toolbar[data-vc-toolbar-enhanced="true"]');
  const geometry = await toolbar.evaluate((element) => {
    const toolbarBox = element.getBoundingClientRect();
    const controls = [...element.querySelectorAll('input, select, button')]
      .filter((control) => control.getClientRects().length > 0)
      .map((control) => control.getBoundingClientRect());
    let overlaps = 0;
    for (let index = 0; index < controls.length; index += 1) {
      for (let other = index + 1; other < controls.length; other += 1) {
        const first = controls[index];
        const second = controls[other];
        const overlapX = Math.min(first.right, second.right) - Math.max(first.left, second.left) > 1;
        const overlapY = Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top) > 1;
        if (overlapX && overlapY) overlaps += 1;
      }
    }
    return {
      direction: getComputedStyle(element).direction,
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      contained: controls.every((control) => (
        control.left >= toolbarBox.left - 1
        && control.right <= toolbarBox.right + 1
        && control.top >= toolbarBox.top - 1
        && control.bottom <= toolbarBox.bottom + 1
      )),
      overlaps,
    };
  });

  expect(geometry.direction).toBe('rtl');
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
  expect(geometry.contained).toBe(true);
  expect(geometry.overlaps).toBe(0);

  const viewToggle = page.locator('[data-vc-list]');
  await viewToggle.click();
  await expect(page.locator('.vc-timeline-list')).toBeVisible();
  await viewToggle.click();
  await expect(page.locator('.vc-timeline-stage')).toBeVisible();
  await page.locator('[data-vc-reset]').click();
});

test('RTL tab arrows follow visual direction', async ({ page }) => {
  await page.setViewportSize({ width: 720, height: 900 });
  await page.goto(new URL(okseDominionPath, 'http://127.0.0.1:4321').href, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    document.documentElement.dir = 'rtl';
    const root = document.querySelector('[data-codex-view-root]');
    if (root instanceof HTMLElement) root.dir = 'rtl';
    document.querySelector('[data-codex-view-tab="lore"]')?.setAttribute('aria-label', 'المقالة الأساسية الكاملة');
    document.querySelector('[data-codex-view-tab="storyteller"]')?.setAttribute('aria-label', 'ملاحظات الراوي التفصيلية');
  });

  const lore = page.locator('[data-codex-view-tab="lore"]');
  const storyteller = page.locator('[data-codex-view-tab="storyteller"]');
  await expect(page.locator('[data-codex-view-root]')).toHaveCSS('direction', 'rtl');
  await lore.focus();
  await lore.press('ArrowLeft');
  await expect(storyteller).toBeFocused();
  await expect(storyteller).toHaveAttribute('aria-selected', 'true');
  await storyteller.press('ArrowRight');
  await expect(lore).toBeFocused();
  await expect(lore).toHaveAttribute('aria-selected', 'true');
});

test('long mobile Atlas labels stay inside the RTL map surface', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:4321/maps/errack-citadel/', { waitUntil: 'networkidle' });
  const atlas = page.locator('[data-atlas]');
  await expect(atlas).toHaveAttribute('data-atlas-ready', 'true');

  await page.evaluate(() => {
    document.documentElement.dir = 'rtl';
    const root = document.querySelector('[data-atlas]');
    if (root instanceof HTMLElement) {
      root.dir = 'rtl';
      root.dataset.focusEnterText = 'عرض الخريطة بملء الشاشة';
      root.dataset.focusExitText = 'العودة إلى صفحة الأطلس';
      root.dataset.focusEnterLabel = 'فتح وضع استكشاف الخريطة بملء الشاشة';
      root.dataset.focusExitLabel = 'إغلاق وضع استكشاف الخريطة بملء الشاشة';
    }
    const labels = [
      'البحث في جميع مواضع الخريطة',
      'إعادة الخريطة إلى العرض الافتراضي',
      'عرض الخريطة بملء الشاشة',
    ];
    document.querySelectorAll('.atlas__surface-controls .exploration-control').forEach((button, index) => {
      const label = button.querySelector('span:last-child');
      if (label) label.textContent = labels[index];
    });
  });

  const surface = atlas.locator('.atlas__surface-controls');
  const geometry = await surface.evaluate((element) => {
    const frame = element.closest('.atlas__frame')?.getBoundingClientRect();
    const surfaceBox = element.getBoundingClientRect();
    const buttons = [...element.querySelectorAll('button')].map((button) => button.getBoundingClientRect());
    return {
      direction: getComputedStyle(element).direction,
      contained: Boolean(frame
        && surfaceBox.left >= frame.left - 1
        && surfaceBox.right <= frame.right + 1),
      buttonsContained: buttons.every((button) => (
        button.left >= surfaceBox.left - 1 && button.right <= surfaceBox.right + 1
      )),
    };
  });

  expect(geometry.direction).toBe('rtl');
  expect(geometry.contained).toBe(true);
  expect(geometry.buttonsContained).toBe(true);

  await surface.locator('[popovertarget]').click();
  await expect(atlas.locator('.atlas__mobile-search')).toBeVisible();
  await atlas.locator('.exploration-popover__close').click();
  const focus = surface.locator('[data-exploration-focus-toggle]');
  await focus.click();
  await expect(page.locator('html')).toHaveAttribute('data-exploration-focus', '');
  await focus.click();
  await expect(page.locator('html')).not.toHaveAttribute('data-exploration-focus', '');
});
