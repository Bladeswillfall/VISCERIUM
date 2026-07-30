import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const editorialCssUrl = new URL('../src/styles/article-editorial.css', import.meta.url);
const contentMediaUrl = new URL('../src/styles/content-media.css', import.meta.url);
const pageTitleUrl = new URL('../src/components/CodexPageTitle.astro', import.meta.url);

test('shared article styling uses the approved editorial hierarchy', async () => {
  const css = await readFile(editorialCssUrl, 'utf8');

  assert.match(css, /\.sl-markdown-content h2::after/);
  assert.match(css, /display: block/);
  assert.match(css, /block-size: 1px/);
  assert.match(css, /height: 1px/);
  assert.match(css, /background: linear-gradient\([\s\S]*?var\(--codex-accent-soft\)[\s\S]*?var\(--codex-border\) 25%[\s\S]*?var\(--codex-border\) 90%[\s\S]*?transparent/);
  assert.match(css, /\.sl-markdown-content p \{[\s\S]*?margin-block-start: 0/);
  assert.match(css, /:is\(h3, h4\) \+ p \{[\s\S]*?margin-block-start: 0/);
  assert.match(css, /\.sl-markdown-content h4/);
  assert.match(css, /font-style: italic/);
  assert.match(css, /content: 'Reference'/);
  assert.match(css, /aria-current='true'/);
});

test('article editorial styling is loaded through the content media layer', async () => {
  const contentMedia = await readFile(contentMediaUrl, 'utf8');
  assert.match(contentMedia, /^@import '\.\/article-editorial\.css';/m);
});

test('the grainy header fade remains part of the Codex title treatment', async () => {
  const pageTitle = await readFile(pageTitleUrl, 'utf8');

  assert.match(pageTitle, /codex-header-bottom-fade/);
  assert.match(pageTitle, /feTurbulence type="fractalNoise"/);
  assert.match(pageTitle, /codex-header-inner-fade/);
});
