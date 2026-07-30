import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const packageJson = new URL('../package.json', import.meta.url);
const astroConfig = new URL('../astro.config.mjs', import.meta.url);
const installedSwipePlugin = new URL('../node_modules/starlight-sidebar-swipe/package.json', import.meta.url);

test('mobile sidebar swipe plugin is fully removed', () => {
  const manifest = JSON.parse(readFileSync(packageJson, 'utf8'));
  const config = readFileSync(astroConfig, 'utf8');

  assert.equal(manifest.dependencies?.['starlight-sidebar-swipe'], undefined);
  assert.doesNotMatch(config, /starlight-sidebar-swipe|starlightSidebarSwipe/);
  assert.equal(existsSync(installedSwipePlugin), false);
});
