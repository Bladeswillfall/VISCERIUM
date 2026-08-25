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

test('identity layout keeps username and timestamp primary and metadata underneath', () => {
  assert.match(style, /\.vc-comment-user[\s\S]*?flex-wrap:\s*wrap/);
  assert.match(style, /\.vc-comment-time[\s\S]*?align-self:\s*flex-start/);
  assert.match(style, /\.vc-comment-meta[\s\S]*?flex:\s*0 0 100%/);
  assert.match(style, /\.vc-comment-uid[\s\S]*?font-family:\s*ui-monospace/);
  assert.match(style, /\.vc-comment-role\[data-role='staff'\][\s\S]*?border-radius:\s*4px/);
  assert.match(iframe, /parts\.user\.appendChild\(meta\)/);
  assert.doesNotMatch(iframe, /appendChild\(parts\.time\)/);
});

test('account decoration shares the existing structural observer and stays out of typing', () => {
  assert.equal((iframe.match(/new MutationObserver/g) ?? []).length, 1);
  assert.match(iframe, /observer\.observe\(document\.body, \{ childList: true, subtree: true \}\)/);
  assert.match(iframe, /if \(containsComment\(node\)\) scheduleIdentityRefresh\(\)/);
  assert.doesNotMatch(iframe, /addEventListener\(['"]input['"]/);
  assert.doesNotMatch(iframe, /addEventListener\(['"]keydown['"]/);
  assert.doesNotMatch(iframe, /addEventListener\(['"]keyup['"]/);
});
