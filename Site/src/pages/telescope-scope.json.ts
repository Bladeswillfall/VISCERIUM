import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { pageEra, validEntityId } from '../lib/era-context.mjs';
import { telescopeMetadataKey } from '../lib/telescope-scope.mjs';

export const prerender = true;

export const GET: APIRoute = async () => {
  const pages = await getCollection('docs');
  const metadata: Record<string, {
    era: string | null;
    type: string | null;
    entity_id: string | null;
    searchable: boolean;
  }> = {};

  for (const page of pages) {
    if (page.data.draft || page.id === 'index') continue;

    const key = telescopeMetadataKey(page.id);
    if (!key) continue;

    const entityId = validEntityId(page.data.entity_id) ? page.data.entity_id : null;
    metadata[key] = {
      era: pageEra(page.data, page.id) ?? null,
      type: page.data.type ?? null,
      entity_id: entityId,
      // `pagefind: false` is honoured as a migration fallback for existing notes.
      // New provider-neutral exclusions should use `searchable: false`.
      searchable: page.data.searchable !== false && page.data.pagefind !== false,
    };
  }

  return new Response(JSON.stringify(metadata), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'max-age=3600',
    },
  });
};
