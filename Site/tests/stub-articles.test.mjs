import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import matter from 'gray-matter';

const repoRoot = new URL('../../', import.meta.url);

function readRepo(relativePath) {
  return fs.readFile(new URL(relativePath, repoRoot), 'utf8');
}

test('published article stubs render the contribution notice and reuse the source edit link', async () => {
  const [schema, pageTitle, editLink, translationsRaw, sampleRaw] = await Promise.all([
    readRepo('Site/src/content.config.ts'),
    readRepo('Site/src/components/CodexPageTitle.astro'),
    readRepo('Site/src/components/CodexEditLink.astro'),
    readRepo('Site/src/content/i18n/en-GB.json'),
    readRepo('Vault/Lore/Eras/CITADEL/Events/The Night of Seven Bells.md'),
  ]);
  const translations = JSON.parse(translationsRaw);
  const sample = matter(sampleRaw);

  assert.match(schema, /stub:\s*z\.boolean\(\)\.optional\(\)/);
  assert.match(pageTitle, /entry\.status === 'published' && entry\.stub === true && pageKind\.isStandardArticle/);
  assert.match(pageTitle, /aria-labelledby="codex-stub-notice-title"/);
  assert.match(pageTitle, /<CodexEditLink label=\{t\('viscerium\.article\.stubLink'\)\} \/>/);
  assert.match(editLink, /label = t\('page\.editLink'\)/);

  assert.equal(translations['viscerium.article.stubTitle'], 'This article is a stub');
  assert.equal(
    translations['viscerium.article.stubBody'],
    'It is published, but short on details. You can help expand or correct it on GitHub.',
  );
  assert.equal(translations['viscerium.article.stubLink'], 'Help improve this article');
  assert.equal(sample.data.stub, true);
});
