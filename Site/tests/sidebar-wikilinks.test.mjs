import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { parseSidebarWikilink } from '../src/lib/sidebar-links.mjs';
import { sidebarMigrationCandidates } from '../scripts/migrate-sidebar-wikilinks.mjs';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const migrationScript = path.join(siteRoot, 'scripts/migrate-sidebar-wikilinks.mjs');
const sidebarComponent = path.join(siteRoot, 'src/components/CodexPageSidebar.astro');

test('checked-in Lore sidebars have no remaining resolvable migration work', () => {
  assert.deepEqual(sidebarMigrationCandidates, []);
});

test('sidebar wikilinks preserve heading fragments', () => {
  assert.deepEqual(
    parseSidebarWikilink('[[Calendar/Okse#solmanuthur-16|Solmanuthur 16]]'),
    { target: 'Calendar/Okse', fragment: '#solmanuthur-16' },
  );
  assert.deepEqual(
    parseSidebarWikilink('[[Calendar/Okse#solmanuthur-16]]'),
    { target: 'Calendar/Okse', fragment: '#solmanuthur-16' },
  );
  assert.deepEqual(
    parseSidebarWikilink('[[Okse Dominion]]'),
    { target: 'Okse Dominion', fragment: '' },
  );
  assert.equal(parseSidebarWikilink('/calendar/okse/'), null);
});

test('the public sidebar resolves authored Obsidian wikilinks through the docs collection', async () => {
  const source = await fs.readFile(sidebarComponent, 'utf8');

  assert.match(source, /getCollection\('docs'\)/);
  assert.match(source, /function resolveSidebarTarget\(rawTarget\)/);
  assert.match(source, /parseSidebarWikilink\(trimmed\)/);
  assert.match(source, /`\$\{route\}\$\{wikilink\.fragment\}`/);
  assert.match(source, /sameEra\.length === 1/);
});

test('the migration strips serializer delimiters without truncating later frontmatter', async () => {
  const source = await fs.readFile(migrationScript, 'utf8');

  assert.match(source, /const bodyEnd = serialized\.lastIndexOf\('\\n---'\)/);
  assert.match(source, /serialized\.slice\(4, bodyEnd\)\.trimEnd\(\)/);
  assert.doesNotMatch(source, /replace\(\/\\n---\\n\?\$\//);
});
