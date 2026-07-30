import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('page headers render title, breadcrumbs, then calendar date', () => {
  const pageTitle = read('../src/components/CodexPageTitle.astro');

  const titleIndex = pageTitle.indexOf('<h1 id="_top"');
  const breadcrumbsIndex = pageTitle.indexOf('<nav class="codex-breadcrumbs"');
  const calendarIndex = pageTitle.indexOf('<CalendarDateBadge');

  assert.ok(titleIndex >= 0, 'page title must be present');
  assert.ok(breadcrumbsIndex > titleIndex, 'breadcrumbs must follow the title');
  assert.ok(calendarIndex > breadcrumbsIndex, 'calendar date must follow breadcrumbs');
});

test('release breadcrumbs omit the changelog plugin virtual version segment', () => {
  const pageTitle = read('../src/components/CodexPageTitle.astro');

  assert.match(pageTitle, /part !== 'version' \|\| previous !== 'releases'/);
});

test('shared page headers own the grainy image fade implementation', () => {
  const pageTitle = read('../src/components/CodexPageTitle.astro');
  const preview = read('../src/pages/header-image-fade-preview.astro');

  assert.match(pageTitle, /id="codex-header-bottom-fade"/);
  assert.match(pageTitle, /filter:\s*url\('#codex-header-bottom-fade'\)/);
  assert.match(pageTitle, /mask-image:\s*url\('#codex-header-inner-fade'\)/);
  assert.match(pageTitle, /\.codex-header-figure \+ h1/);
  assert.doesNotMatch(preview, /id="codex-header-bottom-fade"/);
});

test('per-page sidebars keep the TOC without rendering graph or backlink widgets', () => {
  const sidebar = read('../src/components/CodexPageSidebar.astro');

  assert.match(sidebar, /TableOfContents/);
  assert.doesNotMatch(sidebar, /PageBacklinks|PageGraph|hydrateSiteGraphs/);
});
