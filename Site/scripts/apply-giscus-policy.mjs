import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import matter from 'gray-matter';
import { toPosixPath } from '../src/lib/codex-paths.mjs';
import { resolveGiscusForPage } from '../src/lib/page-kind.mjs';

const siteRoot = process.cwd();
const defaultDocsDir = process.env.VISCERIUM_DOCS_DIR
  ? path.resolve(process.env.VISCERIUM_DOCS_DIR)
  : path.resolve(siteRoot, 'src/content/docs');
const markdownExtensions = /\.(md|mdx)$/i;

function fallbackIdForFile(file, docsDir) {
  return toPosixPath(path.relative(docsDir, file))
    .replace(markdownExtensions, '')
    .replace(/\/index$/i, '');
}

export async function applyGiscusPolicy({ docsDir = defaultDocsDir } = {}) {
  const files = (await Array.fromAsync(fs.glob('**/*.{md,mdx}', { cwd: docsDir })))
    .map((file) => path.resolve(docsDir, file))
    .sort();

  let updated = 0;
  for (const file of files) {
    const raw = await fs.readFile(file, 'utf8');
    const parsed = matter(raw);
    const giscus = resolveGiscusForPage(parsed.data, fallbackIdForFile(file, docsDir));
    if (parsed.data.giscus === giscus) continue;

    parsed.data.giscus = giscus;
    await fs.writeFile(file, matter.stringify(parsed.content, parsed.data), 'utf8');
    updated += 1;
  }

  console.log(`Applied Giscus policy to ${files.length} generated page${files.length === 1 ? '' : 's'}; updated ${updated}.`);
}
