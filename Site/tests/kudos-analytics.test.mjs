import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const kudos = readFileSync(new URL('../src/components/Kudos.astro', import.meta.url), 'utf8');

test('successful kudos writes emit distinct Rybbit events', () => {
  assert.match(kudos, /rybbit\?\.event\(method === 'PUT' \? 'kudos_add' : 'kudos_remove'/);
  assert.match(kudos, /community_id: this\.dataset\.communityId \?\? ''/);

  const successGuard = kudos.indexOf('if (!response.ok) throw new Error(`Kudos write failed');
  const applyState = kudos.indexOf('this.apply(await response.json() as KudosState);', successGuard);
  const trackEvent = kudos.indexOf('this.track(method);', successGuard);

  assert.ok(successGuard >= 0);
  assert.ok(applyState > successGuard);
  assert.ok(trackEvent > applyState);
});
