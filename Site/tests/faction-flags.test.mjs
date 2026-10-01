import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const vault = fileURLToPath(new URL('../../Vault/', import.meta.url));

const flags = [
  { article: 'Eras/NEARSIGHT/Events/Formation of ASTU.md', image: 'ASTU-flag.webp', header: true },
  { article: 'Eras/NEARSIGHT/Events/TCSC Bastion Doctrine Adopted.md', image: 'TCSC-flag.webp', header: true },
  { article: 'Eras/CITADEL/Nations/Krass Dominion/Krass Dominion.md', image: 'Krass-Dominion-flag.webp', header: true },
];

for (const { article, image, header } of flags) {
  test(`${image} is linked from its published article and present in the Vault`, () => {
    const { data } = matter(readFileSync(path.join(vault, 'Lore', article), 'utf8'));
    assert.equal(data.status, 'published');
    assert.equal(data.image, image);
    if (header) assert.equal(data.headerImage, image);
    assert.ok(data.imageTitle);
    assert.ok(data.alt);
    assert.ok(existsSync(path.join(vault, 'Assets/Images', image)), `Missing converted asset: ${image}`);
  });
}

test('NEARSIGHT links flagged ASTU and TCSC articles from its power cards', () => {
  const { data } = matter(readFileSync(path.join(vault, 'Lore/Eras/NEARSIGHT.md'), 'utf8'));
  assert.equal(
    data.eraPrimer.powers.find((entry) => entry.title === 'Allied Special Tactics Union')?.href,
    '/eras/nearsight/events/formation-of-astu/',
  );
  assert.equal(
    data.eraPrimer.powers.find((entry) => entry.title === 'Trans-Continental Socialist Confederation')?.href,
    '/eras/nearsight/events/tcsc-bastion-doctrine-adopted/',
  );
  const startHere = readFileSync(new URL('../src/components/start-here/StartHerePrimer.astro', import.meta.url), 'utf8');
  assert.match(startHere, /const krassFlag = '\/assets\/images\/Krass-Dominion-flag\.webp'/);
});
