import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');
const vaultRoot = path.join(repoRoot, 'Vault');

async function readVault(relativePath) {
  return fs.readFile(path.join(vaultRoot, relativePath), 'utf8');
}

test('Home brand uses Cinzel without changing normal article heading ownership', async () => {
  const headings = await readVault('.obsidian/snippets/Heading hierarchy.css');
  const foundation = await readVault('.obsidian/snippets/Creator UI foundation.css');

  assert.match(
    headings,
    /markdown-preview-view\.viscerium-home[\s\S]*?home-header[\s\S]*?font-family:\s*"Cinzel",\s*serif/,
  );
  assert.match(headings, /markdown-source-view\.mod-cm6\.viscerium-home \.HyperMD-header-1/);
  assert.match(foundation, /--h1-font:\s*var\(--font-text\)/);
});

test('Needs Attention derives a four-level severity from the real issue count', async () => {
  const base = await readVault('System/Bases/Needs Attention.base');

  assert.match(base, /attention_text:/);
  assert.match(base, /attention_severity:/);
  assert.match(base, /issue_count >= 4, \"critical\"/);
  assert.match(base, /issue_count == 3, \"urgent\"/);
  assert.match(base, /issue_count == 2, \"elevated\"/);
  assert.match(base, /attention-state attention-state--/);
  assert.match(base, /data-issues=/);
  assert.match(base, /formula\.issue_count\.toString\(\)/);
});

test('Base styling escalates from amber to deep red on the Home dashboard', async () => {
  const css = await readVault('.obsidian/snippets/Bases.css');

  for (const severity of ['notice', 'elevated', 'urgent', 'critical']) {
    assert.match(css, new RegExp(`attention-state--${severity}`));
    assert.match(css, new RegExp(`bases-tr:has\\(\\.attention-state--${severity}\\)`));
  }

  assert.match(css, /attention-state::before[\s\S]*?content:\s*attr\(data-issues\)/);
  assert.match(css, /attention-state--notice[\s\S]*?vc-state-warning/);
  assert.match(css, /attention-state--elevated[\s\S]*?color-orange/);
  assert.match(css, /attention-state--urgent[\s\S]*?color-red[\s\S]*?color-orange/);
  assert.match(css, /attention-state--critical[\s\S]*?#6f1020/);
  assert.match(css, /attention-state--critical\) \.bases-td[\s\S]*?13%/);
  assert.match(css, /p:first-of-type strong[\s\S]*?vc-state-danger/);
  assert.match(css, /p:nth-of-type\(3\) strong[\s\S]*?vc-state-success/);
});
