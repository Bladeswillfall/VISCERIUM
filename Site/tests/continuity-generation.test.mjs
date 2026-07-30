import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import matter from 'gray-matter';

test('published era editions generate one neutral continuity hub and switcher metadata', async () => {
  const docsDir = await fs.mkdtemp(path.join(os.tmpdir(), 'viscerium-continuity-'));
  const originalDocsDir = process.env.VISCERIUM_DOCS_DIR;

  try {
    const citadel = path.join(docsDir, 'eras/citadel/fauna/cow.md');
    const smog = path.join(docsDir, 'eras/smog/fauna/cow.md');
    await fs.mkdir(path.dirname(citadel), { recursive: true });
    await fs.mkdir(path.dirname(smog), { recursive: true });

    await fs.writeFile(citadel, matter.stringify('CITADEL cow body.\n', {
      title: 'Cow',
      description: 'A CITADEL-era livestock description.',
      status: 'published',
      type: 'fauna',
      slug: 'eras/citadel/fauna/cow',
      entity_id: 'cow',
      era: 'CITADEL',
      tags: ['livestock'],
    }));
    await fs.writeFile(smog, matter.stringify('SMOG cow body.\n', {
      title: 'Cow',
      description: 'A SMOG-era livestock description.',
      status: 'published',
      type: 'fauna',
      slug: 'eras/smog/fauna/cow',
      entity_id: 'cow',
      era: 'SMOG',
      tags: ['livestock'],
    }));

    process.env.VISCERIUM_DOCS_DIR = docsDir;
    await import(`../scripts/generate-continuity-pages.mjs?fixture=${Date.now()}`);

    const citadelAfter = matter(await fs.readFile(citadel, 'utf8')).data;
    const smogAfter = matter(await fs.readFile(smog, 'utf8')).data;
    const hubFile = path.join(docsDir, 'entities/cow/index.md');
    const hub = matter(await fs.readFile(hubFile, 'utf8'));

    assert.equal(citadelAfter.continuity.hub, '/entities/cow/');
    assert.equal(citadelAfter.continuity.editions.CITADEL, '/eras/citadel/fauna/cow/');
    assert.equal(citadelAfter.continuity.editions.SMOG, '/eras/smog/fauna/cow/');
    assert.deepEqual(citadelAfter.continuity, smogAfter.continuity);

    assert.equal(hub.data.type, 'continuity');
    assert.equal(hub.data.entity_id, 'cow');
    assert.equal(hub.data.continuity.hub, '/entities/cow/');
    assert.match(hub.content, /Open Cow in CITADEL/);
    assert.match(hub.content, /Open Cow in SMOG/);
  } finally {
    if (originalDocsDir === undefined) delete process.env.VISCERIUM_DOCS_DIR;
    else process.env.VISCERIUM_DOCS_DIR = originalDocsDir;
    await fs.rm(docsDir, { recursive: true, force: true });
  }
});
