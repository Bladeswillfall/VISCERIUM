import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  buildReferencedInIndex,
  extractInternalRoutes,
} from '../scripts/generate-referenced-in.mjs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('internal article links are indexed while embeds, external links, comments and code examples are ignored', () => {
  const routes = extractInternalRoutes(`
[Errack](/degel-system/errack/)
[Errack again](/degel-system/errack/#tides)
![Errack artwork](/assets/images/errack.webp)
[External](https://example.com/errack)
<!-- [Commented reference](/hidden-comment/) -->
\`[Not prose](/hidden/)\`
\`\`\`
[Also not prose](/hidden-two/)
\`\`\`
`);

  assert.deepEqual(routes, ['/degel-system/errack/']);
});

test('referenced-in records are automatic, source-deduplicated and exclude generated navigation pages', () => {
  const records = [
    {
      slug: 'eras/citadel/okse-dominion',
      route: '/eras/citadel/okse-dominion/',
      data: { title: 'Okse Dominion', type: 'faction', era: 'CITADEL', sourcePath: 'Eras/CITADEL/Factions/Okse Dominion.md' },
      content: '[Errack](/degel-system/errack/) and [Errack again](/degel-system/errack/).',
    },
    {
      slug: 'categories/locations',
      route: '/categories/locations/',
      data: { title: 'Locations', type: 'category' },
      content: '[Errack](/degel-system/errack/)',
    },
    {
      slug: 'degel-system/errack',
      route: '/degel-system/errack/',
      data: { title: 'Errack', type: 'location', era: 'Universal', sourcePath: 'Degel System/Errack.md' },
      content: '',
    },
  ];

  const references = buildReferencedInIndex(records).get('/degel-system/errack/');
  assert.deepEqual(references, [{
    title: 'Okse Dominion',
    href: '/eras/citadel/okse-dominion/',
    type: 'faction',
    era: 'CITADEL',
  }]);
});

test('reference indexing runs before generated navigation is appended', () => {
  const pipeline = read('../scripts/build-content.mjs');
  const referencedInIndex = pipeline.indexOf('await generateReferencedIn();');
  const continuityIndex = pipeline.indexOf("await import('./generate-continuity-pages.mjs');");
  const categoryIndex = pipeline.indexOf("await import('./generate-category-pages.mjs');");

  assert.ok(referencedInIndex >= 0, 'Referenced in generator must run');
  assert.ok(referencedInIndex < continuityIndex, 'Referenced in must run before continuity navigation generation');
  assert.ok(referencedInIndex < categoryIndex, 'Referenced in must run before category navigation generation');
});

test('Referenced in is placed before contributors and uses the marginal index treatment', () => {
  const footer = read('../src/components/StarlightFooter.astro');
  const component = read('../src/components/ReferencedIn.astro');
  const schema = read('../src/content.config.ts');

  assert.ok(footer.indexOf('<ReferencedIn />') < footer.indexOf('<ContributorStrip />'));
  assert.match(component, /codex-referenced-in-bracket-label/);
  assert.match(component, /t\('viscerium\.references\.index'\)/);
  assert.match(component, /codex-referenced-in-groups/);
  assert.match(component, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(schema, /referencedIn: z\.array\(referencedInSchema\)\.optional\(\)/);
});
