import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { transformCodexFormatting } from '../scripts/codex-formatting.mjs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('the borderless pass preserves the tested stylesheet registration graph', () => {
  const config = read('../astro.config.mjs');
  const css = read('../src/styles/codex-ui.css');

  assert.doesNotMatch(config, /borderless-shell\.css/);
  assert.match(css, /Temporary borderless presentation pass/);
  assert.doesNotMatch(css, /body\s+:where\(\s*\*/);
});

test('structural borders are targeted without flattening article callouts, timelines or the landing page', () => {
  const css = read('../src/styles/codex-ui.css');
  const reset = css.slice(css.indexOf('Temporary borderless presentation pass'));

  assert.match(reset, /body:not\(:has\(\.home-gateway\)\) :is\(/);
  assert.match(reset, /\.content-panel/);
  assert.match(reset, /\.codex-breadcrumbs/);
  assert.match(reset, /\.sl-markdown-content h2/);
  assert.doesNotMatch(reset, /\.home-button|\.home-era-card|\.home-timeline|\.home-stats|\.home-stat|\.home-route-grid|\.home-final-cta/);
  assert.doesNotMatch(reset, /blockquote/);
  assert.doesNotMatch(reset, /starlight-aside/);
  assert.doesNotMatch(reset, /vc-timeline-item/);
  assert.doesNotMatch(reset, /vis-custom-time/);
  assert.match(css, /\.codex-warning\s*\{[\s\S]*?border:/);
  assert.match(css, /\.cx-card\s*\{[\s\S]*?border:/);
  assert.match(reset, /@media \(forced-colors: active\)/);
});

test('the Okse Dominion source uses responsive two-column authoring blocks', () => {
  const source = read('../../Vault/Lore/Eras/CITADEL/Okse Dominion.md');
  const columnBlocks = source.match(/^\[cols:1-1 gap=xl align=start\]$/gm) ?? [];

  assert.ok(columnBlocks.length >= 4, 'expected multiple editorial two-column sections');
  assert.match(source, /## History[\s\S]*\[cols:1-1 gap=xl align=start\]/);
  assert.match(source, /### Oil: The Black Gold of the Dominion[\s\S]*\[cols:1-1 gap=xl align=start\]/);

  const compiled = transformCodexFormatting(source, { jsx: true });
  assert.match(compiled, /className="[^"]*\bcx-cols\b[^"]*"/);
  assert.match(compiled, /"--cx-columns":"1fr 1fr"/);
});
