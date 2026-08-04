import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('category generation never derives article dates from Git checkout history', async () => {
  const source = await readFile(new URL('../scripts/generate-category-pages.mjs', import.meta.url), 'utf8');

  assert.doesNotMatch(source, /gitUpdatedDates/);
  assert.doesNotMatch(source, /git\s+log/);
  assert.doesNotMatch(source, /addFrontmatterField\([^)]*['"]updated['"]/);
});
