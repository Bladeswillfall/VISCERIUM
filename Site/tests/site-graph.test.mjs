import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSiteGraph } from '../src/lib/site-graph.mjs';

test('builds compact page and link graph data while keeping tags as page metadata', () => {
  const graph = buildSiteGraph([
    {
      id: 'alpha.md',
      body: '[Beta](/beta/#section)\n<a href="/beta/">Beta again</a>\n[Tag](/tags/lore/)\n[Image](/images/banner/)',
      data: {
        title: 'Alpha',
        status: 'published',
        type: 'article',
        tags: ['Lore', 'Lore'],
        referencedIn: [],
      },
    },
    {
      id: 'beta.md',
      body: '',
      data: {
        title: 'Beta',
        status: 'published',
        type: 'faction',
        tags: ['Places'],
        links: ['alpha/'],
        referencedIn: [{ title: 'Alpha', href: '/alpha/', type: 'article' }],
      },
    },
    {
      id: 'tags/lore/index.md',
      body: '[Alpha](/alpha/)',
      data: {
        title: '#Lore',
        status: 'published',
        slug: 'tags/lore',
        type: 'category',
      },
    },
    {
      id: 'images/banner.md',
      body: '[Alpha](/alpha/)',
      data: {
        title: 'Banner',
        status: 'published',
        slug: 'images/banner',
        type: 'image',
      },
    },
    {
      id: 'maps/world.md',
      body: '[Alpha](/alpha/)',
      data: {
        title: 'World map',
        status: 'published',
        slug: 'maps/world',
        type: 'map',
      },
    },
    {
      id: 'unpublished.md',
      body: '[Alpha](/alpha/)',
      data: { title: 'Unpublished', status: 'draft', type: 'article' },
    },
    {
      id: 'draft.md',
      body: '[Alpha](/alpha/)',
      data: { title: 'Draft', status: 'published', type: 'article', draft: true },
    },
  ]);

  assert.deepEqual(graph.nodes, [
    { id: '/alpha/', title: 'Alpha', href: '/alpha/', tags: ['Lore'], kind: 'page' },
    { id: '/beta/', title: 'Beta', href: '/beta/', tags: ['Places'], kind: 'page' },
  ]);
  assert.deepEqual(graph.edges, [
    { source: '/alpha/', target: '/beta/', kind: 'link' },
    { source: '/beta/', target: '/alpha/', kind: 'link' },
  ]);
  assert.equal(graph.nodes.some(({ kind }) => kind === 'tag'), false);
  assert.equal(graph.edges.some(({ kind }) => kind === 'tag'), false);
});

test('ignores missing targets, self-links, comments, code, and external URLs', () => {
  const graph = buildSiteGraph([{
    id: 'alpha.md',
    body: '[Self](/alpha/) [Missing](/missing/) [External](https://example.com)\n<!-- [Hidden](/beta/) -->\n`[Code](/beta/)`',
    data: { title: 'Alpha', status: 'published', type: 'article' },
  }]);
  assert.deepEqual(graph.edges, []);
});
