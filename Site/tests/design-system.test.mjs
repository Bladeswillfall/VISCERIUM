import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const tokensUrl = new URL('../src/styles/color-tokens.css', import.meta.url);
const astroConfigUrl = new URL('../astro.config.mjs', import.meta.url);

test('the design system exposes shared semantic colour and surface tokens', async () => {
  const css = await fs.readFile(tokensUrl, 'utf8');

  for (const token of [
    '--codex-page-bg',
    '--codex-text-body',
    '--codex-accent',
    '--codex-surface',
    '--codex-border',
    '--codex-danger',
    '--codex-success',
    '--codex-warning',
    '--codex-info',
  ]) {
    assert.match(css, new RegExp(`${token.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}:`));
  }
});

test('global style owners remain explicit in the Starlight entrypoint', async () => {
  const config = await fs.readFile(astroConfigUrl, 'utf8');

  const owners = [
    './src/styles/color-tokens.css',
    './src/styles/typography.css',
    './src/styles/layout.css',
    './src/styles/codex-ui.css',
    './src/styles/navigation.css',
    './src/styles/a11y.css',
    './src/styles/era-styles.css',
  ];

  let previousIndex = -1;
  for (const owner of owners) {
    const index = config.indexOf(owner);
    assert.notEqual(index, -1, `expected ${owner} to remain a declared global style owner`);
    assert.ok(index > previousIndex, `expected ${owner} to preserve design-system cascade order`);
    previousIndex = index;
  }
});
