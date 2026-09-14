import {
  COMMUNITY_UUID_RE,
  VISITOR_UUID_RE,
  buildKudosState,
  ensureCommunityPage,
  hashVisitor,
  jsonResponse,
} from '../[community_id].js';

const VISITOR_HEADER = 'X-Viscerium-Visitor';

async function prepareRequest(context) {
  const communityId = context.params.community_id;
  const visitorId = context.request.headers.get(VISITOR_HEADER);

  if (typeof communityId !== 'string' || !COMMUNITY_UUID_RE.test(communityId)) {
    return { response: jsonResponse({ error: 'Invalid community ID' }, 400) };
  }
  if (!visitorId || !VISITOR_UUID_RE.test(visitorId)) {
    return { response: jsonResponse({ error: 'Invalid visitor ID' }, 400) };
  }
  if (!context.env.KUDOS_HMAC_KEY) {
    return { response: jsonResponse({ error: 'Kudos service unavailable' }, 503) };
  }

  const requestOrigin = context.request.headers.get('Origin');
  const expectedOrigin = new URL(context.request.url).origin;
  if (requestOrigin !== expectedOrigin) {
    return { response: jsonResponse({ error: 'Invalid origin' }, 403) };
  }

  const page = await ensureCommunityPage(context, communityId);
  if (!page) return { response: jsonResponse({ error: 'Unknown community ID' }, 404) };

  return {
    page,
    actorHash: await hashVisitor(context.env.KUDOS_HMAC_KEY, visitorId),
  };
}

export async function onRequestPut(context) {
  const prepared = await prepareRequest(context);
  if (prepared.response) return prepared.response;

  await context.env.DB
    .prepare(`
      INSERT OR IGNORE INTO kudos
        (community_id, actor_hash, created_at)
      VALUES
        (?, ?, ?)
    `)
    .bind(prepared.page.communityId, prepared.actorHash, Date.now())
    .run();

  return jsonResponse(await buildKudosState(context, prepared.page, prepared.actorHash));
}

export async function onRequestDelete(context) {
  const prepared = await prepareRequest(context);
  if (prepared.response) return prepared.response;

  await context.env.DB
    .prepare(`
      DELETE FROM kudos
      WHERE community_id = ?
        AND actor_hash = ?
    `)
    .bind(prepared.page.communityId, prepared.actorHash)
    .run();

  return jsonResponse(await buildKudosState(context, prepared.page, prepared.actorHash));
}
