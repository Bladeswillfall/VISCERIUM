import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('responsive header mode is set before the header markup renders', () => {
  const header = read('../src/components/CodexHeader.astro');
  const bootstrapIndex = header.indexOf('<script is:inline>');
  const headerIndex = header.indexOf('<div class="header codex-header">');

  assert.ok(bootstrapIndex >= 0 && bootstrapIndex < headerIndex);
  assert.match(header, /window\.matchMedia\('\(min-width: 800px\)'\)\.matches/);
  assert.match(header, /toggleAttribute\('data-codex-wide-header', desktop\)/);
  assert.match(header, /toggleAttribute\('data-codex-mobile-header', !desktop\)/);
});

test('reader media preparation is not duplicated during custom-element connection', () => {
  const script = read('../src/scripts/reader-settings.js');
  const directCalls = script.match(/prepareSensitiveMedia\(\);/g) ?? [];

  assert.equal(directCalls.length, 2);
  assert.match(script, /document\.addEventListener\('astro:page-load', prepareSensitiveMedia\)/);
});

test('small-screen paint work stays out of the initial homepage render', () => {
  const header = read('../src/components/CodexHeader.astro');
  const homepage = read('../src/pages/index.astro');

  assert.match(header, /@media \(max-width: 40rem\)[\s\S]*body::before,[\s\S]*display: none;/);
  assert.match(homepage, /#home-continuum,[\s\S]*content-visibility: auto;/);
  assert.match(homepage, /contain-intrinsic-block-size: auto 48rem;/);
  assert.match(homepage, /@media \(max-width: 44rem\)[\s\S]*\.home-hero__copy[\s\S]*filter: none;/);
});

test('mobile timeline text uses adaptive accents while fixed-dark hero cards stay theme independent', () => {
  const homepage = read('../src/pages/index.astro');
  const eras = {
    citadel: 'e1',
    smog: 'e2',
    nearsight: 'e3',
    entropy: 'e4',
  };

  assert.match(
    homepage,
    /\.home-era-card :is\(\.home-era-card__number, \.home-era-card__action\) \{\s*color: color-mix\(in oklch, var\(--home-era-accent\) 80%, var\(--home-text-fixed\)\);/,
  );

  for (const [name, era] of Object.entries(eras)) {
    assert.match(
      homepage,
      new RegExp(`\\.home-tech-era--${name} \\.home-tech-era__index \\{\\s*color: var\\(--era-${era}-accent\\);`),
    );
    assert.doesNotMatch(
      homepage,
      new RegExp(`\\.home-era-card--${name}[^\\n]*--era-${era}-accent`),
    );
  }
});

test('compact header controls keep a 44px minimum target in the winning owners', () => {
  const a11y = read('../src/styles/a11y.css');
  const headerControls = read('../src/styles/header-controls.css');

  assert.match(a11y, /\.reader-settings-trigger/);
  assert.match(a11y, /min-inline-size: 2\.75rem;/);
  assert.match(a11y, /min-block-size: 2\.75rem;/);
  assert.match(
    headerControls,
    /html\[data-codex-mobile-header\] \.codex-header-search button\[data-open-modal\] \{[\s\S]*min-width: 2\.75rem !important;[\s\S]*min-height: 2\.75rem !important;/,
  );
});

test('analytics cannot compete at normal fetch priority', () => {
  const config = read('../astro.config.mjs');

  assert.match(config, /fetchpriority: 'low'/);
});

test('desktop sidebar spacing waits for confirmed sidebar state', () => {
  const layout = read('../src/styles/layout.css');

  assert.match(
    layout,
    /html\[data-codex-desktop-sidebar\]:not\(\.codex-sidebar-collapsed\) \.main-frame:has\(> \.codex-two-column-content\)/,
  );
  assert.doesNotMatch(
    layout,
    /html:not\(\.codex-sidebar-collapsed\) \.main-frame:has\(> \.codex-two-column-content\)/,
  );
});
