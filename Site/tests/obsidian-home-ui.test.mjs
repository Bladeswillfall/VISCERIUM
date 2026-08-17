import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');
const vaultRoot = path.join(repoRoot, 'Vault');

async function readText(relativePath) {
  return fs.readFile(path.join(vaultRoot, relativePath), 'utf8');
}

async function readJson(relativePath) {
  return JSON.parse(await readText(relativePath));
}

function quoteDepth(line) {
  const prefix = line.match(/^(?:>\s*)+/)?.[0] ?? '';
  return [...prefix].filter((character) => character === '>').length;
}

test('Iconic owns explorer folder icons without a competing CSS layer', async () => {
  const communityPlugins = await readJson('.obsidian/community-plugins.json');
  const appearance = await readJson('.obsidian/appearance.json');
  const iconic = await readJson('.obsidian/plugins/iconic/data.json');

  assert.ok(communityPlugins.includes('iconic'));
  assert.ok(!communityPlugins.includes('obsidian-icon-folder'));
  assert.equal(iconic.showAllFolderIcons, true);
  assert.ok(!appearance.enabledCssSnippets.includes('Folder icons'));
  await assert.rejects(fs.access(path.join(vaultRoot, '.obsidian/snippets/Folder icons.css')));
});

test('Home keeps DataviewJS lines at the code fence quote depth', async () => {
  const home = await readText('Home.md');
  const lines = home.split(/\r?\n/);
  let blocks = 0;

  for (let index = 0; index < lines.length; index += 1) {
    if (!/^(?:>\s*)+```dataviewjs\s*$/.test(lines[index])) continue;
    blocks += 1;
    const depth = quoteDepth(lines[index]);
    let cursor = index + 1;
    for (; cursor < lines.length; cursor += 1) {
      if (quoteDepth(lines[cursor]) === depth && lines[cursor].trimEnd().endsWith('```')) break;
      assert.equal(quoteDepth(lines[cursor]), depth, `DataviewJS line ${cursor + 1} changed callout quote depth`);
    }
    assert.ok(cursor < lines.length, `DataviewJS block starting at line ${index + 1} is not closed`);
    index = cursor;
  }

  assert.ok(blocks >= 5, 'Home should retain its compact interactive dashboard widgets');
});

test('Home composes the modular creator views in the approved hierarchy', async () => {
  const home = await readText('Home.md');
  const sections = [
    ['[!home-hero]', 'System/Views/Home/Hero'],
    ['[!home-continue] Continue working', 'System/Views/Home/Continue'],
    ['[!home-attention] Needs attention', 'System/Views/Home/Attention'],
    ['[!home-secondary]', null],
    ['[!home-chronicle] Chronicle', 'System/Views/Home/Chronicle'],
    ['[!home-activity] Progress', 'System/Views/Home/Activity'],
    ['[!home-navigate] Navigate', 'System/Views/Home/Navigate'],
  ];

  let previousIndex = -1;
  for (const [marker, viewPath] of sections) {
    const index = home.indexOf(marker);
    assert.ok(index > previousIndex, `${marker} should follow the previous Home section`);
    previousIndex = index;
    if (viewPath) {
      assert.match(home, new RegExp(`await dv\\.view\\(\"${viewPath.replaceAll('/', '\\/')}\"\\)`));
    }
  }

  assert.doesNotMatch(home, /dv\.current\(\)\.file/);
  assert.doesNotMatch(home, /home-workspace|home-side|home-writing|home-create/);
});

test('File explorer owns Home placement and keeps it card-free', async () => {
  const css = await readText('.obsidian/snippets/File explorer.css');

  assert.match(css, /data-path="Home\.md"/);
  assert.match(css, /order:\s*-10000\s*!important/);
  assert.match(css, /Home is the first route/);
  assert.match(css, /border:\s*0/);
  assert.match(css, /background:\s*transparent/);
});
