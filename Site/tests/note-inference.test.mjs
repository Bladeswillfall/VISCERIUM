import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { inferNoteType, sourceSegments } from '../scripts/note-inference.mjs';

const sourceDir = path.resolve('/vault/Lore');

test('infers an event from a nested Events folder', () => {
  const file = path.resolve('/vault/Lore/Eras/CITADEL/Events/Unmarked Event.md');
  assert.deepEqual(sourceSegments(file, sourceDir), ['Eras', 'CITADEL', 'Events', 'Unmarked Event']);
  assert.equal(inferNoteType(file, sourceDir), 'event');
});

test('uses the nearest recognised source folder', () => {
  const file = path.resolve('/vault/Lore/Factions/Okse/Characters/Marshal.md');
  assert.equal(inferNoteType(file, sourceDir), 'character');
});

test('infers items from weapon and armour taxonomy folders', () => {
  const weapon = path.resolve('/vault/Lore/Eras/CITADEL/Weapons & Armour/Weaponry/Glaive.md');
  const armour = path.resolve('/vault/Lore/Eras/CITADEL/Armour/Plate Harness.md');

  assert.equal(inferNoteType(weapon, sourceDir), 'item');
  assert.equal(inferNoteType(armour, sourceDir), 'item');
});

test('infers species from biological taxonomy folders', () => {
  const reptile = path.resolve('/vault/Lore/Universal/Fauna/Reptile/Scalehound.md');
  const fungus = path.resolve('/vault/Lore/Universal/Fungi/Ash Bloom.md');
  const myrkild = path.resolve('/vault/Lore/Myrkildicary/Myrkild.md');

  assert.equal(inferNoteType(reptile, sourceDir), 'species');
  assert.equal(inferNoteType(fungus, sourceDir), 'species');
  assert.equal(inferNoteType(myrkild, sourceDir), 'species');
});

test('infers factions and locations from semantic subfolders', () => {
  const nation = path.resolve('/vault/Lore/Eras/CITADEL/Nations/Okse Dominion.md');
  const settlement = path.resolve('/vault/Lore/Eras/SMOG/Settlements/Blackstack.md');

  assert.equal(inferNoteType(nation, sourceDir), 'faction');
  assert.equal(inferNoteType(settlement, sourceDir), 'location');
});

test('only infers era for direct children of the Eras index folder', () => {
  const era = path.resolve('/vault/Lore/Eras/CITADEL.md');
  const ordinaryArticle = path.resolve('/vault/Lore/Eras/CITADEL/Overview.md');

  assert.equal(inferNoteType(era, sourceDir), 'era');
  assert.equal(inferNoteType(ordinaryArticle, sourceDir), 'article');
});

test('falls back to article outside recognised folders', () => {
  const file = path.resolve('/vault/Lore/Introduction/Start Here.md');
  assert.equal(inferNoteType(file, sourceDir), 'article');
});
