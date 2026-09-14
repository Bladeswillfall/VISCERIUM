import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import matter from 'gray-matter';

test('the public Git index contains no private vault content or unpublished Lore', () => {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const files = execFileSync('git', ['ls-files', '-z', '--', 'Vault'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
  for (const file of files) {
    assert.doesNotMatch(file, /^Vault\/(?:Drafts|Private|Stories|Archive|\.trash|Assets\/Unpublished|System\/Imports)\//, file);
    if (file.startsWith('Vault/Lore/') && /\.mdx?$/.test(file)) {
      assert.equal(matter(readFileSync(path.join(root, file), 'utf8')).data.status, 'published', `${file} belongs in Workshop until published`);
    }
  }
});
