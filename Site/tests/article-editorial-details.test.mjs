import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const editorial = fs.readFileSync(path.join(root, 'src/styles/article-pages.css'), 'utf8');
const eraContext = fs.readFileSync(path.join(root, 'src/styles/era-styles.css'), 'utf8');

test('article editorial details retain approved visual treatments', () => {
  assert.match(eraContext, /\.codex-universal-badge[\s\S]*?border:\s*1px solid var\(--codex-border-strong\)/);
  assert.match(eraContext, /\.codex-universal-badge[\s\S]*?border-radius:\s*0/);
  assert.match(eraContext, /:root\[data-theme='light'\] \.codex-universal-badge[\s\S]*?color:\s*var\(--codex-palette-ink\)/);
  assert.match(eraContext, /:root\[data-theme='light'\] \.codex-universal-badge[\s\S]*?background:\s*color-mix\(in oklch, var\(--codex-palette-light\) 58%, transparent\)/);
  assert.match(eraContext, /:root\[data-theme='light'\] \.codex-universal-badge[\s\S]*?border-color:\s*color-mix\(in oklch, var\(--codex-palette-deep\) 68%, transparent\)/);

  assert.match(editorial, /h2::after[\s\S]*?height:\s*1px/);
  assert.match(editorial, /h2::after[\s\S]*?background:\s*linear-gradient\([\s\S]*?var\(--codex-accent-soft\)[\s\S]*?var\(--codex-border\) 25%[\s\S]*?var\(--codex-border\) 90%[\s\S]*?transparent/);

  assert.match(editorial, /\.sl-markdown-content h3[\s\S]*?margin-block:\s*1\.9rem 0/);
  assert.match(editorial, /\.sl-markdown-content h4[\s\S]*?margin-block:\s*1\.45rem 0/);

  assert.match(editorial, /\.codex-sidebar-meta::before[\s\S]*?linear-gradient\(90deg, color-mix\(in oklch, var\(--sl-color-accent-high\) 6%, transparent\), transparent 78%\)/);
  assert.match(editorial, /#starlight__on-this-page[\s\S]*?linear-gradient\(90deg, color-mix\(in oklch, var\(--sl-color-accent-high\) 6%, transparent\), transparent 78%\)/);
});
