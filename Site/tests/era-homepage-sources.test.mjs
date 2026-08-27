import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import matter from 'gray-matter';
import { validateEraPrimerData } from '../src/lib/era-primer-data.mjs';

const eras = [
  ['CITADEL', 'citadel'],
  ['SMOG', 'smog'],
  ['NEARSIGHT', 'nearsight'],
  ['ENTROPY', 'entropy'],
];

for (const [sourceName, eraId] of eras) {
  test(`${sourceName} owns a valid era homepage primer`, () => {
    const source = readFileSync(
      new URL(`../../Vault/Lore/Eras/${sourceName}.md`, import.meta.url),
      'utf8',
    );
    const parsed = matter(source);

    assert.equal(parsed.data.type, 'era');
    assert.equal(parsed.data.eraId, eraId);
    assert.equal(parsed.data.giscus, false);
    assert.deepEqual(validateEraPrimerData(parsed.data.eraPrimer, eraId), []);
    assert.match(parsed.data.eraPrimer.map.href, /^\/maps\/(?:[^/?#]+\/)?$/);
    assert.match(parsed.content, new RegExp(`^\\[EraPrimer:${eraId}\\]$`, 'm'));
    assert.match(parsed.content, new RegExp(`^\\[Timeline:${eraId}\\]$`, 'm'));
    assert.ok(
      parsed.content.indexOf(`[EraPrimer:${eraId}]`) < parsed.content.indexOf(`[Timeline:${eraId}]`),
      'The primer must remain above the timeline.',
    );
  });
}

test('CITADEL homepage links to its canonical Atlas map rather than the WorldAnvil or demo map', () => {
  const eraSource = matter(readFileSync(
    new URL('../../Vault/Lore/Eras/CITADEL.md', import.meta.url),
    'utf8',
  ));
  const mapSource = matter(readFileSync(
    new URL('../../Vault/Lore/Eras/CITADEL/Errack CITADEL Map.md', import.meta.url),
    'utf8',
  ));
  const markerSource = JSON.parse(readFileSync(
    new URL('../../Vault/Assets/Maps/Errack-CITADEL.canonical.markers.json', import.meta.url),
    'utf8',
  ));

  assert.equal(mapSource.data.status, 'published');
  assert.equal(mapSource.data.type, 'map');
  assert.equal(mapSource.data.era, 'CITADEL');
  assert.equal(mapSource.data.mapId, 'errack-citadel');
  assert.equal(mapSource.data.image, '/assets/maps/Errack-CITADEL.webp');
  assert.equal(mapSource.data.mapMarkers, 'Assets/Maps/Errack-CITADEL.canonical.markers.json');
  assert.equal(eraSource.data.eraPrimer.map.href, `/maps/${mapSource.data.mapId}/`);
  assert.deepEqual(markerSource.markers, []);
});

test('CITADEL power cards point at published canonical nation pages', () => {
  const eraSource = matter(readFileSync(
    new URL('../../Vault/Lore/Eras/CITADEL.md', import.meta.url),
    'utf8',
  ));
  const expected = [
    ['Okse Dominion', '/eras/citadel/nations/okse-dominion/', 'CITADEL/Nations/Okse Dominion/Okse Dominion.md'],
    ['Krass Dominion', '/eras/citadel/nations/krass-dominion/', 'CITADEL/Nations/Krass Dominion/Krass Dominion.md'],
    ['Republic of Askalia', '/eras/citadel/nations/republic-of-askalia/', 'CITADEL/Nations/Republic of Askalia/Republic of Askalia.md'],
    ['Kingdom of Satol', '/eras/citadel/nations/kingdom-of-satol/', 'CITADEL/Nations/Kingdom of Satol/Kingdom of Satol.md'],
  ];

  for (const [title, href, sourcePath] of expected) {
    const power = eraSource.data.eraPrimer.powers.find((item) => item.title === title);
    assert.equal(power?.href, href);

    const nationSource = matter(readFileSync(
      new URL(`../../Vault/Lore/Eras/${sourcePath}`, import.meta.url),
      'utf8',
    ));
    assert.equal(nationSource.data.status, 'published', `${title} must exist as a public page`);
  }
});
