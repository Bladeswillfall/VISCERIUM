import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  buildReferenceIndexes,
  buildReferencedInIndex,
} from '../scripts/generate-referenced-in.mjs';
import { extractInternalRoutes } from '../src/lib/codex-paths.mjs';

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

test('comment stripping removes tokens reconstructed across an earlier boundary', () => {
  const routes = extractInternalRoutes(`
A<!<!-- hidden -->-- [Hidden](/hidden/) -->B
[Visible](/visible/)
`);

  assert.deepEqual(routes, ['/visible/']);
});

test('reference records are automatic, bidirectional, deduplicated and exclude generated navigation pages', () => {
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

  const { inbound, outbound } = buildReferenceIndexes(records);
  const references = inbound.get('/degel-system/errack/');
  assert.deepEqual(references, [{
    title: 'Okse Dominion',
    href: '/eras/citadel/okse-dominion/',
    type: 'faction',
    era: 'CITADEL',
  }]);

  assert.deepEqual(outbound.get('/eras/citadel/okse-dominion/'), [{
    title: 'Errack',
    href: '/degel-system/errack/',
    type: 'location',
    era: 'Universal',
  }]);
  assert.equal(outbound.has('/categories/locations/'), false);

  // Preserve the old helper for callers that only need inbound references.
  assert.deepEqual(buildReferencedInIndex(records).get('/degel-system/errack/'), references);
});

test('reference indexing runs before generated navigation is appended', () => {
  const pipeline = read('../scripts/build-content.mjs');
  const referencedInIndex = pipeline.indexOf('await generateReferencedIn();');
  const continuityIndex = pipeline.indexOf("await import('./generate-continuity-pages.mjs');");
  const categoryIndex = pipeline.indexOf("await import('./generate-category-pages.mjs');");

  assert.ok(referencedInIndex >= 0, 'Reference generator must run');
  assert.ok(referencedInIndex < continuityIndex, 'Reference indexing must run before continuity navigation generation');
  assert.ok(referencedInIndex < categoryIndex, 'Reference indexing must run before category navigation generation');
});

test('bidirectional references are placed before contributors inside one marginal Index treatment', () => {
  const footer = read('../src/components/StarlightFooter.astro');
  const component = read('../src/components/ReferencedIn.astro');
  const schema = read('../src/content.config.ts');

  assert.ok(footer.indexOf('<ReferencedIn />') < footer.indexOf('<ContributorStrip />'));
  assert.match(component, /codex-referenced-in-bracket-label/);
  assert.match(component, /t\('viscerium\.references\.index'\)/);
  assert.match(component, /title: 'Referenced by'/);
  assert.match(component, /title: 'References'/);
  assert.match(component, /codex-reference-relation \+ \.codex-reference-relation/);
  assert.match(component, /codex-referenced-in-groups/);
  assert.match(component, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(schema, /referencedIn: z\.array\(referencedInSchema\)\.optional\(\)/);
  assert.match(schema, /references: z\.array\(referencedInSchema\)\.optional\(\)/);
});
