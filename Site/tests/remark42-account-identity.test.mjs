import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const iframeUrl = new URL('../../Infrastructure/comments/remark42-ui/iframe.html', import.meta.url);
const iframe = readFileSync(iframeUrl, 'utf8');
const style = iframe.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '';

test('account identity work leaves Remark42 theme and native controls upstream-owned', () => {
  assert.doesNotMatch(style, /--color\d+\s*:/);
  assert.doesNotMatch(style, /#remark42\s*>\s*\.dark/);
  assert.doesNotMatch(style, /#remark42\s*>\s*\.light/);
  assert.doesNotMatch(style, /(^|[}\s])textarea\s*\{/m);
  assert.doesNotMatch(style, /(^|[}\s])button\s*\{/m);
  assert.doesNotMatch(style, /(^|[}\s])a\s*\{/m);
});

test('identity comes from Remark42 public comment records rather than avatar or username inference', () => {
  assert.match(iframe, /return '\/api\/v1\/find\?' \+ query\.toString\(\)/);
  assert.match(iframe, /query\.set\('site', remark_config\.site_id\)/);
  assert.match(iframe, /query\.set\('url', remark_config\.url\)/);
  assert.match(iframe, /query\.set\('format', 'plain'\)/);
  assert.match(iframe, /typeof comment\.user\.id !== 'string'/);
  assert.match(iframe, /deriveDisplayUid\(userId\)/);
  assert.doesNotMatch(iframe, /avatars\.githubusercontent\.com/);
});

test('roles use Remark42 identity evidence', () => {
  assert.match(iframe, /user\.admin === true\) return 'Staff'/);
  assert.match(iframe, /user\.id\.indexOf\('anonymous_'\) === 0\) return 'Guest'/);
  assert.match(iframe, /return 'Reader'/);
});

test('five-character display UIDs are opaque, deterministic and collision-fail-closed', () => {
  assert.match(iframe, /base62Alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'/);
  assert.match(iframe, /maxFiveCharacterBase62 = 916132832; \/\/ 62\^5/);
  assert.match(iframe, /var hash = 0x811c9dc5/);
  assert.match(iframe, /Math\.imul\(hash, 0x01000193\)/);
  assert.match(iframe, /for \(var i = 0; i < 5; i\+\+\)/);
  assert.match(iframe, /candidate && !collided\[candidate\] \? candidate : null/);
  assert.match(iframe, /Withheld colliding five-character comment UIDs/);
  assert.doesNotMatch(iframe, /\.textContent\s*=\s*[^;]*user\.id/);
});

test('identity layout uses inert attributes and CSS generated content, not Preact-owned child nodes', () => {
  assert.match(style, /\[data-vc-meta\][\s\S]*?flex-wrap:\s*wrap/);
  assert.match(style, /\[data-vc-meta\]::after[\s\S]*?content:\s*attr\(data-vc-meta\)/);
  assert.match(style, /\[data-vc-role='staff'\]::after[\s\S]*?font-weight:\s*700/);
  assert.match(style, /\[data-vc-time\][\s\S]*?align-self:\s*flex-start/);
  assert.match(iframe, /parts\.user\.setAttribute\('data-vc-meta', metaText\)/);
  assert.match(iframe, /parts\.user\.setAttribute\('data-vc-role', roleValue\)/);
  assert.match(iframe, /parts\.time\.setAttribute\('data-vc-time', ''\)/);
  assert.doesNotMatch(iframe, /createElement\(['"]span['"]\)/);
  assert.doesNotMatch(iframe, /appendChild\(meta\)/);
  assert.doesNotMatch(iframe, /vc-comment-meta/);
});

test('account decoration is outside the no-upload observer and outside typing', () => {
  assert.equal((iframe.match(/new MutationObserver/g) ?? []).length, 1);
  assert.match(
    iframe,
    /new MutationObserver\(function \(mutations\) \{[\s\S]*?mutation\.addedNodes\.forEach[\s\S]*?removeUploadControls\(node\)[\s\S]*?\}\);\s*observer\.observe\(document\.body, \{ childList: true, subtree: true \}\)/
  );
  assert.doesNotMatch(iframe, /MutationObserver[\s\S]{0,1200}decorateComment/);
  assert.doesNotMatch(iframe, /MutationObserver[\s\S]{0,1200}refreshIdentityIndex/);
  assert.doesNotMatch(iframe, /addEventListener\(['"]input['"]/);
  assert.doesNotMatch(iframe, /addEventListener\(['"]keydown['"]/);
  assert.doesNotMatch(iframe, /addEventListener\(['"]keyup['"]/);
});

test('identity refresh is bounded to startup and low-frequency interactions', () => {
  assert.match(iframe, /\[0, 50, 150, 300, 600, 1000, 1600, 2500\]/);
  assert.match(iframe, /document\.addEventListener\('submit', scheduleRefreshAfterSubmit, true\)/);
  assert.match(iframe, /document\.addEventListener\('click', scheduleDecorationBurst, true\)/);
  assert.match(iframe, /data\.theme === 'light' \|\| data\.theme === 'dark'/);
  assert.doesNotMatch(iframe, /setInterval\(/);
});
