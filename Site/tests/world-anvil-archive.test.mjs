import test from 'node:test';
import assert from 'node:assert/strict';
import { worldAnvilArchives } from '../src/data/world-anvil-archive.mjs';

test('Okse Dominion has a source-backed archive keyed by its stable community ID', () => {
  const archive = worldAnvilArchives['95761564-e482-4b06-971a-e619e32dd711'];
  assert.ok(archive);
  assert.equal(archive.sourceUrl, 'https://www.worldanvil.com/w/viscerium/a/okse-dominion-article');
  assert.equal(archive.comments.length, 3);
  assert.deepEqual(archive.comments.map(({ author }) => author), [
    'K.S. Bishoff', 'Fall', 'Dr Emily Vair-Turnbull',
  ]);
  assert.equal(archive.comments[1].replyTo, archive.comments[0].author);
});

test('external authors are summarised, not quoted as imported comments', () => {
  const entries = Object.values(worldAnvilArchives).flatMap(({ comments }) => comments);
  for (const entry of entries) {
    assert.match(entry.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(Number.isFinite(Date.parse(entry.date)));
    assert.ok(entry.author);
    assert.ok(Boolean(entry.body) !== Boolean(entry.summary));
    if (entry.author !== 'Fall') {
      assert.equal(entry.body, undefined);
      assert.ok(entry.summary);
    }
  }
});

test('Errack archive keeps the original source and reply attribution', () => {
  const archive = worldAnvilArchives['d833d093-b73c-4bf0-859e-4fbf31dda9fd'];
  assert.ok(archive);
  assert.equal(archive.sourceUrl, 'https://www.worldanvil.com/w/viscerium/a/errack-location');
  assert.equal(archive.comments.length, 2);
  assert.deepEqual(archive.comments.map(({ author }) => author), [
    'Dr Emily Vair-Turnbull', 'Fall',
  ]);
  assert.equal(archive.comments[1].replyTo, archive.comments[0].author);
});
