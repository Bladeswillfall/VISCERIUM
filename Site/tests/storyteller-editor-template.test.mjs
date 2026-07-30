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

test('Storyteller workflow reviews populated modules instead of only missing fields', async () => {
  const template = await source();

  assert.match(template, /modules\.map\(\(module\) => module\.id\)/);
  assert.match(template, /populated.*module\.fields\.filter/s);
  assert.match(template, /\$\{populated\}\/\$\{module\.fields\.length\} populated/);
  assert.doesNotMatch(template, /const available = modules\.filter/);
});

test('Storyteller free-text editing prefills current values and distinguishes keep from clear', async () => {
  const template = await source();

  assert.match(template, /populated \? displayValue\(existing\) : ""/);
  assert.match(template, /Submit blank to clear this field\. Cancel to leave it unchanged\./);
  assert.match(template, /if \(response === null\) continue/);
  assert.match(template, /changes\[field\.key\] = \{ action: "clear" \}/);
});

test('Storyteller controlled fields expose explicit keep and clear choices', async () => {
  const template = await source();

  assert.match(template, /Keep current/);
  assert.match(template, /Clear value/);
  assert.match(template, /const KEEP = "__viscerium_keep__"/);
  assert.match(template, /const CLEAR = "__viscerium_clear__"/);
});

test('clearing Storyteller data removes the property rather than writing empty canon', async () => {
  const template = await source();

  assert.match(template, /delete frontmatter\[key\]/);
  assert.doesNotMatch(template, /frontmatter\[key\]\s*=\s*""/);
  assert.match(template, /Storyteller saved:/);
});
