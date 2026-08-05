import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const articleLayout = readFileSync(new URL('../src/styles/article-layout.css', import.meta.url), 'utf8');
const a11yStyles = readFileSync(new URL('../src/styles/a11y.css', import.meta.url), 'utf8');
const baseLayout = readFileSync(new URL('../src/styles/layout.css', import.meta.url), 'utf8');
const typography = readFileSync(new URL('../src/styles/typography.css', import.meta.url), 'utf8');

test('article heading rhythm favours the text that follows each heading', () => {
  assert.match(a11yStyles, /@import '\.\/article-layout\.css';/);
  assert.match(typography, /h3 \{[\s\S]*margin-block: 2\.55rem \.4rem;/);
  assert.match(typography, /h4 \{[\s\S]*margin-block: 2\.05rem \.25rem;/);
  assert.match(articleLayout, /\.sl-markdown-content:not\(:has\(\.home-gateway\)\) p \{\s*margin-top: 0;/);
  assert.match(articleLayout, /:is\(h2, h3, h4, h5, h6\)[\s\S]*\+ :is\(p, ul, ol, dl, table, figure, blockquote/);
  assert.match(articleLayout, /margin-block-start: 0 !important;/);
});

test('authored grid layouts let gap own spacing between every direct cell', () => {
  assert.match(articleLayout, /\.sl-markdown-content :is\(\.cx-cols, \.cx-row\) > \* \{/);
  assert.match(articleLayout, /margin-block: 0 !important;/);
});

test('desktop article TOC is the sticky sidebar element rather than the whole sidebar', () => {
  assert.match(baseLayout, /\.right-sidebar \{[\s\S]*position: relative;/);
  assert.match(baseLayout, /\.right-sidebar-container \{[\s\S]*align-self: stretch;/);
  assert.doesNotMatch(baseLayout, /\.right-sidebar \{[\s\S]*position: sticky;/);
  assert.match(articleLayout, /\.codex-page-sidebar starlight-toc \{[\s\S]*position: sticky;/);
  assert.match(articleLayout, /top: calc\(var\(--sl-nav-height\) \+ 1rem\)/);
  assert.match(articleLayout, /max-block-size: calc\(100dvh - var\(--sl-nav-height\) - 2rem\)/);
  assert.match(articleLayout, /overflow-y: auto;/);
});
