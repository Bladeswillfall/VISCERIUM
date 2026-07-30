import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { degelSystemMap } from '../src/data/degel-system-map.mjs';

test('Degel system map uses a 4K design grid with valid unique placements', () => {
  assert.equal(degelSystemMap.width, 4096);
  assert.ok(degelSystemMap.height > degelSystemMap.width);
  assert.ok(degelSystemMap.objects.length > 0);

  const slugs = new Set();
  for (const object of degelSystemMap.objects) {
    assert.match(object.slug, /^degel-system\/[a-z0-9-]+$/);
    assert.ok(!slugs.has(object.slug), `Duplicate map slug: ${object.slug}`);
    slugs.add(object.slug);

    for (const key of ['x', 'y', 'mobileX', 'mobileY']) {
      assert.ok(Number.isFinite(object[key]), `${object.slug} has a numeric ${key}`);
      assert.ok(object[key] >= 0 && object[key] <= 100, `${object.slug} ${key} stays inside the design grid`);
    }

    assert.ok(object.size > 0, `${object.slug} has a positive desktop size`);
    assert.ok(object.mobileSize > 0, `${object.slug} has a positive mobile size`);
    assert.ok(['left', 'right'].includes(object.labelSide));
  }
});

test('Degel system explorer exposes equivalent map and list views with accessibility controls', async () => {
  const component = await readFile(new URL('../src/components/degel-system/DegelSystemExplorer.astro', import.meta.url), 'utf8');

  assert.match(component, /role="group" aria-label="Choose how to browse the Degel System"/);
  assert.match(component, /aria-controls="degel-system-map-view"/);
  assert.match(component, /aria-controls="degel-system-list-view"/);
  assert.match(component, /aria-live="polite"/);
  assert.match(component, /data-degel-view-panel="map"/);
  assert.match(component, /data-degel-view-panel="list"/);
  assert.match(component, /prefers-reduced-data: reduce/);
  assert.match(component, /viscerium-degel-system-view/);
  assert.match(component, /loading="lazy"/);
});

test('Degel orbit guides bow toward the outer system', async () => {
  const component = await readFile(new URL('../src/components/degel-system/DegelSystemExplorer.astro', import.meta.url), 'utf8');

  assert.match(component, /guide\.y \+ 4\.5/);
  assert.doesNotMatch(component, /guide\.y - 4\.5/);
});

test('Degel category page mounts the explorer and suppresses the generated table of contents', async () => {
  const pageTitle = await readFile(new URL('../src/components/CodexPageTitle.astro', import.meta.url), 'utf8');
  const twoColumn = await readFile(new URL('../src/components/CodexTwoColumnContent.astro', import.meta.url), 'utf8');

  assert.match(pageTitle, /<DegelSystemExplorer \/>/);
  assert.match(twoColumn, /codex-degel-system-page/);
  assert.match(twoColumn, /starlightRoute\.toc && !isDegelSystemIndex/);
});

test('Degel category releases the explorer from Starlight article width limits', async () => {
  const component = await readFile(new URL('../src/components/degel-system/DegelSystemExplorer.astro', import.meta.url), 'utf8');
  const layout = await readFile(new URL('../src/styles/degel-system-layout.css', import.meta.url), 'utf8');

  assert.match(component, /degel-system-layout\.css/);
  assert.match(layout, /codex-two-column-content\.codex-degel-system-page/);
  assert.match(layout, /> \.codex-main-pane > main > \.content-panel > \.sl-container/);
  assert.match(layout, /max-inline-size: none !important/);
  assert.match(layout, /inline-size: 100% !important/);
});
