import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const iframePath = path.resolve(testDir, '../../Infrastructure/comments/remark42-ui/iframe.html');
const iframe = readFileSync(iframePath, 'utf8');
const style = iframe.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '';

test('Remark42 keeps native component geometry while VISCERIUM owns colours', () => {
  assert.match(style, /html\[data-viscerium-theme='dark'\]/);
  assert.match(style, /html\[data-viscerium-theme='light'\]/);
  assert.match(style, /--color9:\s*var\(--vc-era-accent\)/);
  assert.match(style, /--color15:\s*var\(--vc-era-button\)/);
  assert.match(style, /--primary-text-color:\s*var\(--vc-text-rgb\)/);

  // The composer, links and native Remark42 buttons keep their stock CSS. The
  // override only changes their variables, not their shape/spacing/layout.
  assert.doesNotMatch(style, /(^|[}\s])textarea\s*\{/m);
  assert.doesNotMatch(style, /(^|[}\s])button\s*\{/m);
  assert.doesNotMatch(style, /(^|[}\s])a\s*\{/m);
});

test('Remark42 exposes all four era palettes in light and dark modes', () => {
  for (const era of ['e1', 'e2', 'e3', 'e4']) {
    assert.match(style, new RegExp(`data-viscerium-theme='dark'\\]\\[data-viscerium-era='${era}'`));
    assert.match(style, new RegExp(`data-viscerium-theme='light'\\]\\[data-viscerium-era='${era}'`));
  }

  assert.match(iframe, /\/eras\/citadel\//);
  assert.match(iframe, /\/eras\/smog\//);
  assert.match(iframe, /\/eras\/nearsight\//);
  assert.match(iframe, /\/eras\/entropy\//);
  assert.match(iframe, /querySelector\('#remark42 \.dark, #remark42 \.light'\)/);
});

test('comment treatment keeps the root rail and removes avatar borders', () => {
  assert.match(style, /article\[id\^='remark42__comment-'\][\s\S]*?border-left:\s*2px solid var\(--vc-era-accent\)/);
  assert.match(style, /img\.avatar[\s\S]*?border:\s*0 !important/);
  assert.match(style, /\.vc-comment-identity[\s\S]*?flex:\s*0 0 100%/);
  assert.match(style, /\.vc-comment-role\[data-role='staff'\][\s\S]*?border-radius:\s*4px/);
});

test('top-level comment prompt rotates without changing reply or edit placeholders', () => {
  assert.match(iframe, /What was your favourite part of this article\?/);
  assert.match(iframe, /What would you like to see more of from this article\?/);
  assert.match(iframe, /Was anything unclear or underdeveloped\?/);
  assert.match(iframe, /What did we miss\?/);
  assert.match(iframe, /var selectedPrompt = prompts\[Math\.floor\(Math\.random\(\) \* prompts\.length\)\]/);
  assert.match(iframe, /var expected = 'commentform_' \+ encodeURI\(remark_config\.url \|\| ''\)/);
  assert.match(iframe, /forms\[i\]\.getAttribute\('data-testid'\) !== expected/);
});

test('GitHub-backed display UIDs use the numeric avatar account id without hashing or truncation', () => {
  assert.match(iframe, /avatars\\\.githubusercontent\\\.com\\\/u\\\/\(\\d\+\)/);
  assert.match(iframe, /base62Alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'/);
  assert.match(iframe, /maxFiveCharacterBase62 = 916132832; \/\/ 62\^5/);
  assert.match(iframe, /while \(encoded\.length < 5\) encoded = '0' \+ encoded/);
  assert.match(iframe, /if \(!Number\.isSafeInteger\(id\) \|\| id < 0 \|\| id >= maxFiveCharacterBase62\) return null/);
});

test('identity metadata stays subordinate and Staff is the only tagged role', () => {
  assert.match(iframe, /var role = isStaffComment\(article\) \? 'Staff' : 'Reader'/);
  assert.match(style, /\.vc-comment-uid[\s\S]*?font-size:\s*9px/);
  assert.match(style, /\.vc-comment-role\s*\{[\s\S]*?opacity:\s*0\.72/);
  assert.match(style, /\.vc-comment-role\[data-role='staff'\][\s\S]*?background:\s*var\(--vc-era-surface\)/);
});
