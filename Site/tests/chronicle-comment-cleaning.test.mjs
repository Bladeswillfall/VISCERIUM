import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const evidencePath = path.resolve(here, '../../Vault/System/Views/Chronicle/Evidence/view.js');

async function loadStripDelimitedBlocks() {
  const source = await fs.readFile(evidencePath, 'utf8');
  const match = source.match(/function stripDelimitedBlocks\([\s\S]*?\n}\n\nfunction cleanSection/);
  assert.ok(match, 'Chronicle evidence should define stripDelimitedBlocks before cleanSection');

  const helperSource = match[0].replace(/\n\nfunction cleanSection$/, '');
  const factory = new Function(`${helperSource}\nreturn stripDelimitedBlocks;`);
  return { source, stripDelimitedBlocks: factory() };
}

test('Chronicle removes ordinary and unterminated HTML comments without rendering markup', async () => {
  const { stripDelimitedBlocks } = await loadStripDelimitedBlocks();

  assert.equal(
    stripDelimitedBlocks('Before <!-- hidden --> after', '<!--', '-->'),
    'Before  after',
  );
  assert.equal(
    stripDelimitedBlocks('Before <!-- hidden', '<!--', '-->'),
    'Before ',
  );
});

test('Chronicle removes comment tokens reconstructed across a previous removal boundary', async () => {
  const { source, stripDelimitedBlocks } = await loadStripDelimitedBlocks();

  const adversarial = 'A<!<!-- hidden -->-- reconstructed -->B';
  assert.equal(stripDelimitedBlocks(adversarial, '<!--', '-->'), 'AB');

  assert.doesNotMatch(source, /\.replace\(\/<!--\[/);
  assert.match(source, /stripDelimitedBlocks\(withoutObsidianComments, "<!--", "-->"\)/);
});
