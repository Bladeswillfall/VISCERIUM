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
  assert.match(style, /html:root\s*\{/);
  assert.match(style, /#remark42 > \.dark\s*\{/);
  assert.match(style, /#remark42 > \.light\s*\{/);
  assert.match(style, /--color9:\s*var\(--vc-era-accent\)/);
  assert.match(style, /--color15:\s*var\(--vc-era-button\)/);

  assert.doesNotMatch(style, /(^|[}\s])textarea\s*\{/m);
  assert.doesNotMatch(style, /(^|[}\s])button\s*\{/m);
  assert.doesNotMatch(style, /(^|[}\s])a\s*\{/m);
});

test('neutral Remark42 color tokens keep their upstream semantic roles across theme changes', () => {
  // Remark42's light composer is color0 on color6; dark is color5 on color8.
  // Keep these numbered tokens stable rather than rebinding them by theme.
  assert.match(style, /html:root[\s\S]*?--color0:\s*#101010/);
  assert.match(style, /html:root[\s\S]*?--color5:\s*#c8bfa8/);
  assert.match(style, /html:root[\s\S]*?--color6:\s*#b9b4a9/);
  assert.match(style, /html:root[\s\S]*?--color8:\s*#211f1b/);

  const themeBlocks = style.match(/#remark42 > \.dark,[\s\S]*?#remark42 > \.light\s*\{[\s\S]*?\}/g)?.join('\n') ?? '';
  assert.doesNotMatch(themeBlocks, /--color0:/);
  assert.doesNotMatch(themeBlocks, /--color5:/);
  assert.doesNotMatch(themeBlocks, /--color6:/);
  assert.doesNotMatch(themeBlocks, /--color8:/);
});

test('theme switching follows stock Remark42 mechanics and stays out of the editor hot path', () => {
  assert.match(style, /#remark42 > \.dark/);
  assert.match(style, /#remark42 > \.light/);
  assert.doesNotMatch(iframe, /syncRemarkTheme/);
  assert.doesNotMatch(iframe, /new MutationObserver/);
  assert.doesNotMatch(iframe, /observer\.observe/);

  // Match upstream: set document color-scheme only for first paint. Runtime
  // changeTheme() owns the iframe element and native Remark42 theme message.
  assert.match(iframe, /document\.documentElement\.style\.colorScheme = theme === 'dark' \? 'dark' : 'light'/);
  assert.doesNotMatch(iframe, /document\.documentElement\.style\.colorScheme = data\.theme/);
  assert.doesNotMatch(iframe, /addEventListener\(['"]input['"]/);
  assert.doesNotMatch(iframe, /addEventListener\(['"]keydown['"]/);
  assert.doesNotMatch(iframe, /addEventListener\(['"]focusin['"]/);
});

test('decoration stops polling once Remark42 initial render is ready', () => {
  assert.match(iframe, /function waitForInitialRender\(attempt\)/);
  assert.match(iframe, /mainForm && !stillLoading/);
  assert.match(iframe, /attempt >= 7/);
  assert.match(iframe, /document\.addEventListener\('submit'/);
  assert.match(iframe, /document\.addEventListener\('click'/);
  assert.match(iframe, /window\.requestAnimationFrame/);
  assert.match(iframe, /No persistent DOM observer is installed/);
  assert.doesNotMatch(iframe, /scheduleRefreshBurst/);
});

test('Remark42 exposes all four era palettes in light and dark modes', () => {
  for (const era of ['e1', 'e2', 'e3', 'e4']) {
    assert.match(style, new RegExp(`data-viscerium-era='${era}'[^\\n]*#remark42 > \\.dark`));
    assert.match(style, new RegExp(`data-viscerium-era='${era}'[^\\n]*#remark42 > \\.light`));
  }

  assert.match(iframe, /\/eras\/citadel\//);
  assert.match(iframe, /\/eras\/smog\//);
  assert.match(iframe, /\/eras\/nearsight\//);
  assert.match(iframe, /\/eras\/entropy\//);
});

test('comment treatment keeps the root rail and removes avatar borders', () => {
  assert.match(style, /article\[id\^='remark42__comment-'\][\s\S]*?border-left:\s*2px solid var\(--vc-era-accent\)/);
  assert.match(style, /img\.avatar[\s\S]*?border:\s*0 !important/);
  assert.match(style, /\.vc-comment-identity[\s\S]*?flex:\s*0 0 100%/);
  assert.match(style, /\.vc-comment-role\[data-role='staff'\][\s\S]*?border-radius:\s*4px/);
});

test('identity metadata keeps readable contrast instead of opacity-dimming tiny text', () => {
  assert.match(style, /--vc-meta:\s*#888070/);
  assert.match(style, /--vc-meta:\s*#403b34/);
  assert.doesNotMatch(style, /\.vc-comment-uid[\s\S]*?opacity:\s*0\.72/);
  assert.doesNotMatch(style, /\.vc-comment-role\s*\{[\s\S]*?opacity:\s*0\.72/);
  assert.match(style, /\.vc-comment-role\[data-role='staff'\][\s\S]*?background:\s*var\(--vc-era-accent\)/);
  assert.match(style, /\.vc-comment-role\[data-role='staff'\][\s\S]*?color:\s*var\(--vc-staff-text\)/);
});

test('top-level comment prompt rotates without touching reply/edit forms or observing keystrokes', () => {
  assert.match(iframe, /What was your favourite part of this article\?/);
  assert.match(iframe, /What would you like to see more of from this article\?/);
  assert.match(iframe, /Was anything unclear or underdeveloped\?/);
  assert.match(iframe, /What did we miss\?/);
  assert.match(iframe, /var selectedPrompt = prompts\[Math\.floor\(Math\.random\(\) \* prompts\.length\)\]/);
  assert.match(iframe, /var expected = 'commentform_' \+ encodeURI\(remark_config\.url \|\| ''\)/);
  assert.match(iframe, /form\.getAttribute\('data-testid'\) !== expected/);
  assert.doesNotMatch(iframe, /promptApplied/);
});

test('GitHub-backed display UIDs use the numeric avatar account id without hashing or truncation', () => {
  assert.match(iframe, /avatars\\\.githubusercontent\\\.com\\\/u\\\/\(\\d\+\)/);
  assert.match(iframe, /base62Alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'/);
  assert.match(iframe, /maxFiveCharacterBase62 = 916132832; \/\/ 62\^5/);
  assert.match(iframe, /while \(encoded\.length < 5\) encoded = '0' \+ encoded/);
  assert.match(iframe, /if \(!Number\.isSafeInteger\(id\) \|\| id < 0 \|\| id >= maxFiveCharacterBase62\) return null/);
});

test('identity roles are evidence-based and do not guess anonymous/non-GitHub providers', () => {
  assert.match(iframe, /var role = isStaff \? 'Staff' : uid \? 'Reader' : null/);
  assert.match(iframe, /Do not infer Guest\/non-GitHub roles from username or avatar shape/);
  assert.doesNotMatch(iframe, /var role = .*'Guest'/);
  assert.match(style, /\.vc-comment-uid[\s\S]*?font-size:\s*9px/);
});
