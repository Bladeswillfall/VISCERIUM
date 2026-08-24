import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const caddyUrl = new URL('../../Infrastructure/comments/Caddyfile.example', import.meta.url);
const iframeUrl = new URL('../../Infrastructure/comments/remark42-ui/iframe.html', import.meta.url);

test('Remark42 iframe override is served before the stock web app', async () => {
  const caddy = await fs.readFile(caddyUrl, 'utf8');

  assert.match(caddy, /path\s+\/web\/iframe\.html/);
  assert.match(caddy, /root\s+\*\s+\/srv\/remark42\/ui/);
  assert.match(caddy, /rewrite\s+\*\s+\/iframe\.html/);
  assert.match(caddy, /respond\s+@commentImageUpload\s+404/);
  assert.match(caddy, /Content-Security-Policy/);
});

test('Remark42 iframe removes image upload affordances and transfer handlers', async () => {
  const iframe = await fs.readFile(iframeUrl, 'utf8');

  assert.match(iframe, /label:has\(input\[type='file'\]\)/);
  assert.match(iframe, /querySelectorAll\("input\[type='file'\]"\)/);
  assert.match(iframe, /new MutationObserver/);
  assert.match(iframe, /addEventListener\('paste',\s*blockImageTransfer,\s*true\)/);
  assert.match(iframe, /addEventListener\('drop',\s*blockImageTransfer,\s*true\)/);
  assert.match(iframe, /addEventListener\('dragover',\s*blockImageTransfer,\s*true\)/);

  // Keep the pinned Remark42 frontend assets rather than maintaining a forked
  // application bundle merely to hide one disabled control.
  assert.match(iframe, /href="remark\.css"/);
  assert.match(iframe, /remark' \+ \(m \? '\.mjs' : '\.js'\)/);
});

test('Remark42 iframe accepts navigation messages only from its parent and only for comment fragments', async () => {
  const iframe = await fs.readFile(iframeUrl, 'utf8');

  assert.match(iframe, /event\.source\s*!==\s*window\.parent/);
  assert.match(iframe, /\^#remark42__comment-\(\[A-Za-z0-9_-\]\{1,128\}\)\$/);
  assert.match(iframe, /encodeURIComponent\(hashMatch\[1\]\)/);
  assert.doesNotMatch(iframe, /location\.replace\(data\.hash\)/);
});
