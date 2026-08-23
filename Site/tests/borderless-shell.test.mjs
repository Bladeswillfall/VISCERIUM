import test from 'node:test';
import assert from 'node:assert/strict';
import { transformCodexFormatting } from '../scripts/codex-formatting.mjs';

test('responsive two-column authoring blocks compile through the shared formatter', () => {
  const source = `[cols:1-1 gap=xl align=start]
[col]
Left-hand editorial content.
[/col]
[col]
Right-hand editorial content.
[/col]
[/cols]`;

  const compiled = transformCodexFormatting(source, { jsx: true });

  assert.match(compiled, /className="[^"]*\bcx-cols\b[^"]*"/);
  assert.match(compiled, /"--cx-columns":"1fr 1fr"/);
  assert.match(compiled, /Left-hand editorial content\./);
  assert.match(compiled, /Right-hand editorial content\./);
});
