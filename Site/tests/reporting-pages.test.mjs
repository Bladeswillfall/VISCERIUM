import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const endpoint = readFileSync(new URL('../src/pages/reporting-pages.json.ts', import.meta.url), 'utf8');

test('reporting manifest uses permanent Community identity and keeps continuity metadata separate', () => {
  assert.match(endpoint, /community_id:\s*communityId/);
  assert.match(endpoint, /entity_id:\s*validEntityId\(entry\.data\.entity_id\)/);
  assert.match(endpoint, /pathname:\s*slugToRoute\(entry\.data\.slug \?\? entry\.id\)/);
  assert.match(endpoint, /resolveCommunityForPage\(entry\.data, entry\.id\)/);
});
