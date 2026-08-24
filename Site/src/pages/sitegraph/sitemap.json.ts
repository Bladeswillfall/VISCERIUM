import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { buildSiteGraph } from '../../lib/site-graph.mjs';

export const prerender = true;

export const GET: APIRoute = async () => new Response(
  JSON.stringify(buildSiteGraph(await getCollection('docs'))),
  {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  },
);
