import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COMMUNITY_UUID_RE,
  VISITOR_UUID_RE,
  fetchCommunityRecord,
  hashVisitor,
} from '../functions/api/kudos/[community_id].js';

test('kudos identifiers accept UUIDv4 values only', () => {
  const valid = '11111111-1111-4111-8111-111111111111';
  assert.equal(COMMUNITY_UUID_RE.test(valid), true);
  assert.equal(VISITOR_UUID_RE.test(valid), true);
  assert.equal(COMMUNITY_UUID_RE.test('11111111-1111-3111-8111-111111111111'), false);
  assert.equal(COMMUNITY_UUID_RE.test('not-a-uuid'), false);
});

test('visitor HMACs are stable and do not expose the visitor UUID', async () => {
  const visitor = '11111111-1111-4111-8111-111111111111';
  const first = await hashVisitor('fixture-secret', visitor);
  const second = await hashVisitor('fixture-secret', visitor);
  const different = await hashVisitor('different-secret', visitor);

  assert.equal(first, second);
  assert.notEqual(first, different);
  assert.equal(first.includes(visitor), false);
  assert.match(first, /^[0-9a-f]{64}$/);
});

test('community records are read through the Pages assets binding', async () => {
  const communityId = '11111111-1111-4111-8111-111111111111';
  let requestedPath;
  const context = {
    request: new Request(`https://preview.example/api/kudos/${communityId}`),
    env: {
      ASSETS: {
        async fetch(input) {
          requestedPath = new URL(input).pathname;
          return new Response(
            `<main data-viscerium-community-id="${communityId}" data-viscerium-community-url="https://www.viscerium.co.uk/degel-system/degel/"></main>`,
          );
        },
      },
    },
  };

  const record = await fetchCommunityRecord(context, communityId);
  assert.equal(requestedPath, `/community/${communityId}/`);
  assert.deepEqual(record, {
    communityId,
    currentUrl: 'https://www.viscerium.co.uk/degel-system/degel/',
  });
});
