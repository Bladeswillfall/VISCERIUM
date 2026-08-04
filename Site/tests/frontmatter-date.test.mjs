import test from 'node:test';
import assert from 'node:assert/strict';
import { frontmatterDate } from '../src/lib/frontmatter-date.mjs';

test('blank and null frontmatter dates remain missing', () => {
  assert.equal(frontmatterDate.parse(undefined), undefined);
  assert.equal(frontmatterDate.parse(null), undefined);
  assert.equal(frontmatterDate.parse(''), undefined);
  assert.equal(frontmatterDate.parse('   '), undefined);
});

test('authored frontmatter dates are still coerced to Date values', () => {
  assert.equal(
    frontmatterDate.parse('2026-08-03').toISOString(),
    '2026-08-03T00:00:00.000Z',
  );
});
