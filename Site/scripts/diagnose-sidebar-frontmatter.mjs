import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { planFolderFrontmatter } from './backfill-folder-frontmatter.mjs';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(siteRoot, '..');
const loreRoot = path.resolve(repoRoot, 'Vault/Lore');
const files = [
  'Vault/Lore/Eras/CITADEL/Factions/House of the Hollow Worm.md',
  'Vault/Lore/Eras/CITADEL/Nations/Okse Dominion.md',
  'Vault/Lore/Eras/CITADEL/Nations/Okse Dominion/Regions/Halvmaneheimr/Settlements/Valenheim.md',
];

for (const relative of files) {
  const file = path.resolve(repoRoot, relative);
  const raw = fs.readFileSync(file, 'utf8');
  const parsed = matter(raw).data;
  const plan = planFolderFrontmatter(raw, file, loreRoot);
  const close = raw.indexOf('\n---', 4);
  console.log(`\nFILE: ${relative}`);
  console.log(JSON.stringify({
    type: parsed.type,
    era: parsed.era,
    topLevelKeys: Object.keys(parsed),
    sidebarKeys: Object.keys(parsed.sidebar ?? {}),
    changes: plan.changes,
    conflicts: plan.conflicts,
    notices: plan.notices,
    closingMarkerIndex: raw.indexOf('\n---\n', 4),
    firstLooseMarkerIndex: close,
  }, null, 2));
  console.log('FRONTMATTER TAIL:');
  console.log(raw.slice(Math.max(0, close - 220), close + 10));
}
