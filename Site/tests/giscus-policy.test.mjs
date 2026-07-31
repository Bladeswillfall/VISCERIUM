import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import matter from 'gray-matter';
import { applyGiscusPolicy } from '../scripts/apply-giscus-policy.mjs';

async function writeDoc(docsDir, relativePath, data) {
  const file = path.join(docsDir, relativePath);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, matter.stringify('Test content.\n', data), 'utf8');
  return file;
}

async function readData(file) {
  return matter(await fs.readFile(file, 'utf8')).data;
}

test('generated Giscus policy enables articles and disables structural pages', async (t) => {
  const docsDir = await fs.mkdtemp(path.join(os.tmpdir(), 'viscerium-giscus-'));
  t.after(() => fs.rm(docsDir, { recursive: true, force: true }));

  const article = await writeDoc(docsDir, 'eras/citadel/okse-dominion.md', {
    title: 'Okse Dominion',
    type: 'faction',
    slug: 'eras/citadel/okse-dominion',
  });
  const category = await writeDoc(docsDir, 'eras/citadel/factions/index.md', {
    title: 'Factions',
    type: 'category',
    slug: 'eras/citadel/factions',
  });
  const explicitOptOut = await writeDoc(docsDir, 'eras/citadel/private-commentary.md', {
    title: 'Private commentary',
    type: 'article',
    slug: 'eras/citadel/private-commentary',
    giscus: false,
  });
  const explicitOptIn = await writeDoc(docsDir, 'entities/example/index.md', {
    title: 'Example',
    type: 'continuity',
    slug: 'entities/example',
    giscus: true,
  });

  await applyGiscusPolicy({ docsDir });

  assert.equal((await readData(article)).giscus, true);
  assert.equal((await readData(category)).giscus, false);
  assert.equal((await readData(explicitOptOut)).giscus, false);
  assert.equal((await readData(explicitOptIn)).giscus, true);
});
