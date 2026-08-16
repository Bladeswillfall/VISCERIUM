import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('page headers render title, reading time, breadcrumbs, then calendar date', () => {
  const pageTitle = read('../src/components/CodexPageTitle.astro');

  const titleIndex = pageTitle.indexOf('<h1 id="_top"');
  const readingTimeIndex = pageTitle.indexOf('<ArticleReadingTime />');
  const breadcrumbsIndex = pageTitle.indexOf('<nav class="codex-breadcrumbs"');
  const calendarIndex = pageTitle.indexOf('<CalendarDateBadge');

  assert.ok(titleIndex >= 0, 'page title must be present');
  assert.ok(readingTimeIndex > titleIndex, 'reading time must follow the title');
  assert.ok(breadcrumbsIndex > readingTimeIndex, 'breadcrumbs must follow reading time');
  assert.ok(calendarIndex > breadcrumbsIndex, 'calendar date must follow breadcrumbs');
});

test('reading time stays visually quiet and uses the Codex UI face', () => {
  const readingTime = read('../src/components/ArticleReadingTime.astro');

  assert.match(readingTime, /\{readingTime\.minutes\} min read/);
  assert.match(readingTime, /font-family:\s*var\(--vc-font-ui\)/);
  assert.match(readingTime, /color:\s*var\(--sl-color-gray-4\)/);
  assert.doesNotMatch(readingTime, /<svg|CodexIcon|border:/);
});

test('release breadcrumbs omit the changelog plugin virtual version segment', () => {
  const pageTitle = read('../src/components/CodexPageTitle.astro');

  assert.match(pageTitle, /part !== 'version' \|\| previous !== 'releases'/);
});

test('shared page headers own the grainy image fade implementation', () => {
  const pageTitle = read('../src/components/CodexPageTitle.astro');
  const publishedArticle = read('../src/content/docs/degel-system/errack.mdx');

  assert.match(pageTitle, /id="codex-header-bottom-fade"/);
  assert.match(pageTitle, /filter:\s*url\('#codex-header-bottom-fade'\)/);
  assert.match(pageTitle, /mask-image:\s*url\('#codex-header-inner-fade'\)/);
  assert.match(pageTitle, /\.codex-header-figure \+ h1/);
  assert.match(publishedArticle, /^headerImage:\s*\/assets\/images\/errack-header\.webp$/m);
});

test('per-page sidebars keep the TOC without rendering graph or backlink widgets', () => {
  const sidebar = read('../src/components/CodexPageSidebar.astro');

  assert.match(sidebar, /TableOfContents/);
  assert.doesNotMatch(sidebar, /PageBacklinks|PageGraph|hydrateSiteGraphs/);
});
