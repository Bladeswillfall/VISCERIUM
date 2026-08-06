import test from 'node:test';
import assert from 'node:assert/strict';
import { scopeHistoricalEraBranches } from '../src/lib/sidebar-era-scope.mjs';

function sampleSidebar() {
  return [
    {
      type: 'group',
      label: '[Icon:local spark] Degel System',
      entries: [{ type: 'link', label: 'Errack', href: '/degel-system/errack/' }],
    },
    {
      type: 'group',
      label: '[Icon:local event] Eras',
      entries: [
        {
          type: 'group',
          label: 'CITADEL',
          entries: [{ type: 'link', label: 'Okse Dominion', href: '/eras/citadel/okse-dominion/' }],
        },
        { type: 'link', label: 'CITADEL', href: '/eras/citadel/' },
        {
          type: 'group',
          label: 'SMOG',
          entries: [{ type: 'link', label: 'Example', href: '/eras/smog/example/' }],
        },
        { type: 'link', label: 'NEARSIGHT', href: '/eras/nearsight/' },
        { type: 'link', label: 'ENTROPY', href: '/eras/entropy/' },
      ],
    },
    {
      type: 'group',
      label: 'The Wyrd',
      entries: [{ type: 'link', label: 'Resonance', href: '/the-wyrd/resonance/' }],
    },
    { type: 'link', label: 'Meta Content', href: '/meta/' },
  ];
}

test('era mode hides only the three sibling historical era branches', () => {
  const sidebar = scopeHistoricalEraBranches(sampleSidebar(), 'CITADEL');

  assert.deepEqual(sidebar.map((entry) => entry.label), [
    '[Icon:local spark] Degel System',
    '[Icon:local event] Eras',
    'The Wyrd',
    'Meta Content',
  ]);

  const eras = sidebar.find((entry) => entry.type === 'group' && entry.label.includes('Eras'));
  const marked = eras.entries.filter((entry) => entry.sidebarEra);

  assert.deepEqual(marked.map((entry) => [entry.sidebarEra, entry.sidebarHidden]), [
    ['CITADEL', false],
    ['CITADEL', false],
    ['SMOG', true],
    ['NEARSIGHT', true],
    ['ENTROPY', true],
  ]);
  assert.equal(sidebar[0].sidebarHidden, undefined);
  assert.equal(sidebar[2].sidebarHidden, undefined);
  assert.equal(sidebar[3].sidebarHidden, undefined);
});

test('all-era mode leaves every historical era branch visible', () => {
  const sidebar = scopeHistoricalEraBranches(sampleSidebar());
  const eras = sidebar.find((entry) => entry.type === 'group' && entry.label.includes('Eras'));

  assert.equal(
    eras.entries.filter((entry) => entry.sidebarEra).every((entry) => entry.sidebarHidden === false),
    true,
  );
});
