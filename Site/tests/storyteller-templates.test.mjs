import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const vaultRoot = path.resolve(here, '../../Vault');
const start = '<!-- viscerium:storyteller:start -->';
const end = '<!-- viscerium:storyteller:end -->';

const templates = [
  'Templates/Lore/Article Template.md',
  'Templates/Lore/Character Template.md',
  'Templates/Lore/Faction Template.md',
  'Templates/Lore/Location Template.md',
  'Templates/Lore/Event Template.md',
  'Templates/Lore/Species Template.md',
  'Templates/Lore/Item Template.md',
  'Templates/Lore/Calendar Template.md',
  'Templates/Lore/Era Template.md',
  'Templates/Publishing/Map Template.md',
  'Templates/Publishing/Image Metadata Template.md',
  'Templates/Timelines/Timeline Template.md',
  'Templates/Timelines/Chronos Timeline Template.md',
  'Templates/Databases/Myrkild Unit Profile.md',
];

const dynamicArticleGenerators = [
  'Templates/Lore/New Lore Entity.md',
  'Templates/_Internals/Story Entity Core.md',
  'Templates/Databases/New Myrkild Unit.md',
];

test('every static article template contains one ordered Storyteller boundary pair', async () => {
  for (const relativePath of templates) {
    const source = await fs.readFile(path.join(vaultRoot, relativePath), 'utf8');
    assert.equal(source.split(start).length - 1, 1, `${relativePath} start marker`);
    assert.equal(source.split(end).length - 1, 1, `${relativePath} end marker`);
    assert.ok(source.indexOf(start) < source.indexOf(end), `${relativePath} marker order`);
    assert.match(source.slice(source.indexOf(start), source.indexOf(end)), /^## Storyteller View$/m);
  }
});

test('every dynamic article generator emits the marked Storyteller footer', async () => {
  for (const relativePath of dynamicArticleGenerators) {
    const source = await fs.readFile(path.join(vaultRoot, relativePath), 'utf8');
    assert.equal(source.split(start).length - 1, 1, `${relativePath} start marker constant`);
    assert.equal(source.split(end).length - 1, 1, `${relativePath} end marker constant`);
    assert.match(source, /"## Storyteller View"/, `${relativePath} should emit the foldable heading`);
    assert.match(source, /STORYTELLER_START/);
    assert.match(source, /STORYTELLER_END/);
  }
});
