import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { descriptionFromBody } from './integrate-worldanvil-import.mjs';
import { isMainModule } from './script-entry.mjs';

const DEFAULT_VAULT = path.resolve(process.cwd(), '../Vault');
const IMPORT_REL = 'Drafts/WorldAnvil Import';

function splitFrontmatter(markdown) {
  const text = String(markdown ?? '').replace(/\r\n/g, '\n');
  if (!text.startsWith('---\n')) return { frontmatter: '', body: text, hasFrontmatter: false };
  const end = text.indexOf('\n---\n', 4);
  if (end === -1) return { frontmatter: '', body: text, hasFrontmatter: false };
  return {
    frontmatter: text.slice(4, end),
    body: text.slice(end + 5),
    hasFrontmatter: true,
  };
}

function hasProperty(frontmatter, key) {
  return new RegExp(`^${key}:`, 'm').test(frontmatter);
}

function frontmatterTitle(frontmatter, fallback) {
  const match = frontmatter.match(/^title:\s*(.+)$/m);
  if (!match) return fallback;
  return match[1].trim().replace(/^['"]|['"]$/g, '') || fallback;
}

export function prepareImportMarkdown(markdown, fallbackTitle = '') {
  const parts = splitFrontmatter(markdown);
  if (!parts.hasFrontmatter) {
    return { markdown: String(markdown ?? ''), changed: false, skipped: true, added: [] };
  }

  const added = [];
  const lines = parts.frontmatter.split('\n');
  const title = frontmatterTitle(parts.frontmatter, fallbackTitle);
  const description = descriptionFromBody(parts.body, '');

  if (!hasProperty(parts.frontmatter, 'description') && description) {
    added.push(`description: ${JSON.stringify(description)}`);
  }
  if (!hasProperty(parts.frontmatter, 'created')) added.push('created:');
  if (!hasProperty(parts.frontmatter, 'updated')) added.push('updated:');

  if (!added.length) {
    return { markdown: String(markdown ?? ''), changed: false, skipped: false, added: [] };
  }

  const descriptionIndex = lines.findIndex((line) => /^description:/.test(line));
  const titleIndex = lines.findIndex((line) => /^title:/.test(line));
  const insertionIndex = (descriptionIndex >= 0 ? descriptionIndex : titleIndex) + 1;
  lines.splice(Math.max(insertionIndex, 0), 0, ...added);

  return {
    markdown: `---\n${lines.join('\n')}\n---\n${parts.body}`,
    changed: true,
    skipped: false,
    added,
    title,
  };
}

async function markdownFiles(root) {
  try {
    return (await Array.fromAsync(fs.glob('**/*.md', { cwd: root }))).sort();
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

export async function prepareWorldAnvilFrontmatter({ vault = DEFAULT_VAULT, write = false } = {}) {
  const importDir = path.join(vault, IMPORT_REL);
  const files = await markdownFiles(importDir);
  const stats = {
    total: files.length,
    changed: 0,
    skipped: 0,
    descriptionsAdded: 0,
    createdKeysAdded: 0,
    updatedKeysAdded: 0,
  };

  for (const relativePath of files) {
    const fullPath = path.join(importDir, relativePath);
    const raw = await fs.readFile(fullPath, 'utf8');
    const prepared = prepareImportMarkdown(raw, path.basename(relativePath, '.md'));

    if (prepared.skipped) {
      stats.skipped += 1;
      continue;
    }
    if (!prepared.changed) continue;

    stats.changed += 1;
    if (prepared.added.some((line) => line.startsWith('description:'))) stats.descriptionsAdded += 1;
    if (prepared.added.includes('created:')) stats.createdKeysAdded += 1;
    if (prepared.added.includes('updated:')) stats.updatedKeysAdded += 1;
    if (write) await fs.writeFile(fullPath, prepared.markdown, 'utf8');
  }

  console.log(`World Anvil frontmatter preparation (${write ? 'write' : 'audit'})`);
  console.log(`Imported notes: ${stats.total}`);
  console.log(`${write ? 'Changed' : 'Would change'}: ${stats.changed}`);
  console.log(`Descriptions added: ${stats.descriptionsAdded}`);
  console.log(`created keys added: ${stats.createdKeysAdded}`);
  console.log(`updated keys added: ${stats.updatedKeysAdded}`);
  if (stats.skipped) console.log(`Skipped without valid frontmatter: ${stats.skipped}`);

  return stats;
}

function parseArgs(argv) {
  const args = { write: false, vault: DEFAULT_VAULT };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--write') args.write = true;
    else if (argv[index] === '--vault') {
      index += 1;
      args.vault = path.resolve(argv[index]);
    } else if (argv[index] === '--help' || argv[index] === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${argv[index]}`);
  }
  return args;
}

if (isMainModule(import.meta.url)) {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
      console.log('Usage: node scripts/prepare-worldanvil-import-frontmatter.mjs [--write] [--vault PATH]');
    } else {
      await prepareWorldAnvilFrontmatter(args);
    }
  } catch (error) {
    console.error(error?.stack ?? error);
    process.exitCode = 1;
  }
}
