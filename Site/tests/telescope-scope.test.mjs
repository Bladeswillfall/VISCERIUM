import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterTelescopePages,
  normaliseTelescopePath,
  telescopeMetadataKey,
  telescopeScopeLabel,
} from '../src/lib/telescope-scope.mjs';

const pages = [
  { title: 'Citadel Cow', path: 'eras/citadel/fauna/cow' },
  { title: 'Smog Cow', path: 'eras/smog/fauna/cow' },
  { title: 'Universal Guide', path: 'universal/guides/field-signs' },
  { title: 'Cow', path: 'entities/cow' },
  { title: 'Global Atlas', path: 'maps' },
  { title: 'Generated Citadel Tag', path: 'eras/citadel/tags/fauna' },
  { title: 'Standalone Citadel Thing', path: 'eras/citadel/items/standalone' },
];

const metadata = {
  'eras/citadel/fauna/cow': { era: 'CITADEL', type: 'fauna', entity_id: 'cow', searchable: true },
  'eras/smog/fauna/cow': { era: 'SMOG', type: 'fauna', entity_id: 'cow', searchable: true },
  'universal/guides/field-signs': { era: 'Universal', type: 'article', entity_id: null, searchable: true },
  'entities/cow': { era: null, type: 'continuity', entity_id: 'cow', searchable: true },
  maps: { era: null, type: 'article', entity_id: null, searchable: true },
  'eras/citadel/tags/fauna': { era: 'CITADEL', type: 'category', entity_id: null, searchable: false },
  'eras/citadel/items/standalone': { era: 'CITADEL', type: 'item', entity_id: 'standalone', searchable: true },
};

test('Telescope path helpers normalise catalogue keys consistently', () => {
  assert.equal(normaliseTelescopePath(' /Eras\\Citadel/Cow.md '), 'Eras/Citadel/Cow');
  assert.equal(telescopeMetadataKey('/Eras/Citadel/Cow.md'), 'eras/citadel/cow');
});

test('historical Telescope scope contains only the active era plus Universal pages', () => {
  const result = filterTelescopePages(pages, metadata, 'CITADEL');
  assert.deepEqual(result.map((page) => page.path), [
    'eras/citadel/fauna/cow',
    'universal/guides/field-signs',
    'eras/citadel/items/standalone',
  ]);
  assert.equal(telescopeScopeLabel('CITADEL'), 'CITADEL + Universal');
});

test('all-era Telescope scope collapses continuity editions to their hub', () => {
  const result = filterTelescopePages(pages, metadata, null);
  assert.deepEqual(result.map((page) => page.path), [
    'universal/guides/field-signs',
    'entities/cow',
    'maps',
    'eras/citadel/items/standalone',
  ]);
  assert.equal(telescopeScopeLabel(null), 'All eras');
});
