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
    './src/styles/codex-ui.css',
    './src/styles/navigation.css',
    './src/styles/header-controls.css',
    './src/styles/maps.css',
    './src/styles/relationships.css',
    './src/styles/exploration-pages.css',
    './src/styles/calendar.css',
    './src/styles/category-index.css',
    './src/styles/support.css',
    './src/styles/layout.css',
    './src/styles/a11y.css',
    './src/styles/era-styles.css',
  ];
  const positions = styles.map((stylePath) => customCss.indexOf(`'${stylePath}'`));

  assert.ok(positions.every((position) => position >= 0), 'all global styles remain explicitly registered');
  assert.deepEqual([...positions].sort((a, b) => a - b), positions, 'global style order is preserved');
  assert.doesNotMatch(customCss, /\.\/src\/styles\/(?:codex|global|bundle)\.css/);
});

test('graph integration loads after the third-party graph styles', async () => {
  const config = await read('astro.config.mjs');
  const customCss = config.match(/customCss:\s*\[([\s\S]*?)\],\n\s*components:/)?.[1] ?? '';
  const graphOrder = [
    'starlight-site-graph/styles/layers.css',
    'starlight-site-graph/styles/common.css',
    'starlight-site-graph/styles/starlight.css',
    './src/styles/graph.css',
  ];
  const positions = graphOrder.map((stylePath) => customCss.indexOf(`'${stylePath}'`));

  assert.ok(positions.every((position) => position >= 0), 'graph styles are registered');
  assert.deepEqual([...positions].sort((a, b) => a - b), positions, 'the RGB-safe graph adapter remains post-plugin');
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
