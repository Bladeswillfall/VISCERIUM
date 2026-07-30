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

test('falls back to article outside recognised folders', () => {
  const file = path.resolve('/vault/Lore/Introduction/Start Here.md');
  assert.equal(inferNoteType(file, sourceDir), 'article');
});
