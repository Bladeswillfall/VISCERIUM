import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const migrationScript = path.join(siteRoot, 'scripts/migrate-sidebar-wikilinks.mjs');
const sidebarComponent = path.join(siteRoot, 'src/components/CodexPageSidebar.astro');

test('checked-in Lore sidebars have no remaining resolvable migration work', () => {
  const output = execFileSync(process.execPath, [migrationScript], {
    cwd: siteRoot,
    encoding: 'utf8',
  });

  assert.match(output, /No sidebar article references require migration\./);
});

test('the public sidebar resolves authored Obsidian wikilinks through the docs collection', async () => {
  const source = await fs.readFile(sidebarComponent, 'utf8');

  assert.match(source, /getCollection\('docs'\)/);
  assert.match(source, /function resolveSidebarTarget\(rawTarget\)/);
  assert.match(source, /const wikilink = trimmed\.match/);
  assert.match(source, /sameEra\.length === 1/);
});

test('the migration strips serializer delimiters without truncating later frontmatter', async () => {
  const source = await fs.readFile(migrationScript, 'utf8');

  assert.match(source, /const bodyEnd = serialized\.lastIndexOf\('\\n---'\)/);
  assert.match(source, /serialized\.slice\(4, bodyEnd\)\.trimEnd\(\)/);
  assert.doesNotMatch(source, /replace\(\/\\n---\\n\?\$\//);
});
