import assert from 'node:assert/strict';
import test from 'node:test';
import contributorAssets from '../src/data/contributor-avatars.json' with { type: 'json' };
import contributorRegistry from '../src/data/contributors.json' with { type: 'json' };
import {
  buildRoleSegments,
  contributorSlug,
  generateSolaconSvg,
  githubUsernameFromUrl,
  normalizeRole,
  normalizeRoles,
  roleClass,
  visualRoles,
} from '../src/lib/contributors.mjs';

test('role normalization preserves display text while deduplicating comparison keys', () => {
  assert.equal(normalizeRole(' Author '), 'author');
  assert.deepEqual(normalizeRoles(['Author', ' author ', 'Research']), ['Author', 'Research']);
});

test('visual roles use fixed priority and stop at four', () => {
  assert.deepEqual(
    visualRoles(['Other', 'Research', 'Illustrator', 'Author', 'Editor']).map(({ key }) => key),
    ['author', 'editor', 'research', 'illustrator'],
  );
});

test('role segment geometry covers one through four roles', () => {
  assert.equal(buildRoleSegments([]).length, 0);
  assert.deepEqual(buildRoleSegments(['Author'])[0], {
    display: 'Author',
    key: 'author',
    index: 0,
    className: 'role-author',
    dasharray: '100 0',
    dashoffset: 0,
  });
  assert.equal(buildRoleSegments(['Author', 'Editor']).length, 2);
  assert.equal(buildRoleSegments(['Author', 'Editor', 'Research']).length, 3);
  assert.equal(buildRoleSegments(['Author', 'Editor', 'Research', 'Illustrator', 'Consultant']).length, 4);
});

test('unknown roles remain visible and use the neutral ring class', () => {
  assert.equal(roleClass('Cartographer'), 'role-other');
  assert.equal(visualRoles(['Cartographer'])[0].display, 'Cartographer');
});

test('GitHub usernames are derived only from GitHub profile URLs', () => {
  assert.equal(githubUsernameFromUrl('https://github.com/Bladeswillfall'), 'Bladeswillfall');
  assert.equal(githubUsernameFromUrl('https://www.github.com/example/'), 'example');
  assert.equal(githubUsernameFromUrl('https://example.com/Bladeswillfall'), undefined);
  assert.equal(githubUsernameFromUrl('not a url'), undefined);
});

test('contributor slugs are stable for names with punctuation and accents', () => {
  assert.equal(contributorSlug('Élias Vail'), 'elias-vail');
  assert.equal(contributorSlug('Jane Smith'), 'jane-smith');
});

test('Solacons are deterministic SVGs derived from the contributor name', () => {
  const first = generateSolaconSvg('Jane Smith');
  const second = generateSolaconSvg('Jane Smith');
  const other = generateSolaconSvg('Alex Brown');
  assert.equal(first, second);
  assert.notEqual(first, other);
  assert.match(first, /^<svg /);
  assert.match(first, /<path /);
  assert.doesNotMatch(first, /<script/i);
});

test('every registered contributor has a checked-in avatar path', () => {
  for (const id of Object.keys(contributorRegistry.profiles)) {
    assert.match(contributorAssets[id] ?? '', /^\/assets\/contributors\//, `Missing avatar path for ${id}`);
  }
  assert.match(contributorAssets.fallback, /^\/assets\/contributors\//);
});
