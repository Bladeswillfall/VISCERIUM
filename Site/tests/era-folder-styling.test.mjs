import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

const representativePages = {
  CITADEL: {
    source: '../../Vault/Lore/Eras/CITADEL/Events/The Galdyr Compact.md',
    generated: '../src/content/docs/eras/citadel/events/the-galdyr-compact.md',
    style: 'e1',
  },
  SMOG: {
    source: '../../Vault/Lore/Eras/SMOG/Events/The Grey Armistice.md',
    generated: '../src/content/docs/eras/smog/events/the-grey-armistice.md',
    style: 'e2',
  },
  NEARSIGHT: {
    source: '../../Vault/Lore/Eras/NEARSIGHT/Events/Formation of ASTU.md',
    generated: '../src/content/docs/eras/nearsight/events/formation-of-astu.md',
    style: 'e3',
  },
  ENTROPY: {
    source: '../../Vault/Lore/Eras/ENTROPY/Events/The Pathfinder Exodus.md',
    generated: '../src/content/docs/eras/entropy/events/the-pathfinder-exodus.md',
    style: 'e4',
  },
};

test('eraStyle stays out of authored Obsidian frontmatter and appears in generated site frontmatter', () => {
  for (const [era, { source, generated, style }] of Object.entries(representativePages)) {
    const sourceNote = read(source);
    const generatedPage = read(generated);
    const sourceFrontmatter = sourceNote.split('\n---', 1)[0];

    assert.doesNotMatch(sourceFrontmatter, /^eraStyle:/m, `${era} Vault source should not require presentation metadata`);
    assert.match(generatedPage, new RegExp(`era:\\s*${era}`), `${era} page should retain its inferred era`);
    assert.match(generatedPage, new RegExp(`eraStyle:\\s*${style}`), `${era} page should publish ${style}`);
    assert.match(generatedPage, new RegExp(`sourcePath:\\s*['"]?Eras/${era}/`), `${era} page should originate in the matching Vault folder`);
  }
});
