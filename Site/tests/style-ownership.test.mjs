import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('Starlight overrides belong to their specific features', () => {
  const config = read('../astro.config.mjs');
  const navigation = read('../src/styles/navigation.css');
  const cards = read('../src/styles/codex-ui.css');
  const typography = read('../src/styles/typography.css');
  const articles = read('../src/styles/article-pages.css');

  assert.equal(existsSync(new URL('../src/styles/ion-theme.css', import.meta.url)), false);
  assert.doesNotMatch(config, /ion-theme\.css/);
  assert.match(navigation, /#starlight__sidebar\s*\{[\s\S]*?--codex-nav-text/);
  assert.match(navigation, /starlight-toc a\s*\{/);
  assert.match(cards, /\.sl-markdown-content :is\(\.card, \.sl-link-card\)/);
  assert.doesNotMatch(cards, /^\s*\.card,\s*$/m);
  assert.doesNotMatch(typography, /In-article Era Spine hierarchy|\.sl-markdown-content:not\(:has\(\.home-gateway\)\) h2::before/);
  assert.match(articles, /\.sl-markdown-content h2::before\s*\{\s*content: none;/);
  assert.doesNotMatch(navigation, /a:hover,\s*a\[aria-current/);
});
