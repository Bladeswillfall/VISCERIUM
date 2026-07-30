import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const layoutPlugin = readFileSync(new URL('../../Vault/.obsidian/plugins/viscerium-layout-tools/main.js', import.meta.url), 'utf8');
const layoutStyles = readFileSync(new URL('../../Vault/.obsidian/plugins/viscerium-layout-tools/styles.css', import.meta.url), 'utf8');
const layoutManifest = JSON.parse(readFileSync(new URL('../../Vault/.obsidian/plugins/viscerium-layout-tools/manifest.json', import.meta.url), 'utf8'));
const communityPlugins = JSON.parse(readFileSync(new URL('../../Vault/.obsidian/community-plugins.json', import.meta.url), 'utf8'));
const publicIndentStyles = readFileSync(new URL('../src/styles/layout-indents.css', import.meta.url), 'utf8');
const a11yStyles = readFileSync(new URL('../src/styles/a11y.css', import.meta.url), 'utf8');

test('VISCERIUM layout tools expose safe visual indent and outdent commands', () => {
  assert.doesNotThrow(() => new Function(layoutPlugin));
  assert.match(layoutPlugin, /id: 'visual-indent-block'/);
  assert.match(layoutPlugin, /id: 'visual-outdent-block'/);
  assert.match(layoutPlugin, /modifiers: \['Alt'\], key: '\]'/);
  assert.match(layoutPlugin, /modifiers: \['Alt'\], key: '\['/);
  assert.match(layoutPlugin, /VISCERIUM visual indents cannot be applied inside YAML frontmatter/);
});

test('visual indents preserve parent quote depth so nested indents are structurally nested', () => {
  assert.match(layoutPlugin, /function minimumQuoteDepth\(markdown\)/);
  assert.match(layoutPlugin, /const parentDepth = minimumQuoteDepth\(source\)/);
  assert.match(layoutPlugin, /const wrapperPrefix = quotePrefix\(parentDepth \+ 1\)/);
  assert.match(layoutPlugin, /const indentHeader = `\$\{wrapperPrefix\}\[!\$\{INDENT_CALLOUT\}\]`/);
  assert.match(layoutPlugin, /const indentMarkerLine = `\$\{wrapperPrefix\}\$\{INDENT_MARKER\}`/);
  assert.match(layoutPlugin, /source\.split\('\\n'\)\.map/);
  assert.match(layoutPlugin, /`> \$\{line\}`/);
});

test('Reading View uses a Markdown post-processor instead of relying on theme-sensitive CSS shape alone', () => {
  assert.match(layoutPlugin, /registerMarkdownPostProcessor/);
  assert.match(layoutPlugin, /normaliseRenderedIndents/);
  assert.match(layoutPlugin, /normaliseMalformedRenderedNesting/);
  assert.match(layoutPlugin, /vc-layout-indent-rendered/);
  assert.match(layoutPlugin, /nestedBlockquote\.classList\.add\(RENDERED_INDENT_CLASS\)/);
  assert.match(layoutStyles, /\.vc-layout-indent-rendered/);
  assert.match(layoutStyles, /background: transparent !important/);
  assert.match(layoutStyles, /border: 0 !important/);
  assert.match(layoutStyles, /box-shadow: none !important/);
  assert.match(layoutStyles, /font: inherit !important/);
  assert.match(layoutStyles, /blockquote\.vc-layout-indent-rendered::before/);
  assert.match(layoutStyles, /content: none !important/);
});

test('Reading View renders compact Codex cols and col tags as responsive article columns', () => {
  assert.equal(layoutManifest.version, '0.2.0');
  assert.match(layoutPlugin, /LAYOUT_TAG_RE/);
  assert.match(layoutPlugin, /function splitRenderedLayoutMarkerParagraphs\(root\)/);
  assert.match(layoutPlugin, /function splitRenderedLayoutParagraph\(paragraph\)/);
  assert.match(layoutPlugin, /split\(\/\\r\?\\n\/\)/);
  assert.match(layoutPlugin, /function normaliseRenderedColumns\(root\)/);
  assert.match(layoutPlugin, /function renderColumnsGroup\(opening, marker\)/);
  assert.match(layoutPlugin, /--vc-layout-columns/);
  assert.match(layoutPlugin, /normaliseRenderedColumns\(element\)/);
  assert.match(layoutStyles, /\.vc-layout-cols-rendered\s*\{/);
  assert.match(layoutStyles, /grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(layoutStyles, /container-name: vc-reading-pane/);
  assert.match(layoutStyles, /@container vc-reading-pane \(min-width: 44rem\)/);
  assert.match(layoutStyles, /grid-template-columns: var\(--vc-layout-columns/);
  assert.doesNotMatch(layoutStyles, /@media \(min-width: 44rem\)/);
  assert.match(layoutStyles, /\.vc-layout-col-rendered > p > img:only-child/);
  assert.match(layoutStyles, /\.vc-layout-col-rendered \.image-embed img/);
  assert.match(layoutStyles, /inline-size: 100%/);
});

test('malformed nested indents from earlier versions are repaired in source', () => {
  assert.match(layoutPlugin, /function repairMalformedNestedVisualIndents\(editor\)/);
  assert.match(layoutPlugin, /quoteDepth\(firstContent\) <= depth/);
  assert.match(layoutPlugin, /editor\.replaceRange\(`> \$\{source\}`/);
  assert.match(layoutPlugin, /repairMalformedNestedVisualIndents\(view\.editor\)/);
});

test('legacy collapsed visual indents are repaired and cannot hide their body', () => {
  assert.match(layoutPlugin, /LEGACY_INDENT_HEADER_RE/);
  assert.match(layoutPlugin, /repairLegacyVisualIndents/);
  assert.match(layoutPlugin, /id: 'repair-legacy-visual-indents'/);
  assert.match(layoutPlugin, /workspace\.on\('file-open'/);
  assert.match(layoutStyles, /\.is-collapsed > \.callout-content/);
  assert.match(layoutStyles, /display: block !important/);
});

test('layout tools are enabled in the shared vault configuration', () => {
  assert.ok(communityPlugins.includes('viscerium-layout-tools'));
});

test('public Codex recognises visual indent markers without quotation chrome or scaffold labels', () => {
  assert.match(a11yStyles, /@import '\.\/layout-indents\.css';/);
  assert.match(publicIndentStyles, /blockquote:has\(\.vc-layout-indent-marker\)/);
  assert.match(publicIndentStyles, /margin-inline: 2\.25rem 0/);
  assert.match(publicIndentStyles, /::before/);
  assert.match(publicIndentStyles, /::after/);
  assert.match(publicIndentStyles, /content: none/);
  assert.match(publicIndentStyles, /> p:first-child\s*\{/);
  assert.match(publicIndentStyles, /> \.vc-layout-indent-marker\s*\{/);
  assert.match(publicIndentStyles, /display: none/);
});
