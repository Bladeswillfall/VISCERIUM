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

const blocks = Object.freeze({
  VISCERIUM_CURRENT: `> **${visceriumCreativeNotice(endYear)}**`,
  VISCERIUM_PLANNED: `> **${plannedVisceriumNotice(endYear)}**`,
  NULL_MATERIALS: `> **${nullMaterialsNotice(endYear)}**`,
  FIRST_PARTY_CODE: firstPartyCodeNotice(endYear),
});

const targets = Object.freeze({
  'README.md': ['VISCERIUM_CURRENT', 'VISCERIUM_PLANNED'],
  'LICENSE.md': ['VISCERIUM_CURRENT', 'VISCERIUM_PLANNED'],
  'ATTRIBUTION.md': ['VISCERIUM_CURRENT', 'NULL_MATERIALS', 'VISCERIUM_PLANNED'],
  'LICENSE-CODE.md': ['FIRST_PARTY_CODE'],
});

function marker(name, edge) {
  return `<!-- RIGHTS:${name}:${edge} -->`;
}

function replaceBlock(content, name, replacement, relativePath) {
  const start = marker(name, 'START');
  const end = marker(name, 'END');
  const pattern = new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`, 'g');
  const matches = content.match(pattern) ?? [];

  if (matches.length !== 1) {
    throw new Error(`${relativePath} must contain exactly one ${name} rights block; found ${matches.length}.`);
  }

  return content.replace(pattern, `${start}\n${replacement}\n${end}`);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const staleFiles = [];

for (const [relativePath, blockNames] of Object.entries(targets)) {
  const absolutePath = path.join(repoRoot, relativePath);
  const original = await fs.readFile(absolutePath, 'utf8');
  let updated = original;

  for (const blockName of blockNames) {
    updated = replaceBlock(updated, blockName, blocks[blockName], relativePath);
  }

  if (updated === original) continue;

  staleFiles.push(relativePath);
  if (writeMode) {
    await fs.writeFile(absolutePath, updated, 'utf8');
    console.log(`Updated ${relativePath}`);
  }
}

if (checkMode && staleFiles.length > 0) {
  throw new Error(
    `Rights notices are stale for ${endYear}: ${staleFiles.join(', ')}. Run npm run rights:update.`,
  );
}

if (staleFiles.length === 0) {
  console.log(`Rights notices are current for ${endYear}.`);
}
