import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ERA_VALUES,
  buildContinuityFamilies,
  eraFromPath,
  normaliseEra,
  resolveContextualTarget,
  validEntityId,
} from '../src/lib/era-context.mjs';

test('era vocabulary is controlled and includes Universal without making it historical', () => {
  assert.deepEqual(ERA_VALUES, ['CITADEL', 'SMOG', 'NEARSIGHT', 'ENTROPY', 'Universal']);
  assert.equal(normaliseEra('citadel'), 'CITADEL');
  assert.equal(normaliseEra('Universal'), 'Universal');
  assert.equal(normaliseEra('future'), undefined);
  assert.equal(eraFromPath('Eras/SMOG/Fauna/Cow.md'), 'SMOG');
});

test('entity ids are stable readable kebab-case identifiers', () => {
  assert.equal(validEntityId('okse-dominion'), true);
  assert.equal(validEntityId('okse-dominion-b'), true);
  assert.equal(validEntityId('Okse Dominion'), false);
  assert.equal(validEntityId('okse_dominion'), false);
});

test('era links prefer same-era editions then Universal', () => {
  const candidates = [
    { slug: 'eras/citadel/fauna/cow', era: 'CITADEL', entity_id: 'cow' },
    { slug: 'eras/smog/fauna/cow', era: 'SMOG', entity_id: 'cow' },
    { slug: 'reference/cow', era: 'Universal', entity_id: 'cow-reference' },
  ];
  assert.equal(resolveContextualTarget(candidates, 'CITADEL')?.candidate?.slug, 'eras/citadel/fauna/cow');
  assert.equal(resolveContextualTarget(candidates.slice(1), 'CITADEL')?.candidate?.slug, 'reference/cow');
});

test('context resolution never silently crosses to another historical era', () => {
  const candidates = [
    { slug: 'eras/smog/fauna/cow', era: 'SMOG', entity_id: 'cow' },
    { slug: 'eras/nearsight/fauna/cow', era: 'NEARSIGHT', entity_id: 'cow' },
  ];
  const result = resolveContextualTarget(candidates, 'CITADEL');
  assert.equal(result?.kind, 'continuity');
  assert.equal(result?.route, '/entities/cow/');
});

test('unrelated same-title candidates remain unresolved', () => {
  const candidates = [
    { slug: 'eras/smog/factions/example-a', era: 'SMOG', entity_id: 'example-a' },
    { slug: 'eras/nearsight/factions/example-b', era: 'NEARSIGHT', entity_id: 'example-b' },
  ];
  assert.equal(resolveContextualTarget(candidates, 'CITADEL'), null);
});

test('continuity families group editions by entity id and era', () => {
  const records = [
    { relativePath: 'Eras/CITADEL/Fauna/Cow.md', data: { title: 'Cow', type: 'fauna', entity_id: 'cow', era: 'CITADEL' } },
    { relativePath: 'Eras/SMOG/Fauna/Cow.md', data: { title: 'Cow', type: 'fauna', entity_id: 'cow', era: 'SMOG' } },
    { relativePath: 'Eras/CITADEL/Fauna/Other.md', data: { title: 'Other', type: 'fauna', era: 'CITADEL' } },
  ];
  const family = buildContinuityFamilies(records).get('cow');
  assert.ok(family);
  assert.equal(family.records.length, 2);
  assert.equal(family.editions.get('CITADEL').length, 1);
  assert.equal(family.editions.get('SMOG').length, 1);
});
