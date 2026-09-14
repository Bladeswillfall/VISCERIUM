import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { slugToRoute, vaultSourceSlug } from '../src/lib/codex-paths.mjs';

const endpoint = readFileSync(new URL('../src/pages/reporting-pages.json.ts', import.meta.url), 'utf8');
const redirects = readFileSync(new URL('../public/_redirects', import.meta.url), 'utf8');
const routeAliases = JSON.parse(
  readFileSync(new URL('../src/data/reporting-route-aliases.json', import.meta.url), 'utf8'),
);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

test('reporting manifest uses permanent Community identity and keeps continuity metadata separate', () => {
  assert.match(endpoint, /community_id:\s*communityId/);
  assert.match(endpoint, /entity_id:\s*validEntityId\(entry\.data\.entity_id\)/);
  assert.match(endpoint, /const pathname = slugToRoute\(entry\.data\.slug \?\? entry\.id\)/);
  assert.match(endpoint, /pathnames,/);
  assert.match(endpoint, /resolveCommunityForPage\(entry\.data, entry\.id\)/);
});

test('historical reporting routes are unique and keyed by permanent Community identity', () => {
  const claimed = new Set();
  for (const [communityId, pathnames] of Object.entries(routeAliases)) {
    assert.match(communityId, uuidPattern);
    assert.ok(Array.isArray(pathnames));
    for (const pathname of pathnames) {
      assert.match(pathname, /^\/.+\/$/);
      assert.equal(claimed.has(pathname), false, `duplicate historical reporting route: ${pathname}`);
      claimed.add(pathname);
    }
  }
});

test('the September 2026 human-authorship route rename keeps its original reporting path and redirect', () => {
  const communityId = '11e8b074-d296-478b-8d90-29b11cf24e4b';
  const previousPath = slugToRoute(
    vaultSourceSlug('Statements/Human Authorship, AI & the Tools We Use.md'),
  );
  const currentPath = '/statements/human-authorship-and-ai/';
  assert.ok(routeAliases[communityId]?.includes(previousPath));
  assert.ok(redirects.includes(`${previousPath} ${currentPath} 301`));
});
