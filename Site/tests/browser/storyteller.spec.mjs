import { test, expect } from '@playwright/test';
import { findVaultNoteRoute } from '../helpers/vault-note.mjs';

const okseDominionPath = await findVaultNoteRoute({
  title: 'Okse Dominion',
  type: 'faction',
  era: 'CITADEL',
});
const okseDominionUrl = new URL(okseDominionPath, 'http://127.0.0.1:4321').href;

test.use({ viewport: { width: 1280, height: 900 } });

test('marked Storyteller Markdown is removed from Lore and shown through the article switcher', async ({ page }) => {
  await page.goto(okseDominionUrl, { waitUntil: 'networkidle' });

  const switcher = page.locator('[data-codex-view-root]');
  const lore = page.locator('#codex-lore-panel');
  const storyteller = page.locator('[data-codex-storyteller-panel]');
  const storytellerTab = page.getByRole('tab', { name: 'Storyteller' });

  await expect(switcher).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Lore' })).toHaveAttribute('aria-selected', 'true');
  await expect(lore).toBeVisible();
  await expect(storyteller).toBeHidden();
  await expect(lore.getByRole('heading', { name: 'Current agenda' })).toHaveCount(0);

  await storytellerTab.click();

  await expect(storytellerTab).toHaveAttribute('aria-selected', 'true');
  await expect(lore).toBeHidden();
  await expect(storyteller).toBeVisible();
  await expect(storyteller.getByRole('heading', { name: 'Storyteller View' })).toBeVisible();
  await expect(storyteller.getByRole('heading', { name: 'Current agenda' })).toBeVisible();
  await expect(storyteller).toContainText('oil and mineral extraction');
  await expect(page.locator('[data-codex-storyteller-boundary]')).toHaveCount(0);
});

test('Storyteller switcher retains accessible keyboard tab behaviour', async ({ page }) => {
  await page.goto(okseDominionUrl, { waitUntil: 'networkidle' });

  const loreTab = page.getByRole('tab', { name: 'Lore' });
  const storytellerTab = page.getByRole('tab', { name: 'Storyteller' });

  await loreTab.focus();
  await loreTab.press('ArrowRight');
  await expect(storytellerTab).toBeFocused();
  await expect(storytellerTab).toHaveAttribute('aria-selected', 'true');

  await storytellerTab.press('Home');
  await expect(loreTab).toBeFocused();
  await expect(loreTab).toHaveAttribute('aria-selected', 'true');
});
