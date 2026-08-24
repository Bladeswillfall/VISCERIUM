import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  currentCopyrightYear,
  firstPartyCodeNotice,
  nullMaterialsNotice,
  plannedVisceriumNotice,
  visceriumCreativeNotice,
} from '../src/config/rights.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');

const writeMode = process.argv.includes('--write');
const checkMode = process.argv.includes('--check') || !writeMode;

if (writeMode && process.argv.includes('--check')) {
  throw new Error('Choose either --write or --check, not both.');
}

const yearOverride = process.env.RIGHTS_YEAR;
const endYear = yearOverride === undefined
  ? currentCopyrightYear()
  : Number.parseInt(yearOverride, 10);

if (!Number.isInteger(endYear)) {
  throw new TypeError(`RIGHTS_YEAR must be an integer; received ${yearOverride}.`);
}

const rightsBlocks = Object.freeze({
  VISCERIUM_CURRENT: `> **${visceriumCreativeNotice(endYear)}**`,
  VISCERIUM_PLANNED: `> **${plannedVisceriumNotice(endYear)}**`,
  NULL_MATERIALS: `> **${nullMaterialsNotice(endYear)}**`,
  FIRST_PARTY_CODE: firstPartyCodeNotice(endYear),
});

const rightsTargets = Object.freeze({
  'README.md': ['VISCERIUM_CURRENT', 'VISCERIUM_PLANNED'],
  'LICENSE.md': ['VISCERIUM_CURRENT', 'VISCERIUM_PLANNED'],
  'ATTRIBUTION.md': ['VISCERIUM_CURRENT', 'NULL_MATERIALS', 'VISCERIUM_PLANNED'],
  'LICENSE-CODE.md': ['FIRST_PARTY_CODE'],
});

const dependencyProjects = Object.freeze([
  {
    label: 'Codex (`Site/`)',
    manifest: 'Site/package.json',
  },
  {
    label: 'Obsidian timelines plugin',
    manifest: 'Tools/obsidian-viscerium-timelines/package.json',
  },
]);

function marker(namespace, name, edge) {
  return `<!-- ${namespace}:${name}:${edge} -->`;
}

function replaceBlock(content, namespace, name, replacement, relativePath) {
  const start = marker(namespace, name, 'START');
  const end = marker(namespace, name, 'END');
  const pattern = new RegExp(`${RegExp.escape(start)}[\\s\\S]*?${RegExp.escape(end)}`, 'g');
  const matches = content.match(pattern) ?? [];

  if (matches.length !== 1) {
    throw new Error(
      `${relativePath} must contain exactly one ${namespace}:${name} managed block; found ${matches.length}.`,
    );
  }

  return content.replace(pattern, `${start}\n${replacement}\n${end}`);
}

async function readJson(relativePath) {
  const raw = await fs.readFile(path.join(repoRoot, relativePath), 'utf8');
  return JSON.parse(raw);
}

async function dependencySnapshot() {
  const dependencyRows = [];
  const lifecycleRows = [];

  for (const project of dependencyProjects) {
    const manifest = await readJson(project.manifest);

    for (const [scope, field] of [
      ['runtime', 'dependencies'],
      ['development', 'devDependencies'],
    ]) {
      for (const [packageName, declaredVersion] of Object.entries(manifest[field] ?? {})) {
        dependencyRows.push(
          `| ${project.label} | \`${packageName}\` | ${scope} | \`${declaredVersion}\` |`,
        );
      }
    }

    for (const [packageVersion, approved] of Object.entries(manifest.allowScripts ?? {})) {
      if (approved !== true) continue;
      lifecycleRows.push(`| ${project.label} | \`${packageVersion}\` | approved |`);
    }
  }

  const lifecycleSection = lifecycleRows.length > 0
    ? [
        '| Project | Package/version | Lifecycle script |',
        '| --- | --- | --- |',
        ...lifecycleRows,
      ]
    : ['No npm lifecycle scripts are approved.'];

  return [
    '| Project | Package | Scope | Declared version |',
    '| --- | --- | --- | --- |',
    ...dependencyRows,
    '',
    '#### Approved npm lifecycle scripts',
    '',
    'These exact package/version entries are permitted to run install lifecycle scripts under the repository strict allowlist policy.',
    '',
    ...lifecycleSection,
  ].join('\n');
}

const staleFiles = new Set();

for (const [relativePath, blockNames] of Object.entries(rightsTargets)) {
  const absolutePath = path.join(repoRoot, relativePath);
  const original = await fs.readFile(absolutePath, 'utf8');
  let updated = original;

  for (const blockName of blockNames) {
    updated = replaceBlock(updated, 'RIGHTS', blockName, rightsBlocks[blockName], relativePath);
  }

  if (updated === original) continue;

  staleFiles.add(relativePath);
  if (writeMode) {
    await fs.writeFile(absolutePath, updated, 'utf8');
    console.log(`Updated ${relativePath}`);
  }
}

{
  const relativePath = 'THIRD_PARTY_NOTICES.md';
  const absolutePath = path.join(repoRoot, relativePath);
  const original = await fs.readFile(absolutePath, 'utf8');
  const updated = replaceBlock(
    original,
    'DEPENDENCIES',
    'DIRECT',
    await dependencySnapshot(),
    relativePath,
  );

  if (updated !== original) {
    staleFiles.add(relativePath);
    if (writeMode) {
      await fs.writeFile(absolutePath, updated, 'utf8');
      console.log(`Updated ${relativePath}`);
    }
  }
}

if (checkMode && staleFiles.size > 0) {
  throw new Error(
    `Managed notices are stale: ${[...staleFiles].join(', ')}. Run npm run notices:update.`,
  );
}

if (staleFiles.size === 0) {
  console.log(`Managed notices are current for ${endYear}.`);
}
