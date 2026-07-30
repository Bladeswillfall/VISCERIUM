import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('graph canvas colours are explicit, theme-aware and parser-safe', () => {
  const themeStyles = read('../src/styles/graph.css');
  const canvasStyles = read('../src/styles/graph-canvas.css');

  assert.match(themeStyles, /:root,\s*:root\[data-theme='dark'\]\s*\{/);
  assert.match(themeStyles, /:root\[data-theme='light'\]\s*\{/);
  assert.match(canvasStyles, /\.slsg-graph-component,\s*graph-component\s*\{/);
  assert.match(canvasStyles, /--slsg-node-color:\s*rgb\(var\(--vc-graph-node-rgb\)\)/);
  assert.match(canvasStyles, /--slsg-link-color:\s*rgb\(var\(--vc-graph-link-rgb\)\)/);
  assert.match(canvasStyles, /--slsg-label-color:\s*rgb\(var\(--vc-graph-text-rgb\)\)/);
  assert.match(canvasStyles, /--slsg-label-color-muted:\s*rgb\(var\(--vc-graph-text-muted-rgb\)\)/);
  assert.match(canvasStyles, /--slsg-node-color-current:\s*rgb\(var\(--vc-graph-current-rgb\)\)/);
  assert.match(canvasStyles, /--slsg-node-color-tag:\s*rgb\(var\(--vc-graph-tag-rgb\)\)/);
  assert.doesNotMatch(canvasStyles, /--slsg-(?:node|link|label)[^:]*:\s*(?:oklch|oklab|color-mix)\(/);
  assert.match(themeStyles, /Keep these rules unlayered/);
});

test('site graph uses tags, native interactions and a late canvas adapter', () => {
  const astroConfig = read('../astro.config.mjs');

  assert.match(astroConfig, /siteGraph\(\{[\s\S]*overridePageSidebar:\s*false/);
  assert.match(astroConfig, /graphConfig:\s*\{[\s\S]*tagRenderMode:\s*'node'/);
  assert.match(astroConfig, /renderArrows:\s*false/);
  assert.match(astroConfig, /enableDrag:\s*true/);
  assert.match(astroConfig, /enableZoom:\s*true/);
  assert.match(astroConfig, /enablePan:\s*true/);
  assert.match(astroConfig, /nodeCurrentStyle:\s*\{[\s\S]*shapeColor:\s*'nodeColorCurrent'/);
  assert.match(astroConfig, /tagDefaultStyle:\s*\{[\s\S]*shapeColor:\s*'nodeColorTag'/);
  assert.match(
    astroConfig,
    /starlight-site-graph\/styles\/starlight\.css',[\s\S]*\.\/src\/styles\/graph-canvas\.css'/,
  );
});

test('the dedicated graph page hydrates its production sitemap', () => {
  const graphPage = read('../src/pages/graph.astro');

  assert.match(graphPage, /PageGraph slug="start-here"/);
  assert.match(graphPage, /hydrateWorldGraph/);
  assert.match(graphPage, /sitegraph\/sitemap\.json/);
});
