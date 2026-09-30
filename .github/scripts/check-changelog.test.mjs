import test from 'node:test';
import assert from 'node:assert/strict';
import { validate } from './check-changelog.mjs';

const before = '# Changelog\n\n## [Unreleased]\n\n## [0.2.0] - 2026-07-10\n\n### Added in 0.2.0\n\n- Earlier feature.\n';
const base = { before, after: before, changedFiles: ['Site/src/components/Home.astro'], author: 'contributor', body: '' };

// A new note must be a real entry, not a whitespace edit or a change to released history.
test('accepts a new Unreleased entry', () => {
  assert.equal(validate({ ...base, after: before.replace('## [0.2.0]', '### Added in Unreleased\n\n- New homepage feature.\n\n## [0.2.0]') }), null);
});

test('rejects changes to previous releases without an Unreleased entry', () => {
  assert.match(validate({ ...base, after: before.replace('Earlier feature.', 'Renamed old feature.') }), /Add a new entry/);
});

test('accepts publication of a new dated version', () => {
  const after = before.replace('## [Unreleased]\n\n', '## [0.3.0] - 2026-09-30\n\n### Fixed in 0.3.0\n\n- Fixed navigation.\n\n');
  assert.equal(validate({ ...base, after }), null);
});

test('accepts promotion of Unreleased entries to a dated release', () => {
  const draft = before.replace('## [0.2.0]', '### Fixed in Unreleased\n\n- Fixed navigation.\n\n## [0.2.0]');
  assert.equal(validate({ ...base, before: draft, after: draft.replace('## [Unreleased]', '## [0.3.0] - 2026-09-30') }), null);
});

test('rejects Notes-only and whitespace edits', () => {
  assert.match(validate({ ...base, after: before + '\n' }), /Add a new entry/);
  const notes = before.replace('## [0.2.0]', '### Notes\n\n- Internal note.\n\n## [0.2.0]');
  assert.match(validate({ ...base, after: notes }), /Add a new entry/);
});

test('accepts a specific checked skip reason in the PR Changelog section', () => {
  assert.equal(validate({ ...base, body: '## Changelog\n\n- [x] No entry needed: Internal test maintenance with no public changes.\n\n## Risks' }), null);
});

test('rejects unchecked, placeholder, short, or unrelated skip claims', () => {
  for (const body of [
    '## Changelog\n- [ ] No entry needed: Internal test maintenance with no public changes.',
    '## Changelog\n- [x] No entry needed: (replace with a specific reason)',
    '## Changelog\n- [x] No entry needed: no',
    '## Summary\n- [x] No entry needed: Internal test maintenance with no public changes.',
  ]) assert.match(validate({ ...base, body }), /Add a new entry/);
});

test('exempts routine dependency-only Dependabot PRs', () => {
  assert.equal(validate({ ...base, author: 'dependabot[bot]', changedFiles: ['Site/package.json', 'Site/package-lock.json'] }), null);
  assert.equal(validate({ ...base, author: 'dependabot[bot]', changedFiles: ['.github/workflows/checks.yml'] }), null);
});

test('still checks Dependabot PRs touching non-dependency files', () => {
  assert.match(validate({ ...base, author: 'dependabot[bot]', changedFiles: ['Site/package-lock.json', 'Site/src/components/Home.astro'] }), /Add a new entry/);
});
