import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import matter from 'gray-matter';
import { stringifyGeneratedFrontmatter } from '../scripts/sync-frontmatter.mjs';

const base = {
  slug: 'fixture',
  type: 'article',
  sourcePath: 'Fixture.md',
};

test('direct sync writes Giscus policy with and without generated links', () => {
  const withoutLinks = matter(stringifyGeneratedFrontmatter('title: Without links', {
    ...base,
    giscus: false,
    links: [],
  })).data;
  const withLinks = matter(stringifyGeneratedFrontmatter('title: With links', {
    ...base,
    giscus: true,
    links: ['related/page'],
  })).data;

  assert.equal(withoutLinks.giscus, false);
  assert.equal(withoutLinks.links, undefined);
  assert.equal(withLinks.giscus, true);
  assert.deepEqual(withLinks.links, ['related/page']);
});

test('the sync pipeline uses the tested frontmatter serializer', async () => {
  const source = await readFile(new URL('../scripts/sync-public-notes.mjs', import.meta.url), 'utf8');

  assert.match(source, /import \{ stringifyGeneratedFrontmatter \} from '\.\/sync-frontmatter\.mjs';/);
  assert.match(source, /stringifyGeneratedFrontmatter\(parsed\.frontmatter/);
});
