import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

function fixture({ title, slug, description = '', type = 'article' }) {
  return `---
title: ${JSON.stringify(title)}
description: ${JSON.stringify(description)}
status: 'published'
slug: ${slug}
type: ${type}
---

# ${title}
`;
}

test('category pages use alphabetically grouped responsive index markup', async () => {
  const docsDir = await mkdtemp(path.join(os.tmpdir(), 'viscerium-category-index-'));

  try {
    await mkdir(path.join(docsDir, 'factions', 'subgroups'), { recursive: true });
    await writeFile(
      path.join(docsDir, 'factions', 'apple.md'),
      fixture({ title: 'Apple Company', slug: 'factions/apple', description: 'An <early> faction.' }),
    );
    await writeFile(
      path.join(docsDir, 'factions', 'bastion.md'),
      fixture({ title: 'Bastion Order', slug: 'factions/bastion', type: 'faction' }),
    );
    await writeFile(
      path.join(docsDir, 'factions', 'okse.md'),
      fixture({ title: 'The Okse Dominion', slug: 'factions/okse', type: 'faction' }),
    );
    await writeFile(
      path.join(docsDir, 'factions', 'northern.md'),
      fixture({ title: 'A Northern Pact', slug: 'factions/northern' }),
    );
    await writeFile(
      path.join(docsDir, 'factions', 'eastern.md'),
      fixture({ title: 'An Eastern League', slug: 'factions/eastern' }),
    );
    await writeFile(
      path.join(docsDir, 'factions', 'third.md'),
      fixture({ title: '3rd Company', slug: 'factions/third' }),
    );
    await writeFile(
      path.join(docsDir, 'factions', 'subgroups', 'cinder.md'),
      fixture({ title: 'Cinder Cell', slug: 'factions/subgroups/cinder' }),
    );

    await execFileAsync(process.execPath, ['scripts/generate-category-pages.mjs'], {
      cwd: process.cwd(),
      env: { ...process.env, VISCERIUM_DOCS_DIR: docsDir },
    });

    const output = await readFile(path.join(docsDir, 'factions', 'index.md'), 'utf8');
    assert.match(output, /<div class="codex-alpha-index" data-index-kind="subcategories"/);
    assert.match(output, /<div class="codex-alpha-index" data-index-kind="pages"/);
    assert.match(output, /<h3 id="subcategories-s" class="codex-alpha-index__letter">S<\/h3>/);
    assert.match(output, /<span class="codex-alpha-index__meta">1 page<\/span>/);
    assert.match(output, /<span class="codex-alpha-index__meta">faction<\/span>/);
    assert.match(output, /An &lt;early&gt; faction\./);
    assert.doesNotMatch(output, /\n- \[/);

    const pages = output.slice(output.indexOf('## Pages in this category'));
    for (const letter of ['a', 'b', 'c', 'e', 'n', 'o', 'other']) {
      assert.ok(pages.includes(`id="pages-${letter}"`), `Expected ${letter.toUpperCase()} group`);
    }
    assert.doesNotMatch(pages, /id="pages-t"/);
    assert.match(pages, /id="pages-o"[\s\S]*>The Okse Dominion<\/a>/);
    assert.match(pages, /id="pages-n"[\s\S]*>A Northern Pact<\/a>/);
    assert.match(pages, /id="pages-e"[\s\S]*>An Eastern League<\/a>/);

    const positions = [
      pages.indexOf('id="pages-a"'),
      pages.indexOf('id="pages-b"'),
      pages.indexOf('id="pages-c"'),
      pages.indexOf('id="pages-e"'),
      pages.indexOf('id="pages-n"'),
      pages.indexOf('id="pages-o"'),
      pages.indexOf('id="pages-other"'),
    ];
    assert.ok(positions.every((position) => position >= 0));
    assert.deepEqual([...positions].sort((left, right) => left - right), positions);
  } finally {
    await rm(docsDir, { recursive: true, force: true });
  }
});
