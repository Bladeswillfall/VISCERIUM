import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const siteRoot = new URL('../', import.meta.url);

async function read(relativePath) {
  return readFile(new URL(relativePath, siteRoot), 'utf8');
}

function orderedImportPositions(source, imports) {
  return imports.map((importPath) => source.indexOf(`import '${importPath}'`));
}

test('global Starlight styles keep their explicit registration order', async () => {
  const config = await read('astro.config.mjs');
  const customCss = config.match(/customCss:\s*\[([\s\S]*?)\],\n\s*components:/)?.[1] ?? '';
  const styles = [
    './src/styles/ion-layers.css',
    './src/styles/color-tokens.css',
    './src/styles/ion-theme.css',
    './src/styles/ion-expressive-code.css',
    './src/styles/typography.css',
    './src/styles/article-pages.css',
    './src/styles/layout.css',
    './src/styles/codex-ui.css',
    './src/styles/header-controls.css',
    './src/styles/navigation.css',
    './src/styles/category-index.css',
    './src/styles/a11y.css',
    './src/styles/era-styles.css',
  ];
  const positions = styles.map((stylePath) => customCss.indexOf(`'${stylePath}'`));

  assert.ok(positions.every((position) => position >= 0), 'all global styles remain explicitly registered');
  assert.deepEqual([...positions].sort((a, b) => a - b), positions, 'global style order is preserved');
  assert.doesNotMatch(customCss, /(?:maps|relationships|exploration-pages|support|calendar(?:-date-badge|-year)?|graph)\.css/);
  assert.doesNotMatch(customCss, /starlight-site-graph\/styles/);
  assert.doesNotMatch(customCss, /\.\/src\/styles\/(?:codex|global|bundle)\.css/);
});

test('route-owned feature styles load only from their stable entry points', async () => {
  const [worldMap, atlasIndex, relationshipGraph, support, contact] = await Promise.all([
    read('src/components/WorldMap.astro'),
    read('src/pages/maps/index.astro'),
    read('src/components/RelationshipGraph.astro'),
    read('src/pages/support.astro'),
    read('src/pages/contact.astro'),
  ]);

  assert.match(worldMap, /import '\.\.\/styles\/maps\.css';/);
  assert.match(worldMap, /import '\.\.\/styles\/exploration-pages\.css';/);
  assert.match(atlasIndex, /import '\.\.\/\.\.\/styles\/maps\.css';/);
  assert.match(relationshipGraph, /import '\.\.\/styles\/relationships\.css';/);
  assert.match(relationshipGraph, /import '\.\.\/styles\/exploration-pages\.css';/);
  for (const page of [support, contact]) {
    assert.match(page, /import supportStylesHref from '\.\.\/styles\/support\.css\?url&no-inline';/);
    assert.match(page, /head: \[\{ tag: 'link', attrs: \{ rel: 'stylesheet', href: supportStylesHref \} \}\]/);
  }
});

test('relationship routes retain their eyebrow treatment without map CSS', async () => {
  const relationshipStyles = await read('src/styles/relationships.css');
  const eyebrowRule = relationshipStyles.match(/\.relationship-page \.atlas__eyebrow\s*\{([\s\S]*?)\}/)?.[1] ?? '';

  assert.ok(eyebrowRule, 'relationship CSS owns the route eyebrow selector');
  assert.match(eyebrowRule, /margin:\s*0;/);
  assert.match(eyebrowRule, /color:\s*var\(--codex-accent\);/);
  assert.match(eyebrowRule, /font-family:\s*var\(--vc-font-ui\);/);
  assert.match(eyebrowRule, /font-size:\s*var\(--sl-text-xs\);/);
  assert.match(eyebrowRule, /text-transform:\s*uppercase;/);
});

test('graph route loads its package styles before the RGB-safe adapter', async () => {
  const graphPage = await read('src/pages/graph.astro');
  const graphOrder = [
    'starlight-site-graph/styles/layers.css',
    'starlight-site-graph/styles/common.css',
    'starlight-site-graph/styles/starlight.css',
    '../styles/graph.css',
  ];
  const positions = orderedImportPositions(graphPage, graphOrder);

  assert.ok(positions.every((position) => position >= 0), 'graph styles are registered');
  assert.deepEqual([...positions].sort((a, b) => a - b), positions, 'the RGB-safe graph adapter remains post-plugin');
});

test('calendar components own the smallest applicable stylesheet', async () => {
  const [badge, year] = await Promise.all([
    read('src/components/calendar/CalendarDateBadge.astro'),
    read('src/components/calendar/CalendarYear.astro'),
  ]);

  assert.match(badge, /import '\.\.\/\.\.\/styles\/calendar-date-badge\.css';/);
  assert.doesNotMatch(badge, /calendar-year\.css/);
  assert.match(year, /import '\.\.\/\.\.\/styles\/calendar-year\.css';/);
  assert.doesNotMatch(year, /calendar-date-badge\.css/);
});

test('homepage uses one directly imported stylesheet and retains its inline shell boundary', async () => {
  const homepage = await read('src/pages/index.astro');
  assert.match(homepage, /import '..\/styles\/homepage\.css';/);
  assert.match(homepage, /<style\s+is:global>/);
  assert.doesNotMatch(homepage, /homepage-(?:base|content|responsive|reveal)\.css/);
});

test('server-rendered timeline uses consolidated renderer entrypoints', async () => {
  const app = await read('src/components/timeline/TimelineApp.astro');
  const imports = [
    'vis-timeline/styles/vis-timeline-graph2d.min.css',
    '../../styles/chronos.css',
    '../../styles/timeline-canvas.css',
    '../../styles/timeline-chronicle.css',
    '../../styles/timeline-controls.css',
  ];
  const positions = orderedImportPositions(app, imports);

  assert.ok(positions.every((position) => position >= 0), 'timeline renderer styles remain directly imported');
  assert.deepEqual([...positions].sort((a, b) => a - b), positions, 'timeline renderer style order is preserved');
});
