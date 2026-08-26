import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const prerender = true;

export const GET: APIRoute = async () => {
  const pages = (await getCollection('docs'))
    .filter((page) => !page.data.draft && page.id !== 'index')
    .map((page) => ({
      title: page.data.title,
      path: page.id,
      description: page.data.description || '',
      tags: page.data.tags || [],
    }));

  return new Response(JSON.stringify(pages), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
