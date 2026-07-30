import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile, access } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

async function pathExists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

test('transforms a canonical era primer shortcode into Starlight MDX', async () => {
  const docsDir = await mkdtemp(path.join(os.tmpdir(), 'viscerium-era-primer-transform-'));
  const sourceFile = path.join(docsDir, 'citadel.md');
  const outputFile = path.join(docsDir, 'citadel.mdx');

  try {
    await writeFile(sourceFile, `---
title: CITADEL
description: Fixture
---

[EraPrimer:citadel]

After primer.
`);

    await execFileAsync(process.execPath, ['scripts/transform-era-primer-shortcodes.mjs'], {
      cwd: process.cwd(),
      env: { ...process.env, VISCERIUM_DOCS_DIR: docsDir },
    });

    assert.equal(await pathExists(sourceFile), false);
    assert.equal(await pathExists(outputFile), true);

    const output = await readFile(outputFile, 'utf8');
    assert.match(output, /import EraPrimer from/);
    assert.match(output, /<EraPrimer eraId="citadel" \/>/);
    assert.match(output, /After primer\./);
    assert.doesNotMatch(output, /\[EraPrimer:citadel\]/);
  } finally {
    await rm(docsDir, { recursive: true, force: true });
  }
});
