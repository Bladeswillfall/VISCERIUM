import test from 'node:test';
import assert from 'node:assert/strict';
import { getRecentArticles } from '../src/lib/recent-articles.mjs';

const entry = (id, data = {}) => ({
  id,
  data: { title: id, status: 'published', type: 'article', description: `About ${id}`, ...data },
});

test('recent articles use published and revised dates, not creation dates', () => {
  const results = getRecentArticles([
    entry('older', { published: '2026-08-01', updated: '2026-09-12', era: 'SMOG' }),
    entry('newer', { published: '2026-09-10', eraStyle: 'e4', headerImage: '/assets/images/example.webp' }),
    entry('unpublished-date', { created: '2026-09-30' }),
  ]);
  assert.deepEqual(results.map(({ title, kind, era }) => [title, kind, era]), [
    ['older', 'Updated', 'SMOG'], ['newer', 'Published', 'ENTROPY'],
  ]);
  assert.equal(results[1].headerImage, '/assets/images/example.webp');
  assert.equal(results[0].headerImage, null);
});

test('structural pages and policies or statements typed as articles are excluded', () => {
  const results = getRecentArticles([
    entry('eras/citadel', { type: 'era', updated: '2026-09-30' }),
    entry('eras/citadel/events', { type: 'category', updated: '2026-09-30' }),
    entry('policies/content-production', { updated: '2026-09-29' }),
    entry('statements/human-authorship-and-ai', { updated: '2026-09-28' }),
    entry('disguised', { sourcePath: 'Policies/content-production.md', updated: '2026-09-30' }),
    entry('map', { type: 'map', updated: '2026-09-30' }),
    entry('draft', { status: 'draft', updated: '2026-09-30' }),
    entry('article', { updated: '2026-09-15', era: 'Universal' }),
  ]);
  assert.deepEqual(results.map(({ href, era, kind }) => [href, era, kind]), [
    ['/article/', 'Universal', 'Updated'],
  ]);
});

test('results are deterministic and capped at 36 for the homepage grid', () => {
  const results = getRecentArticles(Array.from({ length: 40 }, (_, i) => entry(
    `item-${String(40 - i).padStart(2, '0')}`,
    { published: '2026-09-01' },
  )));
  assert.equal(results.length, 36);
  assert.equal(results[0].title, 'item-01');
  assert.equal(results.at(-1).title, 'item-36');
});
