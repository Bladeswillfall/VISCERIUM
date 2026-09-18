import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { attributionRouteForAsset, attributionSlugForAsset } from '../src/lib/image-attribution.mjs';

test('image attribution routes are deterministic', () => {
  assert.equal(attributionSlugForAsset('errack.webp'), 'attribution/images/errack-webp');
  assert.equal(attributionRouteForAsset('/assets/images/errack.webp'), '/attribution/images/errack-webp/');
  assert.equal(
    attributionRouteForAsset('/assets/images/degel-system/degel.webp'),
    '/attribution/images/degel-system/degel-webp/',
  );
  assert.equal(
    attributionRouteForAsset('/assets/maps/Errack-CITADEL.webp'),
    '/attribution/maps/errack-citadel-webp/',
  );
  assert.equal(
    attributionRouteForAsset('https://example.com/art/sigil.png'),
    '/attribution/external/example-com/sigil-png/',
  );
});

test('core image surfaces resolve attribution links', async () => {
  const sources = await Promise.all([
    readFile(new URL('../src/components/CodexPageTitle.astro', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/CodexPageSidebar.astro', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/era/EraPrimer.astro', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/start-here/StartHerePrimer.astro', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/degel-system/DegelSystemExplorer.astro', import.meta.url), 'utf8'),
    readFile(new URL('../src/pages/maps/index.astro', import.meta.url), 'utf8'),
  ]);
  for (const source of sources) assert.match(source, /attributionRouteForAsset/);
});
