import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const tokensUrl = new URL('../src/styles/color-tokens.css', import.meta.url);
const astroConfigUrl = new URL('../astro.config.mjs', import.meta.url);

function extractCssBlock(source, selectorPattern) {
  const match = selectorPattern.exec(source);
  assert.ok(match, `expected selector ${selectorPattern} to exist`);

  const openIndex = source.indexOf('{', match.index);
  assert.notEqual(openIndex, -1, 'expected selector block to open');

  let depth = 0;
  for (let index = openIndex; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] !== '}') continue;
    depth -= 1;
    if (depth === 0) return source.slice(openIndex + 1, index);
  }

  assert.fail('expected selector block to close');
}

test('the default design-system theme exposes shared semantic colour and surface tokens', async () => {
  const css = await fs.readFile(tokensUrl, 'utf8');
  const defaultTheme = extractCssBlock(
    css,
    /:root,\s*:root\[data-theme=['"]dark['"]\]\s*\{/,
  );

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
    assert.match(
      defaultTheme,
      new RegExp(`${token.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}:`),
      `expected ${token} to be declared by the default/dark theme`,
    );
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
