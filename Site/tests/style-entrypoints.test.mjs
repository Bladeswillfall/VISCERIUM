import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const siteRoot = new URL('../', import.meta.url);

async function read(relativePath) {
  return readFile(new URL(relativePath, siteRoot), 'utf8');
}

function orderedImportPositions(source, imports) {
  return imports.map((path) => source.indexOf(`import '${path}'`));
}

test('global Starlight styles keep their tested explicit registration order', async () => {
  const config = await read('astro.config.mjs');
  const customCss = config.match(/customCss:\s*\[([\s\S]*?)\],\n\s*components:/)?.[1] ?? '';
  const styles = [
    './src/styles/ion-layers.css',
    './src/styles/color-tokens.css',
    './src/styles/ion-theme.css',
    './src/styles/ion-expressive-code.css',
    './src/styles/typography.css',
    './src/styles/content-media.css',
    './src/styles/codex-ui.css',
    './src/styles/navigation.css',
    './src/styles/header-controls.css',
    './src/styles/graph.css',
    './src/styles/timelines.css',
    './src/styles/maps.css',
    './src/styles/calendar.css',
    './src/styles/category-index.css',
    './src/styles/support.css',
    './src/styles/layout.css',
    './src/styles/a11y.css',
    './src/styles/era-styles.css',
  ];
  const positions = styles.map((path) => customCss.indexOf(`'${path}'`));

  assert.ok(positions.every((position) => position >= 0), 'all global styles remain explicitly registered');
  assert.deepEqual([...positions].sort((a, b) => a - b), positions, 'global style order is preserved');
  assert.doesNotMatch(customCss, /\.\/src\/styles\/(?:codex|global|bundle)\.css/);
});

test('homepage styles keep their tested file and inline-style boundaries without a reveal layer', async () => {
  const homepage = await read('src/pages/index.astro');
  const imports = [
    '../styles/homepage-base.css',
    '../styles/homepage-content.css',
    '../styles/homepage-responsive.css',
  ];
  const positions = orderedImportPositions(homepage, imports);

  assert.ok(positions.every((position) => position >= 0), 'all homepage styles remain directly imported');
  assert.deepEqual([...positions].sort((a, b) => a - b), positions, 'homepage style order is preserved');
  assert.match(homepage, /<style\s+is:global>/);
  assert.doesNotMatch(homepage, /homepage-reveal\.css|homepage-(?:styles|bundle)|styles\/homepage\.css/);
});

test('server-rendered timeline styles remain direct Astro imports', async () => {
  const app = await read('src/components/timeline/TimelineApp.astro');
  const imports = [
    '../../styles/chronos.css',
    '../../styles/timeline-loading.css',
    '../../styles/timeline-performance.css',
    '../../styles/timeline-pages.css',
    '../../styles/timeline-stacking.css',
    '../../styles/timeline-viewport.css',
    '../../styles/chronos-calendar-axis.css',
  ];
  const positions = orderedImportPositions(app, imports);

  assert.ok(positions.every((position) => position >= 0), 'all server timeline styles remain directly imported');
  assert.deepEqual([...positions].sort((a, b) => a - b), positions, 'server timeline style order is preserved');
  assert.doesNotMatch(app, /styles\/timeline\.css/);
});

test('hydrated timeline styles remain direct Preact imports', async () => {
  const island = await read('src/components/timeline/TimelineIsland.tsx');
  const imports = [
    '../../styles/timeline-chronicle.css',
    '../../styles/timeline-chronicle-layout.css',
    '../../styles/timeline-toolbar.css',
    '../../styles/timeline-toolbar-container.css',
    '../../styles/timeline-buttons.css',
  ];
  const positions = orderedImportPositions(island, imports);

  assert.ok(positions.every((position) => position >= 0), 'all hydrated timeline styles remain directly imported');
  assert.deepEqual([...positions].sort((a, b) => a - b), positions, 'hydrated timeline style order is preserved');
  assert.doesNotMatch(island, /styles\/timeline-island\.css/);
});
