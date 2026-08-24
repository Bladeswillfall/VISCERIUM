import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { inferPathMetadata, inferPathSubtype } from './note-inference.mjs';
import { isMainModule } from './script-entry.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_VAULT = path.resolve(here, '../../Vault');
const CONTROLLED_FIELDS = ['type', 'era', 'item_type', 'species_kind'];

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

function comparable(value) {
  return String(value ?? '').trim();
}

function splitFrontmatter(markdown) {
  const source = String(markdown ?? '').replace(/\r\n/g, '\n');
  if (!source.startsWith('---\n')) return null;
  const end = source.indexOf('\n---\n', 4);
  if (end < 0) return null;
  return {
    frontmatter: source.slice(4, end),
    body: source.slice(end + 5),
  };
}

function writeFields(markdown, fields) {
  const parts = splitFrontmatter(markdown);
  if (!parts) return markdown;

  let frontmatter = parts.frontmatter;
  for (const [key, value] of Object.entries(fields)) {
    const blankProperty = new RegExp(`^${RegExp.escape(key)}:\\s*(?:null|~)?\\s*$`, 'm');
    const line = `${key}: ${value}`;
    if (blankProperty.test(frontmatter)) {
      frontmatter = frontmatter.replace(blankProperty, line);
      continue;
    }

    const lines = frontmatter.split('\n');
    const insertion = lines.findIndex((entry) => /^(?:tags|related|relationships|sidebar):/.test(entry));
    lines.splice(insertion < 0 ? lines.length : insertion, 0, line);
    frontmatter = lines.join('\n');
  }

  return `---\n${frontmatter}\n---\n${parts.body}`;
}

function fieldDecision({ key, expected, current, changes, conflicts }) {
  if (!expected) return;
  if (isBlank(current)) {
    changes[key] = expected;
    return;
  }
  if (comparable(current) !== comparable(expected)) {
    conflicts.push({ key, current, expected });
  }
}

export function planFolderFrontmatter(markdown, file, loreRoot) {
  const result = {
    output: String(markdown ?? ''),
    changes: {},
    conflicts: [],
    notices: [],
  };

  if (!splitFrontmatter(markdown)) {
    result.notices.push('missing-frontmatter');
    return result;
  }

  let data;
  try {
    data = matter(markdown).data;
  } catch (error) {
    result.notices.push(`invalid-frontmatter: ${error.message}`);
    return result;
  }

  const inferred = inferPathMetadata(file, loreRoot);
  fieldDecision({
    key: 'type',
    expected: inferred.type,
    current: data.type,
    changes: result.changes,
    conflicts: result.conflicts,
  });

  if (!inferred.type && isBlank(data.type)) result.notices.push('ambiguous-type');

  fieldDecision({
    key: 'era',
    expected: inferred.era,
    current: data.era,
    changes: result.changes,
    conflicts: result.conflicts,
  });

  const effectiveType = isBlank(data.type) ? inferred.type : comparable(data.type);
  if (effectiveType === 'item') {
    fieldDecision({
      key: 'item_type',
      expected: inferPathSubtype('item', file, loreRoot),
      current: data.item_type,
      changes: result.changes,
      conflicts: result.conflicts,
    });
  }
  if (effectiveType === 'species') {
    fieldDecision({
      key: 'species_kind',
      expected: inferPathSubtype('species', file, loreRoot),
      current: data.species_kind,
      changes: result.changes,
      conflicts: result.conflicts,
    });
  }

  result.output = writeFields(markdown, result.changes);
  return result;
}

async function loreMarkdownFiles(loreRoot) {
  return (await Array.fromAsync(fs.glob('**/*.md', { cwd: loreRoot })))
    .map((relativePath) => path.join(loreRoot, relativePath))
    .sort((left, right) => left.localeCompare(right));
}

export async function backfillFolderFrontmatter({ vaultRoot = DEFAULT_VAULT, write = false } = {}) {
  const loreRoot = path.join(vaultRoot, 'Lore');
  const report = {
    mode: write ? 'write' : 'audit',
    vaultRoot,
    scanned: 0,
    changed: [],
    conflicts: [],
    notices: [],
    fieldCounts: Object.fromEntries(CONTROLLED_FIELDS.map((key) => [key, 0])),
  };

  for (const file of await loreMarkdownFiles(loreRoot)) {
    report.scanned += 1;
    const relativePath = path.relative(vaultRoot, file).replace(/\\/g, '/');
    const source = await fs.readFile(file, 'utf8');
    const plan = planFolderFrontmatter(source, file, loreRoot);

    if (Object.keys(plan.changes).length) {
      report.changed.push({ path: relativePath, fields: plan.changes });
      for (const key of Object.keys(plan.changes)) report.fieldCounts[key] += 1;
      if (write) await fs.writeFile(file, plan.output, 'utf8');
    }
    for (const conflict of plan.conflicts) report.conflicts.push({ path: relativePath, ...conflict });
    for (const notice of plan.notices) report.notices.push({ path: relativePath, notice });
  }

  return report;
}

function parseVaultArgument(args) {
  const inline = args.find((arg) => arg.startsWith('--vault='));
  if (inline) return path.resolve(inline.slice('--vault='.length));
  const index = args.indexOf('--vault');
  if (index >= 0 && args[index + 1]) return path.resolve(args[index + 1]);
  return DEFAULT_VAULT;
}

function printReport(report) {
  const changeLabel = report.mode === 'write' ? 'Changed' : 'Would change';
  console.log(`Folder frontmatter backfill (${report.mode})`);
  console.log(`Lore notes scanned: ${report.scanned}`);
  console.log(`${changeLabel}: ${report.changed.length}`);
  for (const key of CONTROLLED_FIELDS) console.log(`${key} fields: ${report.fieldCounts[key]}`);
  console.log(`Conflicts left untouched: ${report.conflicts.length}`);
  console.log(`Review notices: ${report.notices.length}`);

  for (const entry of report.changed) {
    const fields = Object.entries(entry.fields).map(([key, value]) => `${key}=${value}`).join(', ');
    console.log(`  ${report.mode === 'write' ? 'updated' : 'would update'} ${entry.path}: ${fields}`);
  }
  for (const conflict of report.conflicts) {
    console.log(`  conflict ${conflict.path}: ${conflict.key} is ${JSON.stringify(conflict.current)}, folder suggests ${JSON.stringify(conflict.expected)}`);
  }
  for (const notice of report.notices) console.log(`  review ${notice.path}: ${notice.notice}`);
}

if (isMainModule(import.meta.url)) {
  const args = process.argv.slice(2);
  const report = await backfillFolderFrontmatter({
    vaultRoot: parseVaultArgument(args),
    write: args.includes('--write'),
  });
  printReport(report);
}
