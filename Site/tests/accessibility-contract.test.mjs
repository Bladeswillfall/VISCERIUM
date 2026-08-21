import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const a11yCssUrl = new URL('../src/styles/a11y.css', import.meta.url);
const contractUrl = new URL('../ACCESSIBILITY.md', import.meta.url);

test('the public Codex declares WCAG 2.2 AA as its accessibility target', async () => {
  const contract = await fs.readFile(contractUrl, 'utf8');

  assert.match(contract, /WCAG 2\.2 Level AA/);
  assert.match(contract, /keyboard operable/i);
  assert.match(contract, /prefers-reduced-motion/);
  assert.match(contract, /forced-colours/i);
});

test('the global accessibility layer preserves focus, target size and user display preferences', async () => {
  const css = await fs.readFile(a11yCssUrl, 'utf8');

  assert.match(
    css,
    /:where\(a\[href\], button, summary, input, select, textarea, \[tabindex\]:not\(\[tabindex='-1'\]\)\):focus-visible\s*\{\s*outline:\s*2px solid var\(--sl-color-accent-high\);\s*outline-offset:\s*3px;\s*\}/s,
  );
  assert.match(css, /min-inline-size:\s*2\.75rem/);
  assert.match(css, /min-block-size:\s*2\.75rem/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /@media \(forced-colors: active\)/);
  assert.match(css, /outline:\s*3px solid Highlight/);
});
