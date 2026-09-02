export const COMMUNITY_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const VISITOR_UUID_RE = COMMUNITY_UUID_RE;

const VISITOR_HEADER = 'X-Viscerium-Visitor';
const PAGE_HEADER = 'X-Viscerium-Page';
const WEBMENTION_API = 'https://webmention.io/api/mentions.jf2';
const WEBMENTION_PAGE_SIZE = 1000;
const WEBMENTION_CACHE_SECONDS = 300;
const encoder = new TextEncoder();

export function jsonResponse(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

export async function hashVisitor(secret, visitorId) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(visitorId));
  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function normalisePageUrl(value) {
  try {
    const url = new URL(String(value ?? ''));
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    url.hash = '';
    url.search = '';
    return url.href;
  } catch {
    return null;
  }
}

async function fetchCommunityRecord(context, communityId) {
  const registryUrl = new URL(`/community/${communityId}/`, context.request.url);
  const response = await fetch(registryUrl, {
    headers: { Accept: 'text/html' },
    redirect: 'manual',
  });
  if (!response.ok) return null;

  const html = await response.text();
  const id = html.match(/data-viscerium-community-id="([^"]+)"/)?.[1];
  const currentUrl = normalisePageUrl(
    html.match(/data-viscerium-community-url="([^"]+)"/)?.[1]?.replaceAll('&amp;', '&'),
  );
  if (id !== communityId || !currentUrl) return null;
  return { communityId, currentUrl };
}

export async function ensureCommunityPage(context, communityId) {
  const page = await context.env.DB
    .prepare(`
      SELECT current_url, updated_at
      FROM community_pages
      WHERE community_id = ?
    `)
    .bind(communityId)
    .first();

  const claimedUrl = normalisePageUrl(context.request.headers.get(PAGE_HEADER));
  if (page && (!claimedUrl || claimedUrl === page.current_url)) {
    return {
      communityId,
      currentUrl: page.current_url,
      updatedAt: Number(page.updated_at),
    };
  }

  const record = await fetchCommunityRecord(context, communityId);
  if (!record) return null;
  if (page?.current_url === record.currentUrl) {
    return {
      communityId,
      currentUrl: page.current_url,
      updatedAt: Number(page.updated_at),
    };
  }

  const now = Date.now();
  await context.env.DB.batch([
    context.env.DB
      .prepare(`
        INSERT INTO community_pages
          (community_id, current_url, created_at, updated_at)
        VALUES
          (?, ?, ?, ?)
        ON CONFLICT(community_id) DO UPDATE SET
          current_url = excluded.current_url,
          updated_at = excluded.updated_at
      `)
      .bind(communityId, record.currentUrl, now, now),
    context.env.DB
      .prepare(`
        INSERT INTO community_urls
          (community_id, url, first_seen_at, last_seen_at)
        VALUES
          (?, ?, ?, ?)
        ON CONFLICT(community_id, url) DO UPDATE SET
          last_seen_at = excluded.last_seen_at
      `)
      .bind(communityId, record.currentUrl, now, now),
  ]);

  return {
    communityId,
    currentUrl: record.currentUrl,
    updatedAt: now,
  };
}

async function nativeState(db, communityId, actorHash) {
  const result = await db
    .prepare(`
      SELECT
        (
          SELECT COUNT(*)
          FROM kudos
          WHERE community_id = ?
        ) AS native,
        EXISTS(
          SELECT 1
          FROM kudos
          WHERE community_id = ?
            AND actor_hash = ?
        ) AS liked
    `)
    .bind(communityId, communityId, actorHash)
    .first();

  return {
    native: Number(result?.native ?? 0),
    liked: Boolean(result?.liked),
  };
}

async function webmentionUrls(db, communityId) {
  const result = await db
    .prepare(`
      SELECT url
      FROM community_urls
      WHERE community_id = ?
      ORDER BY first_seen_at ASC
    `)
    .bind(communityId)
    .all();
  return (result.results ?? []).map((row) => row.url).filter(Boolean);
}

async function fetchWebmentionLikes(urls) {
  let total = 0;

  for (let page = 0; page < 10; page += 1) {
    const api = new URL(WEBMENTION_API);
    for (const target of urls) api.searchParams.append('target[]', target);
    api.searchParams.set('wm-property', 'like-of');
    api.searchParams.set('per-page', String(WEBMENTION_PAGE_SIZE));
    api.searchParams.set('page', String(page));

    const response = await fetch(api, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`Webmention.io returned ${response.status}`);

    const payload = await response.json();
    const children = Array.isArray(payload.children) ? payload.children : [];
    total += children.filter((mention) => !mention?.['wm-private']).length;
    if (children.length < WEBMENTION_PAGE_SIZE) return total;
  }

  // ponytail: 10,000 likes is the safety ceiling. Add cursor-based aggregation if a page reaches it.
  throw new Error('Webmention like count exceeded the paging safety ceiling.');
}

async function webmentionState(context, page) {
  const cacheKey = new Request(
    new URL(
      `/api/kudos/__webmention-cache/${page.communityId}?v=${page.updatedAt}`,
      context.request.url,
    ).href,
  );

  let cache;
  try {
    cache = caches.default;
    const cached = await cache.match(cacheKey);
    if (cached) return { available: true, count: Number((await cached.json()).count ?? 0) };
  } catch {
    cache = undefined;
  }

  try {
    const urls = await webmentionUrls(context.env.DB, page.communityId);
    const count = urls.length ? await fetchWebmentionLikes(urls) : 0;

    if (cache) {
      const response = Response.json(
        { count },
        { headers: { 'Cache-Control': `public, s-maxage=${WEBMENTION_CACHE_SECONDS}` } },
      );
      const cacheWrite = cache.put(cacheKey, response);
      if (typeof context.waitUntil === 'function') context.waitUntil(cacheWrite);
      else await cacheWrite;
    }

    return { available: true, count };
  } catch {
    return { available: false, count: null };
  }
}

export async function buildKudosState(context, page, actorHash) {
  const [native, webmentions] = await Promise.all([
    nativeState(context.env.DB, page.communityId, actorHash),
    webmentionState(context, page),
  ]);

  return {
    liked: native.liked,
    native: native.native,
    webmentions: webmentions.count,
    webmentionsAvailable: webmentions.available,
    total: native.native + (webmentions.count ?? 0),
  };
}

export async function onRequestGet(context) {
  const communityId = context.params.community_id;
  const visitorId = context.request.headers.get(VISITOR_HEADER);

  if (typeof communityId !== 'string' || !COMMUNITY_UUID_RE.test(communityId)) {
    return jsonResponse({ error: 'Invalid community ID' }, 400);
  }
  if (!visitorId || !VISITOR_UUID_RE.test(visitorId)) {
    return jsonResponse({ error: 'Invalid visitor ID' }, 400);
  }
  if (!context.env.KUDOS_HMAC_KEY) {
    return jsonResponse({ error: 'Kudos service unavailable' }, 503);
  }

  const page = await ensureCommunityPage(context, communityId);
  if (!page) return jsonResponse({ error: 'Unknown community ID' }, 404);

  const actorHash = await hashVisitor(context.env.KUDOS_HMAC_KEY, visitorId);
  return jsonResponse(await buildKudosState(context, page, actorHash));
}
