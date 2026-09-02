import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import matter from 'gray-matter';
import siteConfig from '../site.config.mjs';
import { vaultSourceSlug } from '../src/lib/codex-paths.mjs';
import { resolveCommunityForPage } from '../src/lib/page-kind.mjs';
import { inferNoteType } from './note-inference.mjs';
import { walk } from './lib/walk.mjs';

const sourceDir = path.resolve(process.cwd(), siteConfig.loreSourceDir);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const seen = new Map();
let added = 0;

for (const file of (await walk(sourceDir)).filter((entry) => /\.(md|mdx)$/i.test(entry)).sort()) {
  const raw = await fs.readFile(file, 'utf8');
  const data = matter(raw).data ?? {};
  if (data.status !== 'published') continue;

  const relativePath = path.relative(sourceDir, file);
  const slug = vaultSourceSlug(relativePath);
  const entry = {
    ...data,
    slug,
    type: data.type ?? inferNoteType(file, sourceDir),
  };
  if (!resolveCommunityForPage(entry, slug)) continue;

  if (data.community_id) {
    if (!uuidPattern.test(data.community_id)) {
      throw new Error(`Invalid community_id in ${relativePath}: ${data.community_id}`);
    }
    const previous = seen.get(data.community_id);
    if (previous) throw new Error(`Duplicate community_id in ${previous} and ${relativePath}`);
    seen.set(data.community_id, relativePath);
    continue;
  }

  const eol = raw.startsWith('---\r\n') ? '\r\n' : '\n';
  if (!raw.startsWith(`---${eol}`)) throw new Error(`Missing frontmatter: ${relativePath}`);
  const end = raw.indexOf(`${eol}---`, 3 + eol.length);
  if (end === -1) throw new Error(`Unclosed frontmatter: ${relativePath}`);

  const communityId = randomUUID();
  const updated = `${raw.slice(0, end)}${eol}community_id: ${communityId}${raw.slice(end)}`;
  await fs.writeFile(file, updated, 'utf8');
  seen.set(communityId, relativePath);
  added += 1;
  console.log(`Added community_id: ${relativePath}`);
}

console.log(`Added ${added} community ID(s).`);
