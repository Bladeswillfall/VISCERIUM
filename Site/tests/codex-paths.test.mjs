import test from 'node:test';
import assert from 'node:assert/strict';
import { vaultSourceSlug } from '../src/lib/codex-paths.mjs';

test('a nation article keeps its route when moved into a self-named nation folder', () => {
  assert.equal(
    vaultSourceSlug('Eras/CITADEL/Nations/Okse Dominion/Okse Dominion.md'),
    'eras/citadel/nations/okse-dominion',
  );
  assert.equal(
    vaultSourceSlug('Eras/CITADEL/Nations/Okse Dominion.md'),
    'eras/citadel/nations/okse-dominion',
  );
});

test('nested nation content keeps meaningful path segments', () => {
  assert.equal(
    vaultSourceSlug('Eras/CITADEL/Nations/Okse Dominion/Organisations/Iron Circle.md'),
    'eras/citadel/nations/okse-dominion/organisations/iron-circle',
  );
  assert.equal(
    vaultSourceSlug('Eras/CITADEL/Nations/Okse Dominion/Regions/Halvmaneheimr/Halvmaneheimr.md'),
    'eras/citadel/nations/okse-dominion/regions/halvmaneheimr/halvmaneheimr',
  );
  assert.equal(
    vaultSourceSlug('Eras/CITADEL/Organisations/House/House.md'),
    'eras/citadel/organisations/house/house',
  );
});
