import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const templatePath = path.resolve(here, '../../Vault/Templates/Databases/Add Storyteller Fields.md');

async function source() {
  return fs.readFile(templatePath, 'utf8');
}

test('Storyteller insertion template creates one marked Markdown section', async () => {
  const template = await source();

  assert.match(template, /<!-- viscerium:storyteller:start -->/);
  assert.match(template, /## Storyteller View/);
  assert.match(template, /<!-- viscerium:storyteller:end -->/);
  assert.match(template, /tp\.file\.find_tfile/);
  assert.match(template, /tp\.app\.vault\.read/);
});

test('Storyteller insertion template refuses duplicate or partial marker sets', async () => {
  const template = await source();

  assert.match(template, /current\.includes\(START\) \|\| current\.includes\(END\)/);
  assert.match(template, /already contains a Storyteller section/);
  assert.match(template, /tR = ""/);
});

test('Storyteller insertion no longer edits frontmatter fields', async () => {
  const template = await source();

  assert.doesNotMatch(template, /processFrontMatter/);
  assert.doesNotMatch(template, /frontmatter\[/);
  assert.doesNotMatch(template, /current_wants|local_tension|story_complication/);
});
