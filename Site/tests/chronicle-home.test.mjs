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

test('Home surfaces the compact Chronicle controls directly below Focus', async () => {
  const home = await readVaultText('Home.md');
  const focusIndex = home.indexOf('[!home-focus] FOCUS');
  const chronicleIndex = home.indexOf('[!home-navigate] CHRONICLE');
  const workspaceIndex = home.indexOf('[!home-workspace]');

  assert.ok(focusIndex >= 0, 'Home should keep the Focus section');
  assert.ok(chronicleIndex > focusIndex, 'Chronicle should follow Focus');
  assert.ok(workspaceIndex > chronicleIndex, 'Chronicle should precede the main workspace');
  assert.match(home, /await dv\.view\("System\/Views\/Chronicle\/Hub", \{ compact: true \}\)/);
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
