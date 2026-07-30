import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');

async function read(relativePath) {
  return fs.readFile(path.join(repoRoot, relativePath), 'utf8');
}

const routedCreators = [
  'Vault/Templates/Lore/New Lore Entity.md',
  'Vault/Templates/Databases/New Story Entity.md',
  'Vault/Templates/Databases/New Myrkild Unit.md',
];

test('routed Templater creators never move using stale tp.file.title', async () => {
  for (const relativePath of routedCreators) {
    const source = await read(relativePath);
    assert.doesNotMatch(
      source,
      /tp\.file\.move\([^\n]*tp\.file\.title/,
      `${relativePath} must route with the prompted/rendered title rather than stale tp.file.title`,
    );
  }
});

test('Lore and Myrkild creators route with their prompted title', async () => {
  const lore = await read('Vault/Templates/Lore/New Lore Entity.md');
  const myrkild = await read('Vault/Templates/Databases/New Myrkild Unit.md');

  assert.match(lore, /tp\.file\.move\(`\$\{config\.folder\}\/\$\{title\}`\)/);
  assert.match(myrkild, /tp\.file\.move\(`\$\{folder\}\/\$\{title\}`\)/);
});

test('Story Entity routing recovers the rendered frontmatter title before moving', async () => {
  const story = await read('Vault/Templates/Databases/New Story Entity.md');

  assert.match(story, /function renderedDocumentTitle\(source\)/);
  assert.match(story, /entry\.startsWith\("title:"\)/);
  assert.match(story, /const documentTitle = renderedDocumentTitle\(rendered\)/);
  assert.match(story, /tp\.file\.move\(`\$\{targetFolder\}\/\$\{documentTitle\}`\)/);
});
