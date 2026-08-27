import test from 'node:test';
import assert from 'node:assert/strict';
import { ASTRO_COMPLEXITY_DEBT, COMPLEXITY_BASELINE } from '../scripts/complexity-baseline.mjs';

test('complexity debt stays explicit and sorted by file', () => {
  const files = COMPLEXITY_BASELINE.map((entry) => entry.file);
  assert.deepEqual(files, [...files].sort());
  assert.deepEqual(ASTRO_COMPLEXITY_DEBT, [
    { file: 'Site/src/components/IonSidebarSublist.astro', score: 23 },
  ]);
});
