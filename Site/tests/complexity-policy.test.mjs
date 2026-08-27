import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const guard = readFileSync(new URL('../scripts/check-complexity.mjs', import.meta.url), 'utf8');

test('repository baseline runs the pinned complexity guard', () => {
  assert.match(packageJson.scripts['baseline:check'], /lint:complexity/);
  assert.equal(packageJson.scripts['lint:complexity'], 'node scripts/check-complexity.mjs');
  assert.match(guard, /ESLINT_VERSION = '10\.9\.0'/);
  assert.match(guard, /MAX_COMPLEXITY = 20/);
});
