import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSiteGraph } from '../src/lib/site-graph.mjs';

test('builds compact page and link graph data while keeping tags as page metadata', () => {
  const graph = buildSiteGraph([
    {
      id: 'alpha.md',
      body: '[Beta](/beta/#section)\n<a href="/beta/">Beta again</a>',
      data: { title: 'Alpha', tags: ['Lore', 'Lore'], referencedIn: [] },
    },
    {
      id: 'beta.md',
      body: '',
      data: {
        title: 'Beta',
        tags: ['Places'],
        links: ['alpha/'],
        referencedIn: [{ title: 'Alpha', href: '/alpha/', type: 'article' }],
      },
    },
    { id: 'draft.md', body: '[Alpha](/alpha/)', data: { title: 'Draft', draft: true } },
  ]);

  assert.deepEqual(graph.nodes, [
    { id: '/alpha/', title: 'Alpha', href: '/alpha/', tags: ['Lore'], era: null, kind: 'page' },
    { id: '/beta/', title: 'Beta', href: '/beta/', tags: ['Places'], era: null, kind: 'page' },
  ]);
  assert.deepEqual(graph.edges, [
    { source: '/alpha/', target: '/beta/', kind: 'link' },
    { source: '/beta/', target: '/alpha/', kind: 'link' },
  ]);
  assert.equal(graph.nodes.some(({ kind }) => kind === 'tag'), false);
  assert.equal(graph.edges.some(({ kind }) => kind === 'tag'), false);
});

test('adds era metadata and excludes generated hash-title tag indexes', () => {
  const graph = buildSiteGraph([
    {
      id: 'eras/citadel/characters/alpha.md',
      body: '[Generated tag](/eras/citadel/tags/lore/)',
      data: { title: 'Alpha' },
    },
    {
      id: 'smog-article.md',
      body: '',
      data: { title: 'Smog Article', era: 'SMOG' },
    },
    {
      id: 'universal-article.md',
      body: '',
      data: { title: 'Universal Article', era: 'Universal' },
    },
    {
      id: 'eras/citadel/tags/lore/index.md',
      body: '',
      data: { title: '#Lore — CITADEL', type: 'category', era: 'CITADEL' },
    },
  ]);

  assert.deepEqual(graph.nodes, [
    {
      id: '/eras/citadel/characters/alpha/',
      title: 'Alpha',
      href: '/eras/citadel/characters/alpha/',
      tags: [],
      era: 'citadel',
      kind: 'page',
    },
    {
      id: '/smog-article/',
      title: 'Smog Article',
      href: '/smog-article/',
      tags: [],
      era: 'smog',
      kind: 'page',
    },
    {
      id: '/universal-article/',
      title: 'Universal Article',
      href: '/universal-article/',
      tags: [],
      era: null,
      kind: 'page',
    },
  ]);
  assert.deepEqual(graph.edges, []);
  assert.equal(graph.nodes.some(({ title }) => title.startsWith('#')), false);
});

test('ignores missing targets, self-links, comments, code, and external URLs', () => {
  const graph = buildSiteGraph([{
    id: 'alpha.md',
    body: '[Self](/alpha/) [Missing](/missing/) [External](https://example.com)\n<!-- [Hidden](/beta/) -->\n`[Code](/beta/)`',
    data: { title: 'Alpha' },
  }]);
  assert.deepEqual(graph.edges, []);
});
