import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('Telescope is the only enabled search provider and VISCERIUM scopes it separately', () => {
  const config = read('../astro.config.mjs');
  const header = read('../src/components/CodexHeader.astro');
  const adapter = read('../src/scripts/telescope-scope.js');
  const continuity = read('../scripts/generate-continuity-pages.mjs');
  const eraTags = read('../scripts/generate-era-tag-pages.mjs');

  assert.match(config, /pagefind:\s*false/);
  assert.match(config, /starlightTelescope\(\{/);
  assert.match(header, /import '\.\.\/scripts\/telescope-scope\.js'/);
  assert.match(adapter, /telescope-scope\.json/);
  assert.match(adapter, /__visceriumAllPages/);
  assert.match(adapter, /initializeFuse/);
  assert.match(adapter, /viscerium:era-context/);
  assert.match(adapter, /data-telescope-scope-label/);

  assert.doesNotMatch(continuity, /pagefind\s*:/i);
  assert.doesNotMatch(eraTags, /pagefind\s*:/i);
  assert.match(eraTags, /searchable:\s*false/);
});

test('the installed Telescope runtime still exposes the internals used by the scoped adapter', () => {
  const element = read('../node_modules/starlight-telescope/src/libs/telescope-element.ts');
  const search = read('../node_modules/starlight-telescope/src/libs/telescope-search.ts');

  // Telescope 1.x does not expose a supported filter callback. The adapter is
  // intentionally narrow and this test should fail loudly if an upgrade moves
  // or renames the implementation details it relies on.
  assert.match(element, /private telescopeSearch:\s*TelescopeSearch/);
  assert.match(search, /private allPages:\s*TelescopePage\[\]/);
  assert.match(search, /private filteredPages:\s*TelescopePage\[\]/);
  assert.match(search, /private initializeFuse\(\):\s*void/);
  assert.match(search, /private renderSearchResults\(\):\s*void/);
  assert.match(search, /private renderRecentResults\(\):\s*void/);
});
