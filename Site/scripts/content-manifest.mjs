import path from 'node:path';
import fs from 'node:fs/promises';
import process from 'node:process';
import matter from 'gray-matter';
import siteConfig from '../site.config.mjs';

const manifestCache = new Map();

function normalisePath(value) {
  return path.resolve(value);
}

function relativePath(rootDir, file) {
  return path.relative(rootDir, file).replace(/\\/g, '/');
}

export async function scanMarkdownContent(rootDir, { refresh = false } = {}) {
  const resolvedRoot = normalisePath(rootDir);
  if (!refresh && manifestCache.has(resolvedRoot)) return manifestCache.get(resolvedRoot);

  const scan = (async () => {
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

    return {
      rootDir: resolvedRoot,
      files,
      records,
    };
  })();

  manifestCache.set(resolvedRoot, scan);
  try {
    return await scan;
  } catch (error) {
    if (manifestCache.get(resolvedRoot) === scan) manifestCache.delete(resolvedRoot);
    throw error;
  }
}

export function clearContentManifest(rootDir) {
  manifestCache.delete(normalisePath(rootDir));
}

export async function loadVaultContent(options) {
  const siteRoot = process.cwd();
  return scanMarkdownContent(path.resolve(siteRoot, siteConfig.loreSourceDir), options);
}

export async function loadGeneratedDocs(options) {
  const siteRoot = process.cwd();
  const docsDir = process.env.VISCERIUM_DOCS_DIR
    ? path.resolve(process.env.VISCERIUM_DOCS_DIR)
    : path.resolve(siteRoot, 'src/content/docs');
  return scanMarkdownContent(docsDir, options);
}
