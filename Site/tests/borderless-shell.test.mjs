import test from 'node:test';
import assert from 'node:assert/strict';
import { findVaultNote } from './helpers/vault-note.mjs';

test('the Okse Dominion source retains its developed faction-hub structure', async () => {
  const { markdown: source } = await findVaultNote({
    title: 'Okse Dominion',
    type: 'faction',
    era: 'CITADEL',
  });

  // The Okse article is intentionally prose-led rather than coupled to a fixed
  // number of authored column blocks. Protect the reader-facing faction spine
  // and hub destinations instead of an incidental layout choice.
  for (const heading of [
    'A Dominion of Several Weathers',
    'Iron Roots',
    'Hard People, Uneven Lives',
    'Black Gold',
    'Power Under Seal',
    'Behind the Shield',
    'Faces of the Dominion',
  ]) {
    assert.match(source, new RegExp(`^## ${heading}$`, 'm'), `expected Okse section: ${heading}`);
  }

  for (const destination of [
    'Valenheim',
    'Rauthrbak Min',
    'Vagrvik',
    'Aldaness',
    'Hjalliberg',
    'Strondverdir',
  ]) {
    assert.match(source, new RegExp(`\\[\\[[^\\]]*${destination}[^\\]]*\\]\\]`), `expected Okse hub link: ${destination}`);
  }
});
