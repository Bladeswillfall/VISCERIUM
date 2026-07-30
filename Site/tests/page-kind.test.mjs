import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyCodexPage } from '../src/lib/page-kind.mjs';

test('standard lore entries retain article presentation', () => {
  const result = classifyCodexPage({ type: 'faction', slug: 'eras/citadel/okse-dominion' });
  assert.equal(result.isStandardArticle, true);
  assert.equal(result.isStructural, false);
  assert.equal(result.isHomepage, false);
  assert.equal(result.isEraHomepage, false);
});

test('site landing pages are structural rather than standard articles', () => {
  const splash = classifyCodexPage({ template: 'splash' }, 'index');
  assert.equal(splash.slug, '');
  assert.equal(splash.isHomepage, true);
  assert.equal(splash.isStructural, true);
  assert.equal(splash.isStandardArticle, false);

  const rootIndex = classifyCodexPage({}, 'index');
  assert.equal(rootIndex.slug, '');
  assert.equal(rootIndex.isHomepage, true);
  assert.equal(rootIndex.isStructural, true);
  assert.equal(rootIndex.isStandardArticle, false);
});

test('era homepages are structural regardless of exact route source', () => {
  const result = classifyCodexPage({ type: 'era', slug: 'eras/citadel' });
  assert.equal(result.isStandardArticle, false);
  assert.equal(result.isStructural, true);
  assert.equal(result.isHomepage, false);
  assert.equal(result.isEraHomepage, true);
});

test('category, Start Here and composed utility pages are structural', () => {
  assert.equal(classifyCodexPage({ type: 'category', slug: 'eras/citadel/events' }).isStructural, true);
  assert.equal(classifyCodexPage({ type: 'article', slug: 'start-here' }).isStructural, true);
  assert.equal(classifyCodexPage({ type: 'calendar', slug: 'calendar' }).isStructural, true);
  assert.equal(classifyCodexPage({ type: 'timeline', slug: 'eras/citadel/timeline' }).isStructural, true);
  assert.equal(classifyCodexPage({ type: 'article', slug: 'custom', explorationPage: true }).isStructural, true);
  assert.equal(classifyCodexPage({ type: 'article', slug: 'timeline', timelinePage: true }).isStructural, true);
});
