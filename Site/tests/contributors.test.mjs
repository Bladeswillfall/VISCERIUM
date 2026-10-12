import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
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

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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
  assert.equal(githubUsernameFromUrl('https://github.com/owner/repository'), undefined);
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
  assert.doesNotMatch(first, /<rect\\b/);
  assert.doesNotMatch(first, /<script/i);
});

test('every registered contributor has a checked-in avatar file', () => {
  for (const id of [...Object.keys(contributorRegistry.profiles), 'fallback']) {
    const publicPath = contributorAssets[id] ?? '';
    assert.match(publicPath, /^\/assets\/contributors\//, `Missing avatar path for ${id}`);
    assert.ok(
      existsSync(path.join(siteRoot, 'public', publicPath.replace(/^\//, ''))),
      `Missing avatar file for ${id}: ${publicPath}`,
    );
  }
});

test('Myrkild has only its original WorldAnvil author-note credit', () => {
  const article = readFileSync(new URL('../../Vault/Lore/Myrkildicary/Myrkild.md', import.meta.url), 'utf8');
  const strip = readFileSync(new URL('../src/components/ContributorStrip.astro', import.meta.url), 'utf8');
  const schema = readFileSync(new URL('../src/content.config.ts', import.meta.url), 'utf8');
  const translation = readFileSync(new URL('../src/content/i18n/en-GB.json', import.meta.url), 'utf8');
  const header = article.slice(0, article.indexOf('\\n---\\n', 4));

  assert.ok(strip.includes("'species'"));
  assert.ok(header.includes('  - id: nimrodiallibrary\\n    role: Consultant\\n    source: worldanvil'));
  assert.equal((header.match(/^  - id:/gm) ?? []).length, 1);
  assert.doesNotMatch(header, /  - id: (?:negev1812|tulcor)/);
  assert.ok(contributorRegistry.profiles.nimrodiallibrary.url.startsWith('https://www.worldanvil.com/author/'));
  assert.equal(contributorAssets.nimrodiallibrary, '/assets/contributors/generated/nimrodiallibrary.svg');

  assert.ok(schema.includes("source: z.literal('worldanvil').optional()"));
  assert.ok(strip.includes("reference.source === 'worldanvil'"));
  assert.ok(strip.includes('contributor.legacyWorldAnvil &&'));
  assert.ok(strip.includes('class="worldanvil-source"'));
  assert.ok(translation.includes('viscerium.contributors.worldAnvilCredit'));
});

test('WorldAnvil avatars match the existing deterministic Solacon generator', () => {
  for (const [id, profile] of Object.entries(contributorRegistry.profiles)) {
    if (!profile.url.startsWith('https://www.worldanvil.com/author/')) continue;
    const asset = contributorAssets[id];
    assert.ok(asset, `Missing WorldAnvil avatar for ${id}`);
    const actual = readFileSync(path.join(siteRoot, 'public', asset.slice(1)), 'utf8');
    assert.equal(actual, generateSolaconSvg(profile.name), `Stale Solacon for ${id}`);
  }
});
