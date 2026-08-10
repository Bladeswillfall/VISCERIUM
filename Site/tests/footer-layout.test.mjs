import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

const articleFooter = read('../src/components/StarlightFooter.astro');
const rail = read('../src/components/CodexFooterRail.astro');
const pageFrame = read('../src/components/CodexPageFrame.astro');
const astroConfig = read('../astro.config.mjs');
const policy = read('../../Vault/Lore/Policies/CONTENT-PRODUCTION.md');
const brandMark = read('../public/assets/brand/viscerium-logo.svg');
const humanMadeMark = read('../public/assets/policies/human-made.svg');

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

test('the global footer keeps its 25/50/25 underlay while using one authored wayfinder', () => {
  assert.match(rail, /<footer class="ion-codex-footer">/);
  assert.match(rail, /<div class="footer-grid">/);
  assert.match(rail, /grid-template-columns:\s*minmax\(0,\s*1fr\) minmax\(0,\s*2fr\) minmax\(0,\s*1fr\)/);
  assert.match(rail, /<nav class="footer-wayfinder" aria-label="Codex destinations">/);
  assert.match(rail, /<a class="footer-wayfinder__primary" href="\/">Start Here<\/a>/);
  assert.match(rail, /\.footer-wayfinder__routes\s*\{[\s\S]*?display:\s*flex[\s\S]*?flex-wrap:\s*wrap/);
  assert.match(rail, /<span class="footer-signature" aria-hidden="true">VISCERIUM<\/span>/);
  assert.doesNotMatch(rail, /footer-links__heading|footer-links__group/);
  assert.doesNotMatch(rail, />Explore<|>Connect<|>Follow</);
  assert.doesNotMatch(rail, /@media[\s\S]*?\.footer-grid\s*\{[\s\S]*?grid-template-columns:\s*1fr/);
});

test('footer interactions change tone without hover lift or animated underlines', () => {
  assert.doesNotMatch(rail, /\.policy-link:hover[\s\S]*?translateY/);
  assert.doesNotMatch(rail, /\.footer-wayfinder[^}]*text-decoration:\s*underline/);
  assert.match(rail, /\.footer-wayfinder a:focus-visible,[\s\S]*?\.policy-link:focus-visible\s*\{[\s\S]*?outline:/);
});

test('the footer retains the page-level underlay geometry without breakout units', () => {
  assert.match(rail, /\.ion-codex-footer\s*\{[\s\S]*?position:\s*sticky[\s\S]*?bottom:\s*0[\s\S]*?z-index:\s*-1/);
  assert.match(rail, /\.ion-codex-footer\s*\{[\s\S]*?inline-size:\s*100%/);
  assert.match(rail, /\.ion-codex-footer\s*\{[\s\S]*?min-block-size:\s*clamp\(13rem,\s*22vw,\s*20rem\)/);
  assert.match(rail, /\.ion-codex-footer\s*\{[\s\S]*?margin-top:\s*-20px/);
  assert.match(rail, /padding:\s*var\(--ion-codex-footer-padding\)/);
  assert.doesNotMatch(rail, /100cqw|100vw|100dvw/);
  assert.doesNotMatch(rail, /margin-top:\s*calc\(/);
});

test('brand and Human Made marks use local SVG masks and the policy route', () => {
  assert.match(rail, /mask-image:\s*url\('\/assets\/brand\/viscerium-logo\.svg'\)/);
  assert.match(rail, /mask-image:\s*url\('\/assets\/policies\/human-made\.svg'\)/);
  assert.match(rail, /href="\/policies\/content-production\/"/);
  assert.match(brandMark, /viewBox="0 0 1756 969"/);
  assert.match(humanMadeMark, /viewBox="0 0 1182 532"/);
  assert.match(humanMadeMark, /id="_2-Horizontal-w--hand"/);
});

test('the content and production policy is a published Obsidian source note', () => {
  assert.match(policy, /^---[\s\S]*?title:\s*Content & Production Statement/m);
  assert.match(policy, /^status:\s*published$/m);
  assert.match(policy, /^type:\s*article$/m);
  assert.match(policy, /## Creative content/);
  assert.match(policy, /## Technical assistance/);
  assert.match(policy, /## Human Made mark/);
});

test('print and forced-colour modes disable the reveal treatment', () => {
  assert.match(rail, /@media print, \(forced-colors: active\)[\s\S]*?\.ion-codex-footer\s*\{[\s\S]*?position:\s*static/);
  assert.match(rail, /@media print, \(forced-colors: active\)[\s\S]*?\.ion-codex-footer\s*\{[\s\S]*?z-index:\s*auto/);
  assert.match(rail, /@media print, \(forced-colors: active\)[\s\S]*?\.ion-codex-footer\s*\{[\s\S]*?margin-top:\s*0/);
  assert.match(pageFrame, /@media print, \(forced-colors: active\)[\s\S]*?\.page\s*\{[\s\S]*?border-radius:\s*0[\s\S]*?box-shadow:\s*none/);
});
