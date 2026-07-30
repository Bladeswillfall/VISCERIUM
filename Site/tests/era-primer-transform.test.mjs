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

test('transforms a Vault-owned era primer shortcode into Starlight MDX', async () => {
  const docsDir = await mkdtemp(path.join(os.tmpdir(), 'viscerium-era-primer-transform-'));
  const sourceFile = path.join(docsDir, 'citadel.md');
  const outputFile = path.join(docsDir, 'citadel.mdx');

  try {
    await writeFile(sourceFile, `---
title: CITADEL
description: Fixture
eraPrimer:
  id: citadel
  number: Era I
  title: CITADEL
  tagline: Fixture tagline
  lead: Source-owned lead
  traits: []
  map:
    src: /fixture.webp
    alt: Fixture map
    href: /maps/fixture/
    eyebrow: Fixture
    label: Fixture map
    action: Open map
  worldNow:
    eyebrow: World now
    title: Fixture world
    body: Source-owned body
  essentials: []
  terms: []
  powersIntro: Fixture powers
  powers: []
  knowledge: []
  record:
    eyebrow: Record
    title: Fixture record
    body: Fixture body
    eventsHref: /events/
    nextEraHref: /next/
    nextEraLabel: Next era
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
    assert.match(output, /<EraPrimer primer=\{\{"id":"citadel"/);
    assert.match(output, /"lead":"Source-owned lead"/);
    assert.match(output, /After primer\./);
    assert.doesNotMatch(output, /\[EraPrimer:citadel\]/);
    assert.doesNotMatch(output, /^eraPrimer:/m);
  } finally {
    await rm(docsDir, { recursive: true, force: true });
  }
});
