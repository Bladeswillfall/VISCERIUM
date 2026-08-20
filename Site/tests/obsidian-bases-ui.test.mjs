import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');
const vaultRoot = path.join(repoRoot, 'Vault');

async function readVaultText(relativePath) {
  return fs.readFile(path.join(vaultRoot, relativePath), 'utf8');
}

async function readVaultJson(relativePath) {
  return JSON.parse(await readVaultText(relativePath));
}

test('Bases styles the current Obsidian toolbar DOM and official variables', async () => {
  const css = await readVaultText('.obsidian/snippets/Bases.css');

  assert.match(css, /\.bases-toolbar/);
  assert.match(css, /\.bases-toolbar-item:not\(\.bases-toolbar-result-count\)/);
  assert.match(css, /\.bases-toolbar-views-menu > \.text-icon-button/);
  assert.match(css, /\.bases-toolbar-views-menu \.text-button-label/);
  assert.match(css, /--bases-toolbar-label-display:\s*inline/);
  assert.match(css, /--bases-cards-container-background:/);
  assert.match(css, /--bases-cards-border-width:\s*1px/);
  assert.match(css, /--bases-table-container-border-width:\s*1px/);
  assert.match(css, /--bases-table-row-height:/);
  assert.doesNotMatch(css, /--bases-cards-border\s*:/);
});

test('Bases toolbar keeps hover stationary and reserves movement for a press', async () => {
  const css = await readVaultText('.obsidian/snippets/Bases.css');
  const hoverRule = css.match(/\.bases-header :is\([\s\S]*?\.query-toolbar-item[\s\S]*?\):hover \{([\s\S]*?)\n\}/);

  assert.ok(hoverRule, 'Expected the shared current/legacy toolbar hover rule');
  assert.doesNotMatch(hoverRule[1], /transform\s*:/);
  assert.match(css, /transform:\s*translateY\(1px\)/);

  const cardHoverRule = css.match(/\.bases-cards-item:hover \{([\s\S]*?)\n\}/);
  assert.ok(cardHoverRule, 'Expected a stationary card hover rule');
  assert.doesNotMatch(cardHoverRule[1], /transform\s*:/);
});

test('Bases keeps current mobile toolbar controls reachable', async () => {
  const css = await readVaultText('.obsidian/snippets/Bases.css');

  assert.match(css, /\.is-mobile \.bases-header :is\(\.bases-toolbar, \.query-toolbar\)/);
  assert.match(css, /overflow-x:\s*auto/);
  assert.match(css, /-webkit-overflow-scrolling:\s*touch/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /text-overflow:\s*clip/);
});

test('World Anvil Import composes its triage layer with the shared Bases skin', async () => {
  const appearance = await readVaultJson('.obsidian/appearance.json');
  const triageCss = await readVaultText('.obsidian/snippets/World Anvil Import triage.css');
  const base = await readVaultText('System/Bases/World Anvil Import.base');

  assert.ok(appearance.enabledCssSnippets.includes('Bases'));
  assert.ok(appearance.enabledCssSnippets.includes('World Anvil Import triage'));

  assert.match(base, /- type:\s*cards\s*\n\s*name:\s*Review first/);
  assert.match(base, /cardSize:\s*300/);

  assert.match(triageCss, /aria-label="World Anvil Import"/);
  assert.match(triageCss, /\.bases-cards-item/);
  assert.match(triageCss, /\.wa-action--conflict/);
  assert.match(triageCss, /\.wa-action--ready/);
  assert.doesNotMatch(triageCss, /\.bases-toolbar|\.query-toolbar/);
});
