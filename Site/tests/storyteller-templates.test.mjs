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
  'Templates/Lore/Culture Template.md',
  'Templates/Lore/Belief and Religion Template.md',
  'Templates/Lore/Naming Language Template.md',
  'Templates/Lore/Resonance Practice Template.md',
  'Templates/Publishing/Map Template.md',
  'Templates/Publishing/Image Metadata Template.md',
  'Templates/Timelines/Timeline Template.md',
  'Templates/Timelines/Chronos Timeline Template.md',
  'Templates/Databases/Myrkild Unit Profile.md',
];

const inlineDynamicArticleGenerators = [
  'Templates/_Internals/Story Entity Core.md',
  'Templates/Databases/New Myrkild Unit.md',
];

const delegatedDynamicArticleGenerators = [
  'Templates/Lore/New Lore Entity.md',
];

async function readTemplate(relativePath) {
  return fs.readFile(path.join(vaultRoot, relativePath), 'utf8');
}

function assertStorytellerContract(source, relativePath) {
  assert.equal(source.split(start).length - 1, 1, `${relativePath} start marker`);
  assert.equal(source.split(end).length - 1, 1, `${relativePath} end marker`);
  assert.ok(source.indexOf(start) < source.indexOf(end), `${relativePath} marker order`);
  assert.match(source.slice(source.indexOf(start), source.indexOf(end)), /^## Storyteller View$/m);
}

test('every static article template contains one ordered Storyteller boundary pair', async () => {
  for (const relativePath of templates) {
    assertStorytellerContract(await readTemplate(relativePath), relativePath);
  }
});

test('inline dynamic article generators emit the marked Storyteller footer', async () => {
  for (const relativePath of inlineDynamicArticleGenerators) {
    const source = await readTemplate(relativePath);
    assert.equal(source.split(start).length - 1, 1, `${relativePath} start marker constant`);
    assert.equal(source.split(end).length - 1, 1, `${relativePath} end marker constant`);
    assert.match(source, /"## Storyteller View"/, `${relativePath} should emit the foldable heading`);
    assert.match(source, /STORYTELLER_START/);
    assert.match(source, /STORYTELLER_END/);
  }
});

test('delegated dynamic article generators validate and emit configured Storyteller templates', async () => {
  for (const relativePath of delegatedDynamicArticleGenerators) {
    const source = await readTemplate(relativePath);
    const configuredTemplates = [...source.matchAll(/template:\s*"([^"]+\.md)"/g)].map((match) => match[1]);

    assert.ok(configuredTemplates.length > 0, `${relativePath} should configure delegated templates`);
    assert.match(source, /validateTemplate\(rendered, config\.template\)/);
    assert.match(source, /tR \+= rendered/);

    for (const template of configuredTemplates) {
      assert.ok(templates.includes(template), `${template} must be covered by the static Storyteller contract`);
      assertStorytellerContract(await readTemplate(template), template);
    }
  }
});
