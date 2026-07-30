import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import matter from 'gray-matter';
import { buildStorytellerProjection } from '../src/lib/storyteller.mjs';
import { walk } from './lib/walk.mjs';

const docsDir = path.resolve(process.cwd(), 'src/content/docs');

function replaceFrontmatterField(raw, key, value) {
  if (!raw.startsWith('---\n')) return raw;
  const closingIndex = raw.indexOf('\n---', 4);
  if (closingIndex === -1) return raw;

  const frontmatter = raw.slice(4, closingIndex).split(/\r?\n/);
  const filtered = frontmatter.filter((line) => !line.startsWith(`${key}:`));
  if (value !== undefined) filtered.push(`${key}: ${JSON.stringify(value)}`);

  return `---\n${filtered.join('\n')}\n---${raw.slice(closingIndex + 4)}`;
}

export async function generateStorytellerData({ root = docsDir } = {}) {
  const files = (await walk(root)).filter((file) => /\.(md|mdx)$/i.test(file));
  let projected = 0;

  for (const file of files) {
    const raw = await fs.readFile(file, 'utf8');
    const parsed = matter(raw);
    const storyteller = buildStorytellerProjection(parsed.data);
    const next = replaceFrontmatterField(raw, 'storyteller', storyteller);
    if (next === raw) continue;
    await fs.writeFile(file, next, 'utf8');
    if (storyteller) projected += 1;
  }

  console.log(`Projected Storyteller data for ${projected} public document${projected === 1 ? '' : 's'}.`);
  return projected;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  generateStorytellerData().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
