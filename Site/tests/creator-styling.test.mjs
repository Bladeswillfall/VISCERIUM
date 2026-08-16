import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');
const vaultRoot = path.join(repoRoot, 'Vault');

async function readVaultText(relativePath) {
  return fs.readFile(path.join(vaultRoot, relativePath), 'utf8');
}

async function readVaultJson(relativePath) {
  return JSON.parse(await readVaultText(relativePath));
}

test('shared creator styling enables only the two new ownership modules', async () => {
  const appearance = await readVaultJson('.obsidian/appearance.json');
  const enabled = new Set(appearance.enabledCssSnippets);

  for (const existingOwner of ['Tag styling', 'Callout styling', 'Hover previews']) {
    assert.ok(enabled.has(existingOwner), `${existingOwner} should remain the component owner`);
  }

  assert.ok(enabled.has('List hierarchy'));
  assert.ok(enabled.has('Text accents'));
  assert.ok(!enabled.has('Pretty Hashtags'));
  assert.ok(!enabled.has('Pretty Highlights'));
  assert.ok(!enabled.has('Bigger Popovers'));
});

test('Style Settings pins restrained defaults while keeping optional accents conservative', async () => {
  const settings = await readVaultJson('.obsidian/plugins/obsidian-style-settings/data.json');

  assert.equal(settings['viscerium-tags@@viscerium-tag-style'], 'viscerium-tags-compact');
  assert.equal(settings['viscerium-callouts@@viscerium-callout-style'], 'viscerium-callouts-balanced');
  assert.equal(settings['viscerium-hover-previews@@viscerium-hover-preview-size'], 'viscerium-hover-comfortable');
  assert.equal(settings['viscerium-lists@@viscerium-list-guides'], false);
  assert.equal(settings['viscerium-lists@@viscerium-list-bullets'], false);
  assert.equal(settings['viscerium-text-accents@@viscerium-highlight-style'], 'viscerium-highlights-default');
  assert.equal(settings['viscerium-text-accents@@viscerium-compact-footnotes'], false);
});

test('tag styling keeps Compact as fallback and Pretty Pills explicitly opt-in', async () => {
  const css = await readVaultText('.obsidian/snippets/Tag styling.css');

  assert.match(css, /name: VISCERIUM · Tags/);
  assert.match(css, /default: viscerium-tags-compact/);
  assert.match(css, /value: viscerium-tags-pretty/);
  assert.match(css, /value: viscerium-tags-compact/);
  assert.match(css, /value: viscerium-tags-minimal/);
  assert.match(css, /\.markdown-source-view\.mod-cm6 \.cm-hashtag/);
  assert.match(css, /body\.viscerium-tags-pretty \.markdown-rendered a\.tag/);
  assert.match(css, /body\.viscerium-tags-pretty[\s\S]*border-radius: 999px/);
  assert.match(css, /\.markdown-rendered a\.tag \{[\s\S]*border-radius: 4px/);

  const firstPillRadius = css.indexOf('border-radius: 999px');
  const prettyScope = css.indexOf('body.viscerium-tags-pretty');
  assert.ok(prettyScope >= 0 && firstPillRadius > prettyScope, 'pill radius must remain inside the Pretty opt-in section');
  assert.doesNotMatch(css, /default: viscerium-tags-pretty/);
  assert.doesNotMatch(css, /\.cm-s-obsidian/);
});

test('existing callout and hover owners expose scoped variants with responsive fallbacks', async () => {
  const callouts = await readVaultText('.obsidian/snippets/Callout styling.css');
  const hover = await readVaultText('.obsidian/snippets/Hover previews.css');

  assert.match(callouts, /value: viscerium-callouts-strong-edge/);
  assert.match(callouts, /value: viscerium-callouts-bar-only/);
  assert.match(callouts, /--vc-callout-edge-width/);

  assert.match(hover, /value: viscerium-hover-compact/);
  assert.match(hover, /value: viscerium-hover-large/);
  assert.match(hover, /--vc-hover-preview-width/);
  assert.match(hover, /@media \(max-width: 620px\)/);
  assert.match(hover, /width: calc\(100vw - 1rem\)/);
});

test('new list and text modules are opt-in and theme-variable based', async () => {
  const lists = await readVaultText('.obsidian/snippets/List hierarchy.css');
  const accents = await readVaultText('.obsidian/snippets/Text accents.css');

  assert.match(lists, /id: viscerium-list-guides/);
  assert.match(lists, /default: false/);
  assert.match(lists, /--indentation-guide-color/);
  assert.match(lists, /color-mix\(in srgb, var\(--text-faint\)/);
  assert.match(lists, /@media \(max-width: 620px\)/);

  assert.match(accents, /value: viscerium-highlights-default/);
  assert.match(accents, /value: viscerium-highlights-soft/);
  assert.match(accents, /value: viscerium-highlights-marker/);
  assert.match(accents, /id: viscerium-compact-footnotes/);
  assert.match(accents, /var\(--text-highlight-bg\)/);
  assert.doesNotMatch(accents, /#(?:[0-9a-fA-F]{3}){1,2}\b/);
});
