import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

const layers = read('../src/styles/ion-layers.css');
const layout = read('../src/styles/layout.css');
const navigation = read('../src/styles/navigation.css');
const header = read('../src/styles/header-controls.css');
const rail = read('../src/components/CodexFooterRail.astro');
const articleFooter = read('../src/components/StarlightFooter.astro');
const pageFrame = read('../src/components/CodexPageFrame.astro');
const timeline = read('../src/styles/timeline-canvas.css');

test('the Codex defines explicit site-level stacking tiers', () => {
  assert.match(layers, /--codex-z-underlay:\s*-1/);
  assert.match(layers, /--codex-z-page:\s*0/);
  assert.match(layers, /--codex-z-surface:\s*1/);
  assert.match(layers, /--codex-z-elevated-surface:\s*2/);
  assert.match(layers, /--codex-z-navigation:\s*60/);
  assert.match(layers, /--codex-z-control:\s*1000/);
  assert.match(layers, /--codex-z-grain:\s*999999/);
  assert.doesNotMatch(layers, /codex-z-reveal|\.home-reveal/);
});

test('the raised page and underlay rail are siblings in the document stack', () => {
  assert.match(pageFrame, /body\s*\{[\s\S]*?isolation:\s*isolate/);
  assert.match(pageFrame, /\.page\s*\{[\s\S]*?z-index:\s*var\(--codex-z-page,\s*0\)[\s\S]*?background:\s*var\(--codex-page-bg\)/);
  assert.match(rail, /\.ion-codex-footer\s*\{[\s\S]*?z-index:\s*-1/);
  assert.match(rail, /\.ion-codex-footer\s*\{[\s\S]*?margin-top:\s*-20px/);
});

test('the two-column shell contains local application stacking', () => {
  assert.match(
    layout,
    /\.codex-two-column-content\s*\{[\s\S]*?position:\s*relative[\s\S]*?isolation:\s*isolate[\s\S]*?z-index:\s*var\(--codex-z-page\)/,
  );

  assert.match(
    layers,
    /body:not\(:has\(\.home-gateway\)\) \.codex-main-pane > main > \.content-panel\s*\{[\s\S]*?z-index:\s*var\(--codex-z-surface\)[\s\S]*?background-color:\s*var\(--codex-page-bg\)/,
  );

  assert.match(
    layers,
    /body:not\(:has\(\.home-gateway\)\) \.codex-main-pane > \.right-sidebar-container\s*\{[\s\S]*?z-index:\s*var\(--codex-z-elevated-surface\)[\s\S]*?background-color:\s*var\(--codex-page-bg\)/,
  );
});

test('article-local footer breakout hacks are gone', () => {
  assert.doesNotMatch(layers, /\.codex-page-deck::before/);
  assert.doesNotMatch(layers, /100cqw|100vw|100dvw/);
  assert.doesNotMatch(rail, /100cqw|100vw|100dvw/);
});

test('article pagination sits before reference metadata and exposes Rybbit event tags', () => {
  assert.match(articleFooter, /@astrojs\/starlight\/components\/Pagination\.astro/);
  const paginationIndex = articleFooter.indexOf('class="codex-pagination"');
  const referencesIndex = articleFooter.indexOf('<ReferencedIn />');
  assert.ok(paginationIndex >= 0);
  assert.ok(referencesIndex > paginationIndex);
  assert.match(articleFooter, /article_pagination_click/);
  assert.match(articleFooter, /rybbitPropDirection/);
  assert.match(articleFooter, /rybbitPropTarget/);
});

test('global chrome uses the shared hierarchy', () => {
  assert.match(navigation, /html\[data-codex-desktop-sidebar\] #starlight__sidebar\s*\{[\s\S]*?z-index:\s*var\(--codex-z-navigation\)\s*!important/);
  assert.match(navigation, /\.codex-sidebar-toggle\s*\{[\s\S]*?z-index:\s*var\(--codex-z-control\)/);
  assert.match(header, /header\.header\s*\{[\s\S]*?z-index:\s*var\(--codex-z-navigation\)/);
  assert.match(layers, /#scroll-to-top-button\s*\{[\s\S]*?z-index:\s*var\(--codex-z-control\)\s*!important/);
  assert.match(layers, /body::before\s*\{[\s\S]*?z-index:\s*var\(--codex-z-grain\)\s*!important/);
});

test('timeline z-indexes remain local ordering values inside the page stacking surface', () => {
  assert.match(timeline, /\.vis-background\s*\{[\s\S]*?z-index:\s*0\s*!important/);
  assert.match(timeline, /\.vis-foreground\s*\{[\s\S]*?z-index:\s*2\s*!important/);
  assert.match(timeline, /\.vc-timeline-item\s*\{[\s\S]*?z-index:\s*3\s*!important/);
});
