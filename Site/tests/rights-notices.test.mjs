import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  currentCopyrightYear,
  firstPartyCodeNotice,
  formatYearRange,
  nullMaterialsNotice,
  plannedVisceriumNotice,
  rightsConfig,
  visceriumCreativeNotice,
} from '../src/config/rights.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repo, relativePath), 'utf8');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractBlock(relativePath, name) {
  const content = read(relativePath);
  const start = `<!-- RIGHTS:${name}:START -->`;
  const end = `<!-- RIGHTS:${name}:END -->`;
  const pattern = new RegExp(`${escapeRegExp(start)}\\n([\\s\\S]*?)\\n${escapeRegExp(end)}`, 'g');
  const matches = [...content.matchAll(pattern)];
  assert.equal(matches.length, 1, `${relativePath} must contain exactly one ${name} block`);
  return matches[0][1];
}

test('rights configuration keeps ownership transitions deliberate', () => {
  assert.equal(rightsConfig.visceriumCreative.startYear, 2021);
  assert.equal(rightsConfig.nullMaterials.startYear, 2025);
  assert.equal(rightsConfig.firstPartyCode.startYear, 2026);
  assert.equal(rightsConfig.visceriumCreative.currentOwner, 'Fall');
  assert.equal(rightsConfig.visceriumCreative.futureOwner, 'NULL Holdings Ltd');
  assert.equal(rightsConfig.nullMaterials.currentOwner, 'Fall');
});

test('year ranges are UTC-based, validated, and use an en dash', () => {
  assert.equal(currentCopyrightYear(new Date('2027-01-01T00:00:00Z')), 2027);
  assert.equal(formatYearRange(2021, 2021), '2021');
  assert.equal(formatYearRange(2021, 2027), '2021–2027');
  assert.throws(() => formatYearRange(2028, 2027), RangeError);
});

test('managed repository notices match the current rights configuration', () => {
  const year = currentCopyrightYear();
  const current = `> **${visceriumCreativeNotice(year)}**`;
  const planned = `> **${plannedVisceriumNotice(year)}**`;
  const nullMaterials = `> **${nullMaterialsNotice(year)}**`;
  const code = firstPartyCodeNotice(year);

  assert.equal(extractBlock('README.md', 'VISCERIUM_CURRENT'), current);
  assert.equal(extractBlock('README.md', 'VISCERIUM_PLANNED'), planned);
  assert.equal(extractBlock('LICENSE.md', 'VISCERIUM_CURRENT'), current);
  assert.equal(extractBlock('LICENSE.md', 'VISCERIUM_PLANNED'), planned);
  assert.equal(extractBlock('ATTRIBUTION.md', 'VISCERIUM_CURRENT'), current);
  assert.equal(extractBlock('ATTRIBUTION.md', 'NULL_MATERIALS'), nullMaterials);
  assert.equal(extractBlock('ATTRIBUTION.md', 'VISCERIUM_PLANNED'), planned);
  assert.equal(extractBlock('LICENSE-CODE.md', 'FIRST_PARTY_CODE'), code);

  assert.doesNotMatch(current, /NULL Holdings Ltd/);
});

test('Astro footer renders the managed creative-rights notice', () => {
  const footer = read('Site/src/components/CodexFooterRail.astro');
  assert.match(footer, /import \{ visceriumCreativeNotice \} from '\.\.\/config\/rights\.mjs';/);
  assert.match(footer, /const creativeRightsNotice = visceriumCreativeNotice\(\);/);
  assert.match(footer, /<strong>\{creativeRightsNotice\}<\/strong>/);
  assert.doesNotMatch(footer, /<strong>© VISCERIUM Codex<\/strong>/);
});

test('README badges communicate the mixed licensing model', () => {
  const readme = read('README.md');
  assert.match(readme, /Creative_IP-All_Rights_Reserved/);
  assert.match(readme, /First--party_Code-MIT/);
  assert.match(readme, /Third--party_Software-Upstream_Licences/);
  assert.match(readme, /Canon-No_Generative_AI/);
  assert.match(readme, /actions\/workflows\/checks\.yml\/badge\.svg\?branch=main/);
  assert.match(readme, /Licensing summary:/);
});

test('package scripts and workflows protect managed notice freshness', () => {
  const packageJson = JSON.parse(read('Site/package.json'));
  assert.equal(packageJson.scripts['notices:update'], 'node scripts/update-rights-notices.mjs --write');
  assert.equal(packageJson.scripts['notices:check'], 'node scripts/update-rights-notices.mjs --check');
  assert.equal(packageJson.scripts['rights:update'], 'npm run notices:update');
  assert.equal(packageJson.scripts['rights:check'], 'npm run notices:check');

  const checks = read('.github/workflows/checks.yml');
  assert.match(checks, /npm run notices:check/);

  const annual = read('.github/workflows/update-rights-year.yml');
  assert.match(annual, /workflow_dispatch:/);
  assert.match(annual, /cron: '17 3 1 1 \*'/);
  assert.match(annual, /timezone: 'Europe\/London'/);
  assert.match(annual, /npm --prefix Site run rights:update/);
  assert.match(annual, /gh pr create/);
});
