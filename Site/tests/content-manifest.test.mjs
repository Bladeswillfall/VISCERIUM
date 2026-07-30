import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { scanMarkdownContent } from '../scripts/content-manifest.mjs';

function note(title) {
  return `---\ntitle: ${title}\ndescription: Test note\n---\n\n# ${title}\n`;
}

test('content manifests cache parsed markdown until explicitly refreshed', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'viscerium-content-manifest-'));
  const file = path.join(root, 'entry.md');

  try {
    await writeFile(file, note('First'), 'utf8');
    const first = await scanMarkdownContent(root, { refresh: true });
    assert.equal(first.records.length, 1);
    assert.equal(first.records[0].data.title, 'First');

    await writeFile(file, note('Second'), 'utf8');
    const cached = await scanMarkdownContent(root);
    assert.equal(cached, first);
    assert.equal(cached.records[0].data.title, 'First');

    const refreshed = await scanMarkdownContent(root, { refresh: true });
    assert.notEqual(refreshed, first);
    assert.equal(refreshed.records[0].data.title, 'Second');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
