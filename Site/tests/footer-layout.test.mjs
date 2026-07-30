import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

const articleFooter = read('../src/components/StarlightFooter.astro');
const rail = read('../src/components/CodexFooterRail.astro');
const pageFrame = read('../src/components/CodexPageFrame.astro');
const astroConfig = read('../astro.config.mjs');

test('normal Codex pages remove inherited main bottom padding without touching the homepage', () => {
  assert.match(
    articleFooter,
    /:global\(body:not\(:has\(\.home-gateway\)\) \.codex-main-pane > main\)\s*\{[\s\S]*?padding-block-end:\s*0/,
  );
});

test('article metadata stays in Starlight Footer while the global rail is not nested there', () => {
  assert.match(articleFooter, /<div class="codex-page-deck">/);
  assert.match(articleFooter, /<div class="codex-site-footer sl-flex">/);
  assert.match(articleFooter, /<ContributorStrip \/>/);
  assert.match(articleFooter, /<Webmentions \/>/);
  assert.match(articleFooter, /<Pagination \/>/);
  assert.doesNotMatch(articleFooter, /ion-codex-footer/);
  assert.doesNotMatch(articleFooter, /100cqw|100vw|100dvw/);
});

test('PageFrame owns one global footer rail outside Starlight page content', () => {
  assert.match(pageFrame, /import DefaultPageFrame from '@astrojs\/starlight\/components\/PageFrame\.astro'/);
  assert.match(pageFrame, /import CodexFooterRail from '\.\/CodexFooterRail\.astro'/);
  assert.match(pageFrame, /<DefaultPageFrame>[\s\S]*?<slot name="header" slot="header" \/>[\s\S]*?<slot name="sidebar" slot="sidebar" \/>[\s\S]*?<slot \/>[\s\S]*?<\/DefaultPageFrame>[\s\S]*?<CodexFooterRail \/>/);
  assert.match(astroConfig, /PageFrame:\s*'\.\/src\/components\/CodexPageFrame\.astro'/);
});

test('the whole Starlight page is the raised deck', () => {
  assert.match(pageFrame, /body\s*\{[\s\S]*?position:\s*relative[\s\S]*?isolation:\s*isolate/);
  assert.match(pageFrame, /\.page\s*\{[\s\S]*?position:\s*relative[\s\S]*?z-index:\s*var\(--codex-z-page,\s*0\)[\s\S]*?border-radius:\s*0 0 1\.25rem 1\.25rem[\s\S]*?background:\s*var\(--codex-page-bg\)[\s\S]*?box-shadow:/);
});

test('the global navigation rail uses literal underlay geometry without breakout units', () => {
  assert.match(rail, /<footer class="ion-codex-footer">/);
  assert.match(rail, /--ion-codex-footer-padding:\s*2rem clamp\(1\.5rem, 3vw, 2\.125rem\) 1\.25rem/);
  assert.match(rail, /\.ion-codex-footer\s*\{[\s\S]*?position:\s*sticky[\s\S]*?bottom:\s*0[\s\S]*?z-index:\s*-1/);
  assert.match(rail, /\.ion-codex-footer\s*\{[\s\S]*?inline-size:\s*100%/);
  assert.match(rail, /\.ion-codex-footer\s*\{[\s\S]*?min-block-size:\s*7rem/);
  assert.match(rail, /\.ion-codex-footer\s*\{[\s\S]*?margin-top:\s*-20px/);
  assert.match(rail, /padding:\s*var\(--ion-codex-footer-padding\)/);
  assert.doesNotMatch(rail, /100cqw|100vw|100dvw/);
  assert.doesNotMatch(rail, /margin-top:\s*calc\(/);
  assert.match(
    rail,
    /\.ion-codex-footer::before\s*\{[\s\S]*?inset-block-start:\s*2rem[\s\S]*?inline-size:\s*3\.375rem[\s\S]*?block-size:\s*0\.1875rem/,
  );
});

test('print and forced-colour modes disable the reveal treatment', () => {
  assert.match(rail, /@media print, \(forced-colors: active\)[\s\S]*?\.ion-codex-footer\s*\{[\s\S]*?position:\s*static/);
  assert.match(rail, /@media print, \(forced-colors: active\)[\s\S]*?\.ion-codex-footer\s*\{[\s\S]*?z-index:\s*auto/);
  assert.match(rail, /@media print, \(forced-colors: active\)[\s\S]*?\.ion-codex-footer\s*\{[\s\S]*?margin-top:\s*0/);
  assert.match(pageFrame, /@media print, \(forced-colors: active\)[\s\S]*?\.page\s*\{[\s\S]*?border-radius:\s*0[\s\S]*?box-shadow:\s*none/);
});
