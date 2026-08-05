import test from 'node:test';
import assert from 'node:assert/strict';
import { transformCodexFormatting } from '../scripts/codex-formatting.mjs';
import { findVaultNote } from './helpers/vault-note.mjs';

test('the Okse Dominion source uses responsive two-column authoring blocks', async () => {
  const { markdown: source } = await findVaultNote({
    title: 'Okse Dominion',
    type: 'faction',
    era: 'CITADEL',
  });
  const columnBlocks = source.match(/^\[cols:1-1 gap=xl align=start\]$/gm) ?? [];

  assert.ok(columnBlocks.length >= 4, 'expected multiple editorial two-column sections');
  assert.match(source, /## History[\s\S]*\[cols:1-1 gap=xl align=start\]/);
  assert.match(source, /### Oil: The Black Gold of the Dominion[\s\S]*\[cols:1-1 gap=xl align=start\]/);

  const compiled = transformCodexFormatting(source, { jsx: true });
  assert.match(compiled, /className="[^"]*\bcx-cols\b[^"]*"/);
  assert.match(compiled, /"--cx-columns":"1fr 1fr"/);
});
