import test from 'node:test';
import assert from 'node:assert/strict';
import { validateVaultNotes } from '../scripts/validate-vault-notes.mjs';

function record(name, data = {}) {
  return {
    file: `/tmp/${name}.md`,
    relativePath: `${name}.md`,
    data: {
      status: 'published',
      title: name,
      description: 'Community validation fixture.',
      type: 'article',
      ...data,
    },
    content: 'Fixture content.',
  };
}

function validate(records) {
  const originalError = console.error;
  const originalLog = console.log;
  const errors = [];
  console.error = (...values) => errors.push(values.join(' '));
  console.log = () => {};
  try {
    return { valid: validateVaultNotes({ records }), errors };
  } finally {
    console.error = originalError;
    console.log = originalLog;
  }
}

const firstId = '11111111-1111-4111-8111-111111111111';

test('published Community pages require a stable UUIDv4 community_id', () => {
  const missing = validate([record('missing')]);
  assert.equal(missing.valid, false);
  assert.match(missing.errors.join('\n'), /missing community_id/i);

  const valid = validate([record('valid', { community_id: firstId })]);
  assert.equal(valid.valid, true);
});

test('community_id values must be valid and unique', () => {
  const invalid = validate([record('invalid', { community_id: 'broken' })]);
  assert.equal(invalid.valid, false);
  assert.match(invalid.errors.join('\n'), /Invalid community_id/);

  const duplicate = validate([
    record('first', { community_id: firstId }),
    record('second', { community_id: firstId }),
  ]);
  assert.equal(duplicate.valid, false);
  assert.match(duplicate.errors.join('\n'), /Duplicate community_id/);
});

test('Community opt-outs do not require an ID', () => {
  assert.equal(validate([record('explicit', { community: false })]).valid, true);
  assert.equal(validate([record('legacy', { giscus: false })]).valid, true);
  assert.equal(validate([record('structural', { type: 'category' })]).valid, true);
});
