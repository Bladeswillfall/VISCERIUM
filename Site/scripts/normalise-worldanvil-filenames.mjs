import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_VAULT = path.resolve(here, '../../Vault');

const WORLD_ANVIL_TYPES = [
  'Article',
  'Condition',
  'Ethnicity',
  'Formation',
  'Item',
  'Landmark',
  'Language',
  'Law',
  'Location',
  'Material',
  'MilitaryConflict',
  'Organization',
  'Person',
  'Plot',
  'Profession',
  'Rank',
  'Ritual',
  'Settlement',
  'Species',
  'Technology',
  'Vehicle',
];

const exportFilename = new RegExp(
  `^(?:${WORLD_ANVIL_TYPES.join('|')})-(.+)-[A-Za-z0-9]{3}\\.md$`,
  'u',
);

function toPosix(value) {
  return String(value).replace(/\\/g, '/');
}

function collisionKey(value) {
  return toPosix(value).normalize('NFC').toLocaleLowerCase('en');
}

function normalisedFilename(filename) {
  const match = String(filename).match(exportFilename);
  if (!match) return null;
  const title = match[1].trim();
  return title ? `${title}.md` : null;
}

async function markdownFiles(root) {
  return (await Array.fromAsync(fs.glob('**/*.md', { cwd: root }))).sort();
}

function rewriteWikilinks(markdown, stemRenames) {
  let changed = 0;
  const output = String(markdown).replace(/(!?\[\[)([^\]]+)(\]\])/g, (whole, open, body, close) => {
    const pipeIndex = body.indexOf('|');
    const targetAndAnchor = pipeIndex >= 0 ? body.slice(0, pipeIndex) : body;
    const display = pipeIndex >= 0 ? body.slice(pipeIndex) : '';
    const hashIndex = targetAndAnchor.indexOf('#');
    const rawTarget = hashIndex >= 0 ? targetAndAnchor.slice(0, hashIndex) : targetAndAnchor;
    const anchor = hashIndex >= 0 ? targetAndAnchor.slice(hashIndex) : '';
    const slashIndex = Math.max(rawTarget.lastIndexOf('/'), rawTarget.lastIndexOf('\\'));
    const prefix = slashIndex >= 0 ? rawTarget.slice(0, slashIndex + 1) : '';
    const stem = slashIndex >= 0 ? rawTarget.slice(slashIndex + 1) : rawTarget;
    const replacement = stemRenames.get(stem);
    if (!replacement) return whole;
    changed += 1;
    return `${open}${prefix}${replacement}${anchor}${display}${close}`;
  });
  return { output, changed };
}

export async function planWorldAnvilFilenameNormalisation({ vaultRoot = DEFAULT_VAULT } = {}) {
  const loreRoot = path.join(vaultRoot, 'Lore');
  const files = await markdownFiles(loreRoot);
  const existingPaths = new Set(files.map(toPosix));
  const existingPathIndex = new Map();
  for (const relativePath of files) {
    const key = collisionKey(relativePath);
    if (!existingPathIndex.has(key)) existingPathIndex.set(key, toPosix(relativePath));
  }

  const renames = [];
  const collisions = [];
  const targetIndex = new Map();

  for (const relativePath of files) {
    const filename = path.basename(relativePath);
    const targetFilename = normalisedFilename(filename);
    if (!targetFilename) continue;

    const source = path.join(loreRoot, relativePath);
    const targetRelativePath = path.join(path.dirname(relativePath), targetFilename);
    const target = path.join(loreRoot, targetRelativePath);
    const sourcePath = toPosix(relativePath);
    const targetPath = toPosix(targetRelativePath);
    const sourceKey = collisionKey(sourcePath);
    const key = collisionKey(targetPath);
    const duplicate = targetIndex.get(key);
    const exactTargetExists = existingPaths.has(targetPath);
    const caseInsensitiveTargetExists = existingPathIndex.has(key) && key !== sourceKey;

    if (duplicate || exactTargetExists || caseInsensitiveTargetExists) {
      collisions.push({
        source: toPosix(path.relative(vaultRoot, source)),
        target: toPosix(path.relative(vaultRoot, target)),
        reason: duplicate
          ? 'duplicate-planned-target'
          : exactTargetExists
            ? 'target-exists'
            : 'target-exists-case-insensitive',
      });
      continue;
    }

    targetIndex.set(key, source);
    renames.push({
      source,
      target,
      sourcePath: toPosix(path.relative(vaultRoot, source)),
      targetPath: toPosix(path.relative(vaultRoot, target)),
      oldStem: path.basename(filename, '.md'),
      newStem: path.basename(targetFilename, '.md'),
    });
  }

  return { vaultRoot, renames, collisions };
}

export async function normaliseWorldAnvilFilenames({ vaultRoot = DEFAULT_VAULT, write = false } = {}) {
  const plan = await planWorldAnvilFilenameNormalisation({ vaultRoot });
  const report = {
    mode: write ? 'write' : 'audit',
    vaultRoot,
    renamed: plan.renames.map(({ sourcePath, targetPath }) => ({ sourcePath, targetPath })),
    collisions: plan.collisions,
    linksUpdated: 0,
    filesWithUpdatedLinks: [],
  };

  if (!write) return report;

  const stemRenames = new Map(plan.renames.map(({ oldStem, newStem }) => [oldStem, newStem]));
  for (const relativePath of await markdownFiles(vaultRoot)) {
    const file = path.join(vaultRoot, relativePath);
    const source = await fs.readFile(file, 'utf8');
    const rewritten = rewriteWikilinks(source, stemRenames);
    if (!rewritten.changed) continue;
    await fs.writeFile(file, rewritten.output, 'utf8');
    report.linksUpdated += rewritten.changed;
    report.filesWithUpdatedLinks.push(toPosix(relativePath));
  }

  for (const rename of plan.renames) {
    await fs.rename(rename.source, rename.target);
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
  const label = report.mode === 'write' ? 'Renamed' : 'Would rename';
  console.log(`World Anvil filename normalisation (${report.mode})`);
  console.log(`${label}: ${report.renamed.length}`);
  console.log(`Collisions: ${report.collisions.length}`);
  console.log(`Wikilinks updated: ${report.linksUpdated}`);

  for (const entry of report.renamed) {
    console.log(`  ${entry.sourcePath} -> ${entry.targetPath}`);
  }
  for (const collision of report.collisions) {
    console.log(`  collision ${collision.source} -> ${collision.target}: ${collision.reason}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const report = await normaliseWorldAnvilFilenames({
    vaultRoot: parseVaultArgument(args),
    write: args.includes('--write'),
  });
  printReport(report);
  if (report.collisions.length && !args.includes('--allow-collisions')) process.exitCode = 1;
}
