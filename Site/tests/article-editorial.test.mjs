import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const articleCssUrl = new URL('../src/styles/article-pages.css', import.meta.url);
const pageTitleUrl = new URL('../src/components/CodexPageTitle.astro', import.meta.url);

test('shared article styling uses the approved editorial hierarchy', async () => {
  const css = await readFile(articleCssUrl, 'utf8');

  assert.match(css, /\.sl-markdown-content h2::after/);
  assert.match(css, /display: block/);
  assert.match(css, /block-size: 1px/);
  assert.match(css, /height: 1px/);
  assert.match(css, /background: linear-gradient\([\s\S]*?var\(--codex-accent-soft\)[\s\S]*?var\(--codex-border\) 25%[\s\S]*?var\(--codex-border\) 90%[\s\S]*?transparent/);
  assert.match(css, /\.sl-markdown-content p \{[\s\S]*?margin-block-start: 0/);
  assert.match(css, /:is\(h3, h4\) \+ p \{[\s\S]*?margin-block-start: 0/);
  assert.match(css, /\.sl-markdown-content h4/);
  assert.match(css, /font-style: italic/);
  assert.match(css, /content: attr\(data-reference-label\)/);
  assert.match(css, /aria-current='true'/);
});

test('article editorial and media rules share one owned entrypoint', async () => {
  const css = await readFile(articleCssUrl, 'utf8');

  assert.match(css, /Long-form article presentation/);
  assert.match(css, /Origin: article-editorial\.css/);
  assert.match(css, /Origin: content-media\.css/);
  assert.doesNotMatch(css, /^\s*@import\s/m);
});

test('the grainy header fade remains part of the Codex title treatment', async () => {
  const pageTitle = await readFile(pageTitleUrl, 'utf8');

  assert.match(pageTitle, /codex-header-bottom-fade/);
  assert.match(pageTitle, /feTurbulence type="fractalNoise"/);
  assert.match(pageTitle, /codex-header-inner-fade/);
});
