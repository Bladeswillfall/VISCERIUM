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


test('era artifact compiles to MDX with a canonical source and text-anchored marginalia', () => {
  const input = [
    '[artifact:citadel-note date="27/08/24ce" title="Witness account" condition=battered]',
    '',
    'I [marginalia note="thought I was dead"]could not move[/marginalia], even then.',
    '',
    'This **Markdown** and [link](/a) stays intact.',
    '',
    '[/artifact]',
  ].join('\n');
  assert.equal(requiresCodexMdx(input), true);
  const html = transformCodexFormatting(input, {jsx:true});
  assert.match(html, /<section class="cx-artifact" data-preset="citadel-note"/);
  assert.match(html, /data-date="27\/08\/24ce"/);
  assert.match(html, /data-condition="battered"/);
  assert.match(html, /<div class="cx-artifact-source">/);
  assert.match(html, /<span className="cx-artifact-anchor" data-note="thought I was dead">could not move<\/span>/);
  assert.match(html, /\[Marginal note: thought I was dead\]/);
  assert.match(html, /This \*\*Markdown\*\* and \[link\]\(\/a\) stays intact/);
  assert.match(html, /<\/div>\s*<\/section>/);
});

test('artifact themes share the same authoring syntax', () => {
  for (const preset of ['citadel-note','smog-dispatch','nearsight-terminal','entropy-diagnostic']) {
    assert.match(transformCodexFormatting('[artifact:'+preset+']\nText.\n[/artifact]', {jsx:true}),
      new RegExp('data-preset="' + preset + '"'));
  }
});

test('artifact parameters escape attributes and reject unknown presets', () => {
  const html = transformCodexFormatting('[artifact:citadel-note title="A & B" date="1"]\n[marginalia note="Red & black"]text[/marginalia]\n[/artifact]', {jsx:true});
  assert.match(html, /title="A &amp; B"/);
  assert.match(html, /data-note="Red &amp; black"/);
  assert.throws(() => transformCodexFormatting('[artifact:unknown]\nText\n[/artifact]'), /Unknown artifact preset/);
  assert.throws(() => transformCodexFormatting('[artifact:citadel-note]\n[marginalia note="lost"]text\n[/artifact]'), /Unclosed marginalia/);
});

test('code fences within artifacts keep shortcode syntax literal', () => {
  const source = '[artifact:citadel-note]\n\n' +
    '~~~md\n[marginalia note="Not a note"]literal[/marginalia]\n~~~\n\n' +
    'Actual [marginalia note="real"]anchor[/marginalia].\n[/artifact]';
  const html = transformCodexFormatting(source, {jsx:true});
  assert.match(html, /~~~md\n\[marginalia note="Not a note"\]literal\[\/marginalia\]\n~~~/);
  assert.match(html, /data-note="real"/);
});
