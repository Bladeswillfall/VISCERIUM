import path from 'node:path';
import fs from 'node:fs/promises';
import process from 'node:process';
import matter from 'gray-matter';
import siteConfig from '../site.config.mjs';

function normalisePath(value) {
  return path.resolve(value);
}

function relativePath(rootDir, file) {
  return path.relative(rootDir, file).replace(/\\/g, '/');
}

export async function scanMarkdownContent(rootDir) {
  const resolvedRoot = normalisePath(rootDir);
  const files = (await Array.fromAsync(fs.glob('**/*.{md,mdx}', { cwd: resolvedRoot })))
    .map((file) => path.resolve(resolvedRoot, file))
    .sort();
  const records = await Promise.all(files.map(async (file) => {
    const raw = await fs.readFile(file, 'utf8');
    const parsed = matter(raw);
    return {
      file,
      relativePath: relativePath(resolvedRoot, file),
      extension: path.extname(file).toLowerCase(),
      raw,
      data: parsed.data ?? {},
      content: parsed.content ?? '',
    };
  }));
  return { rootDir: resolvedRoot, files, records };
}

export async function loadVaultContent() {
  const siteRoot = process.cwd();
  return scanMarkdownContent(path.resolve(siteRoot, siteConfig.loreSourceDir));
}

export async function loadGeneratedDocs() {
  const siteRoot = process.cwd();
  const docsDir = process.env.VISCERIUM_DOCS_DIR
    ? path.resolve(process.env.VISCERIUM_DOCS_DIR)
    : path.resolve(siteRoot, 'src/content/docs');
  return scanMarkdownContent(docsDir);
}
