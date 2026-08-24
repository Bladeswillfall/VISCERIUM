import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSiteGraph } from '../src/lib/site-graph.mjs';

test('builds compact page, tag, link, and reverse-reference graph data', () => {
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

  assert.deepEqual(graph.nodes.filter(({ kind }) => kind === 'page'), [
    { id: '/alpha/', title: 'Alpha', href: '/alpha/', tags: ['Lore'], kind: 'page' },
    { id: '/beta/', title: 'Beta', href: '/beta/', tags: ['Places'], kind: 'page' },
  ]);
  assert.deepEqual(graph.nodes.filter(({ kind }) => kind === 'tag'), [
    { id: 'tag:lore', title: '#Lore', href: '/tags/lore/', kind: 'tag' },
    { id: 'tag:places', title: '#Places', href: '/tags/places/', kind: 'tag' },
  ]);
  assert.deepEqual(graph.edges.filter(({ kind }) => kind === 'link'), [
    { source: '/alpha/', target: '/beta/', kind: 'link' },
    { source: '/beta/', target: '/alpha/', kind: 'link' },
  ]);
  assert.deepEqual(graph.edges.filter(({ kind }) => kind === 'tag'), [
    { source: '/alpha/', target: 'tag:lore', kind: 'tag' },
    { source: '/beta/', target: 'tag:places', kind: 'tag' },
  ]);
});

test('ignores missing targets, self-links, comments, code, and external URLs', () => {
  const graph = buildSiteGraph([{
    id: 'alpha.md',
    body: '[Self](/alpha/) [Missing](/missing/) [External](https://example.com)\n<!-- [Hidden](/beta/) -->\n`[Code](/beta/)`',
    data: { title: 'Alpha' },
  }]);
  assert.deepEqual(graph.edges, []);
});
