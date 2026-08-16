import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');
const vaultRoot = path.join(repoRoot, 'Vault');

async function readBase(name) {
  return fs.readFile(path.join(vaultRoot, 'System', 'Bases', name), 'utf8');
}

const cases = [
  { file: 'Lore Registry.base', label: 'Note', tableViews: 6 },
  { file: 'Needs Attention.base', label: 'Note', tableViews: 6 },
  { file: 'Publishing.base', label: 'Article', tableViews: 5 },
];

for (const { file, label, tableViews } of cases) {
  test(`${file} renders its visible title as an internal note link`, async () => {
    const base = await readBase(file);

    assert.match(base, /^\s*display_title:\s*['\"]?if\(title\.isEmpty\(\), file\.name, title\)['\"]?$/m);
    assert.match(base, /^\s*note_link:\s*['\"]?file\.asLink\(formula\.display_title\)['\"]?$/m);
    assert.match(base, new RegExp(`formula\\.note_link:\\n\\s+displayName: ${label}`));

    const visibleLinkColumns = base.match(/^\s+- formula\.note_link$/gm) ?? [];
    assert.equal(visibleLinkColumns.length, tableViews);

    // Keep the raw text formula out of visible column order so the user-facing title is always clickable.
    assert.doesNotMatch(base, /^\s+- formula\.display_title$/m);

    // Sorting can still use the plain display title rather than Link-object ordering.
    assert.match(base, /property: formula\.display_title/);
  });
}
