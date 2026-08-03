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
