import test from 'node:test';
import assert from 'node:assert/strict';
import { requiresCodexMdx, transformCodexFormatting } from '../scripts/codex-formatting.mjs';

test('uses native Starlight asides for authoring callouts', () => {
  assert.equal(
    transformCodexFormatting('[warning:title="Content warning"]\nText.\n[/warning]'),
    ':::caution[Content warning]\nText.\n:::',
  );
});

test('keeps responsive layouts with compact CSS variables', () => {
  const output = transformCodexFormatting('[cols:2-1 gap=lg]\n[col:12 md:8 order-md:2]\nText.\n[/col]\n[/cols]', {
    jsx: true,
  });

  assert.match(output, /className="cx-cols"/);
  assert.match(output, /"--cx-columns":"2fr 1fr"/);
  assert.match(output, /"--cx-gap":"1.5rem"/);
  assert.match(output, /"--cx-span":"12"/);
  assert.match(output, /"--cx-md-span":"8"/);
  assert.match(output, /"--cx-md-order":"2"/);
  assert.equal(requiresCodexMdx(output), false);
  assert.equal(requiresCodexMdx('[cols]\n[/cols]'), true);
});

test('normalises compact inline container tags before emitting MDX', () => {
  const markdown = '[cols:7-3 gap=lg align=start]\n[col]Article text.[/col]\n[col]![[artwork.webp]]\n*Caption.*[/col][/cols]';
  const output = transformCodexFormatting(markdown, { jsx: true });

  assert.equal((output.match(/className="cx-cols(?:\s|\")/g) ?? []).length, 1);
  assert.equal((output.match(/className="cx-col"/g) ?? []).length, 2);
  assert.equal((output.match(/<\/div>/g) ?? []).length, 3);
  assert.doesNotMatch(output, /\[\/?cols/);
  assert.doesNotMatch(output, /\[\/?col(?:\]|:|\s)/);
  assert.match(output, /Article text\./);
  assert.match(output, /\*Caption\.\*/);
});

test('does not mistake inline-code examples for compact layout directives', () => {
  const markdown = 'Use `[col]` and `[/col]` literally in documentation.';
  assert.equal(transformCodexFormatting(markdown), markdown);
});

test('does not transform authoring syntax inside fenced code', () => {
  const markdown = '```md\n[note:title="Example"]\n[/note]\n```';
  assert.equal(transformCodexFormatting(markdown), markdown);
});
