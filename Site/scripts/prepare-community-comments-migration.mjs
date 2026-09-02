import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import matter from 'gray-matter';
import siteConfig from '../site.config.mjs';
import { slugToRoute, vaultSourceSlug } from '../src/lib/codex-paths.mjs';
import { resolveCommunityForPage } from '../src/lib/page-kind.mjs';
import { inferNoteType } from './note-inference.mjs';
import { walk } from './lib/walk.mjs';

const siteRoot = process.cwd();
const repoRoot = path.resolve(siteRoot, '..');
const sourceDir = path.resolve(siteRoot, siteConfig.loreSourceDir);
const commentsFile = path.join(siteRoot, 'src/components/Comments.astro');
const rulesFile = path.join(siteRoot, 'remark42-community-remap.txt');
const schemaFile = path.join(repoRoot, 'Vault/System/Frontmatter Schema.md');

const comments = await fs.readFile(commentsFile, 'utf8');
let updatedComments = comments.replace(
  'const comments = entry.data.giscus ?? true;',
  'const comments = siteConfig.comments.enabled;',
);
updatedComments = updatedComments.replace(
  'const threadUrl = new URL(Astro.url.pathname, siteConfig.site).href;',
  "const communityId = entry.data.community_id;\nconst threadUrl = communityId\n  ? new URL(`/community/${communityId}/`, siteConfig.site).href\n  : new URL(Astro.url.pathname, siteConfig.site).href;",
);
if (updatedComments === comments) throw new Error('Comments.astro migration markers were not found.');
await fs.writeFile(commentsFile, updatedComments, 'utf8');

const rules = [];
for (const file of (await walk(sourceDir)).filter((entry) => /\.(md|mdx)$/i.test(entry)).sort()) {
  const data = matter(await fs.readFile(file, 'utf8')).data ?? {};
  if (data.status !== 'published') continue;

  const relativePath = path.relative(sourceDir, file);
  const slug = vaultSourceSlug(relativePath);
  const entry = {
    ...data,
    slug,
    type: data.type ?? inferNoteType(file, sourceDir),
  };
  if (!resolveCommunityForPage(entry, slug)) continue;
  if (!data.community_id) throw new Error(`Missing community_id: ${relativePath}`);

  const currentUrl = new URL(slugToRoute(slug), siteConfig.site).href;
  const stableUrl = new URL(`/community/${data.community_id}/`, siteConfig.site).href;
  rules.push(`${currentUrl} ${stableUrl}`);
}
await fs.writeFile(rulesFile, `${rules.sort().join('\n')}\n`, 'utf8');

const schema = await fs.readFile(schemaFile, 'utf8');
if (!schema.includes('## Community identity')) {
  const marker = 'Do not add a second `publish` boolean. Canon/continuity truth is a separate concept from whether a note is publicly released.\n';
  if (!schema.includes(marker)) throw new Error('Frontmatter Schema publication marker was not found.');
  const section = `\n## Community identity\n\n\`community_id\` is the permanent UUIDv4 identity for a public page's Community data. Add it when a page first becomes Community-enabled. Never change or reuse it when the title, filename, slug or era presentation changes. From \`Site/\`, \`node -e "console.log(crypto.randomUUID())"\` generates a suitable value.\n\n\`community\` is an optional boolean override. Omit it for the normal page-kind default. Set \`community: false\` to remove the whole Community section, or \`community: true\` to enable it on an otherwise excluded page. The older \`giscus\` boolean remains a compatibility fallback during the comment-system migration; do not add it to new notes.\n`;
  await fs.writeFile(schemaFile, schema.replace(marker, `${marker}${section}`), 'utf8');
}

console.log(`Prepared ${rules.length} Remark42 URL remap rule(s).`);
