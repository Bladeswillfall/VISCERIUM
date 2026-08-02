import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { descriptionFromBody } from './integrate-worldanvil-import.mjs';
import { isMainModule } from './script-entry.mjs';

const DEFAULT_VAULT = path.resolve(process.cwd(), '../Vault');
const IMPORT_REL = 'Drafts/WorldAnvil Import';
const REVIEW_BLOCK_RE = /<!-- worldanvil-migration-review:start -->[\s\S]*?<!-- worldanvil-migration-review:end -->\n?/g;

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

function blankScalarLine(line, key) {
  const match = String(line ?? '').match(new RegExp(`^${key}:\\s*(.*)$`));
  if (!match) return false;
  return ['', 'null', '~', '""', "''"].includes(match[1].trim().toLowerCase());
}

function taskDescriptionLine(line) {
  return /^description:\s*["']?\s*[-*+]\s+\[[ xX]\]\s+/i.test(String(line ?? ''));
}

function descriptionSource(body) {
  return String(body ?? '')
    .replace(REVIEW_BLOCK_RE, '')
    .split(/\n\s*\n/)
    .filter((block) => !/^\s*[-*+]\s+\[[ xX]\]\s+/.test(block))
    .join('\n\n');
}

export function prepareImportMarkdown(markdown, fallbackTitle = '') {
  const parts = splitFrontmatter(markdown);
  if (!parts.hasFrontmatter) {
    return {
      markdown: String(markdown ?? ''),
      changed: false,
      skipped: true,
      added: [],
      descriptionUnresolved: false,
      invalidDescriptionRemoved: false,
    };
  }

  const changedFields = [];
  const insertions = [];
  const lines = parts.frontmatter.split('\n');
  const title = frontmatterTitle(parts.frontmatter, fallbackTitle);
  let descriptionIndex = lines.findIndex((line) => /^description:/.test(line));
  const invalidDescription = descriptionIndex >= 0 && taskDescriptionLine(lines[descriptionIndex]);
  const descriptionNeedsValue = descriptionIndex < 0
    || blankScalarLine(lines[descriptionIndex], 'description')
    || invalidDescription;
  const description = descriptionNeedsValue
    ? descriptionFromBody(descriptionSource(parts.body), '')
    : '';
  const descriptionUnresolved = descriptionNeedsValue && !description;
  let invalidDescriptionRemoved = false;

  if (descriptionNeedsValue && description) {
    const descriptionLine = `description: ${JSON.stringify(description)}`;
    changedFields.push(descriptionLine);
    if (descriptionIndex >= 0) lines[descriptionIndex] = descriptionLine;
    else insertions.push(descriptionLine);
  } else if (invalidDescription) {
    lines.splice(descriptionIndex, 1);
    descriptionIndex = -1;
    invalidDescriptionRemoved = true;
    changedFields.push('description: <removed generated task>');
  }

  // Do not seed created: for imports. Auto-Properties derives it from the file
  // birth time, which is the export/import time rather than an authoritative
  // World Anvil article creation date.
  if (!hasProperty(parts.frontmatter, 'updated')) {
    changedFields.push('updated:');
    insertions.push('updated:');
  }

  if (!changedFields.length) {
    return {
      markdown: String(markdown ?? ''),
      changed: false,
      skipped: false,
      added: [],
      descriptionUnresolved,
      invalidDescriptionRemoved: false,
      title,
    };
  }

  descriptionIndex = lines.findIndex((line) => /^description:/.test(line));
  const titleIndex = lines.findIndex((line) => /^title:/.test(line));
  const insertionIndex = (descriptionIndex >= 0 ? descriptionIndex : titleIndex) + 1;
  if (insertions.length) lines.splice(Math.max(insertionIndex, 0), 0, ...insertions);

  return {
    markdown: `---\n${lines.join('\n')}\n---\n${parts.body}`,
    changed: true,
    skipped: false,
    added: changedFields,
    descriptionUnresolved,
    invalidDescriptionRemoved,
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
    descriptionsUnresolved: 0,
    invalidDescriptionsRemoved: 0,
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
    if (prepared.descriptionUnresolved) stats.descriptionsUnresolved += 1;
    if (prepared.invalidDescriptionRemoved) stats.invalidDescriptionsRemoved += 1;
    if (!prepared.changed) continue;

    stats.changed += 1;
    if (prepared.added.some((line) => line.startsWith('description:') && !line.includes('<removed'))) {
      stats.descriptionsAdded += 1;
    }
    if (prepared.added.includes('updated:')) stats.updatedKeysAdded += 1;
    if (write) await fs.writeFile(fullPath, prepared.markdown, 'utf8');
  }

  console.log(`World Anvil frontmatter preparation (${write ? 'write' : 'audit'})`);
  console.log(`Imported notes: ${stats.total}`);
  console.log(`${write ? 'Changed' : 'Would change'}: ${stats.changed}`);
  console.log(`Descriptions added: ${stats.descriptionsAdded}`);
  console.log(`Invalid task descriptions removed: ${stats.invalidDescriptionsRemoved}`);
  console.log(`Descriptions still unresolved: ${stats.descriptionsUnresolved}`);
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
