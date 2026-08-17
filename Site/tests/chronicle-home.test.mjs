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

test('Home places the bespoke Chronicle view in the secondary creator band', async () => {
  const home = await readVaultText('Home.md');
  const attentionIndex = home.indexOf('[!home-attention] Needs attention');
  const secondaryIndex = home.indexOf('[!home-secondary]');
  const chronicleIndex = home.indexOf('[!home-chronicle] Chronicle');
  const activityIndex = home.indexOf('[!home-activity] Progress');

  assert.ok(attentionIndex >= 0, 'Home should keep the intervention surface');
  assert.ok(secondaryIndex > attentionIndex, 'Secondary creator tools should follow Needs attention');
  assert.ok(chronicleIndex > secondaryIndex, 'Chronicle should live inside the secondary creator band');
  assert.ok(activityIndex > chronicleIndex, 'Progress should sit beside Chronicle');
  assert.match(home, /await dv\.view\("System\/Views\/Home\/Chronicle"\)/);

  const chronicle = await readVaultText('System/Views/Home/Chronicle/view.js');
  assert.match(chronicle, /journal-bases:open-current-daily/);
  assert.match(chronicle, /journal-bases:open-current-weekly/);
  assert.match(chronicle, /journal-bases:open-current-monthly/);
  assert.match(chronicle, /journal-bases:open-current-yearly/);
  assert.match(chronicle, /System\/Chronicle/);
});

test('compact Chronicle reuses the shared hub and links to the full workspace', async () => {
  const hub = await readVaultText('System/Views/Chronicle/Hub/view.js');
  const css = await readVaultText('System/Views/Chronicle/Hub/view.css');

  assert.match(hub, /const compact = Boolean\(input\?\.compact\)/);
  assert.match(hub, /compact \? "System\/Chronicle" : "System\/Bases\/Chronicle\.base"/);
  assert.match(hub, /compact \? "Open Chronicle →" : "Open review workspace →"/);
  assert.match(css, /\.vc-chronicle-hub\.is-compact/);
  assert.match(css, /grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/);
  assert.match(css, /@container viscerium-home/);
});

test('compact Chronicle is one tonal strip rather than repeated accent cards', async () => {
  const css = await readVaultText('System/Views/Chronicle/Hub/view.css');
  const compactPeriod = css.match(
    /\.vc-chronicle-hub\.is-compact \.vc-chronicle-period \{([\s\S]*?)\n\}/,
  )?.[1] ?? '';
  const compactGrid = css.match(
    /\.vc-chronicle-hub\.is-compact \.vc-chronicle-period-grid \{([\s\S]*?)\n\}/,
  )?.[1] ?? '';

  assert.match(compactPeriod, /border: 0;/);
  assert.match(compactPeriod, /background: transparent;/);
  assert.match(compactGrid, /background: var\(--background-secondary\);/);
  assert.doesNotMatch(compactPeriod, /border-left/);
});

test('compact Chronicle restores a touch-safe action height on narrow layouts', async () => {
  const css = await readVaultText('System/Views/Chronicle/Hub/view.css');

  assert.match(
    css,
    /@container viscerium-home \(max-width: 30rem\)[\s\S]*?\.vc-chronicle-hub\.is-compact \.vc-chronicle-period-action \{\s*min-height: 36px;/,
  );
  assert.match(
    css,
    /@media \(max-width: 620px\)[\s\S]*?\.vc-chronicle-period-action,\s*\.vc-chronicle-hub\.is-compact \.vc-chronicle-period-action \{\s*min-height: 36px;/,
  );
});
