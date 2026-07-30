import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterSidebarByRoutes,
  routeForDocEntry,
  universalRoutesFromDocs,
} from '../src/lib/sidebar-era-scope.mjs';

test('Universal sidebar scope follows era metadata instead of requiring a Universal folder', () => {
  const docs = [
    { id: 'degel-system/errack.md', data: { title: 'Errack', era: 'Universal' } },
    { id: 'degel-system/degel.md', data: { title: 'Degel', era: 'Universal' } },
    { id: 'eras/citadel/factions/okse-dominion.md', data: { title: 'Okse Dominion', era: 'CITADEL' } },
    { id: 'eras/smog/factions/example.md', data: { title: 'Example', era: 'SMOG' } },
  ];

  const sidebar = [
    {
      type: 'group',
      label: 'Degel System',
      entries: [
        { type: 'link', label: 'Degel', href: '/degel-system/degel/' },
        { type: 'link', label: 'Errack', href: '/degel-system/errack/' },
      ],
    },
    {
      type: 'group',
      label: 'Eras',
      entries: [
        {
          type: 'group',
          label: 'CITADEL',
          entries: [{ type: 'link', label: 'Okse Dominion', href: '/eras/citadel/factions/okse-dominion/' }],
        },
        {
          type: 'group',
          label: 'SMOG',
          entries: [{ type: 'link', label: 'Example', href: '/eras/smog/factions/example/' }],
        },
      ],
    },
  ];

  const routes = universalRoutesFromDocs(docs);
  assert.deepEqual([...routes].sort(), ['/degel-system/degel/', '/degel-system/errack/']);

  const filtered = filterSidebarByRoutes(sidebar, routes);
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].label, 'Degel System');
  assert.deepEqual(filtered[0].entries.map((entry) => entry.label), ['Degel', 'Errack']);
});

test('Universal route derivation respects explicit slugs and index pages', () => {
  assert.equal(routeForDocEntry({ id: 'reference/index.md', data: { era: 'Universal' } }), '/reference/');
  assert.equal(routeForDocEntry({ id: 'ignored.md', data: { slug: 'Custom/Path', era: 'Universal' } }), '/custom/path/');
});
