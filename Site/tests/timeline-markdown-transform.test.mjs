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

test('transforms native Chronos fences and canonical shortcodes into Starlight MDX', async () => {
  const docsDir = await mkdtemp(path.join(os.tmpdir(), 'viscerium-chronos-transform-'));
  const sourceFile = path.join(docsDir, 'example.md');
  const outputFile = path.join(docsDir, 'example.mdx');

  try {
    await writeFile(sourceFile, `---
title: Timeline transform fixture
description: Exercises both timeline authoring paths.
---

# Fixture

[Timeline:citadel lane=category filters=false minimap=true]

\`\`\`chronos
> NOTODAY
> ORDERBY start
- [9201] First event | Detail with {braces}
@ [9201~9400] #gray CITADEL
* [9210] Point
= [9220] Marker
\`\`\`

\`\`\`js
console.log('ordinary fences remain untouched');
\`\`\`
`);

    await execFileAsync(process.execPath, ['scripts/transform-timeline-shortcodes.mjs'], {
      cwd: process.cwd(),
      env: { ...process.env, VISCERIUM_DOCS_DIR: docsDir },
    });

    assert.equal(await pathExists(sourceFile), false);
    assert.equal(await pathExists(outputFile), true);

    const output = await readFile(outputFile, 'utf8');
    assert.match(output, /timelinePage: true/);
    assert.match(output, /import TimelineEmbed from/);
    assert.match(output, /import ChronosEmbed from/);
    assert.match(output, /<TimelineEmbed timelineId="citadel" laneMode="category" showFilters=\{false\}/);
    assert.match(output, /<ChronosEmbed source=\{/);
    assert.match(output, /> NOTODAY\\n> ORDERBY start/);
    assert.match(output, /Detail with \{braces\}/);
    assert.match(output, /```js\nconsole\.log\('ordinary fences remain untouched'\);\n```/);
    assert.doesNotMatch(output, /```chronos/);
  } finally {
    await rm(docsDir, { recursive: true, force: true });
  }
});
