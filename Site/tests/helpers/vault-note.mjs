import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const here = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_LORE_ROOT = path.resolve(here, '../../../Vault/Lore');

function propertyMatches(actual, expected) {
  if (Array.isArray(actual)) return actual.includes(expected);
  return actual === expected;
}

function describeCriteria(criteria) {
  return Object.entries(criteria)
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join(', ');
}

function routeSegment(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export function vaultNoteRoute(note) {
  if (!note || typeof note !== 'object') throw new TypeError('vaultNoteRoute requires a located Vault note.');

  const explicitSlug = typeof note.data?.slug === 'string' ? note.data.slug.trim() : '';
  if (explicitSlug) return `/${explicitSlug.replace(/^\/+|\/+$/g, '')}/`;

  const sourcePath = String(note.relativePath ?? '').replace(/\\/g, '/').replace(/\.(?:md|mdx)$/i, '');
  const segments = sourcePath.split('/').filter(Boolean).map(routeSegment).filter(Boolean);
  if (!segments.length) throw new Error('Cannot derive a public route from an empty Vault note path.');

  return `/${segments.join('/')}/`;
}

export async function findVaultNote(criteria, { root = DEFAULT_LORE_ROOT } = {}) {
  if (!criteria || typeof criteria !== 'object' || Array.isArray(criteria)) {
    throw new TypeError('findVaultNote requires a frontmatter criteria object.');
  }

  const entries = Object.entries(criteria);
  if (!entries.length) throw new TypeError('findVaultNote requires at least one frontmatter criterion.');

  const files = (await Array.fromAsync(fs.glob('**/*.md', { cwd: root }))).sort();
  const matches = [];

  for (const relativePath of files) {
    const absolutePath = path.join(root, relativePath);
    const markdown = await fs.readFile(absolutePath, 'utf8');
    const parsed = matter(markdown);

    if (entries.every(([key, expected]) => propertyMatches(parsed.data[key], expected))) {
      matches.push({
        absolutePath,
        relativePath,
        markdown,
        data: parsed.data,
        content: parsed.content,
      });
    }
  }

  const description = describeCriteria(criteria);
  if (matches.length === 0) {
    throw new Error(`No Vault/Lore note matched ${description}.`);
  }
  if (matches.length > 1) {
    throw new Error(
      `Multiple Vault/Lore notes matched ${description}: ${matches.map((match) => match.relativePath).join(', ')}`,
    );
  }

  return matches[0];
}

export async function findVaultNoteRoute(criteria, options) {
  return vaultNoteRoute(await findVaultNote(criteria, options));
}
