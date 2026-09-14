import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { slugToRoute } from '../lib/codex-paths.mjs';
import { pageEra, validEntityId } from '../lib/era-context.mjs';
import { resolveCommunityForPage } from '../lib/page-kind.mjs';

export const prerender = true;

export const GET: APIRoute = async () => {
  const docs = await getCollection('docs');
  const pages = docs.flatMap((entry) => {
    const communityId = entry.data.community_id;
    if (
      entry.data.draft
      || !communityId
      || !resolveCommunityForPage(entry.data, entry.id)
    ) return [];

    return [{
      community_id: communityId,
      entity_id: validEntityId(entry.data.entity_id) ? entry.data.entity_id : null,
      pathname: slugToRoute(entry.data.slug ?? entry.id),
      title: String(entry.data.title ?? ''),
      era: pageEra(entry.data, entry.id) ?? null,
      content_type: String(entry.data.type ?? 'article'),
    }];
  }).sort((a, b) => a.pathname.localeCompare(b.pathname));

  return new Response(JSON.stringify({ pages }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
