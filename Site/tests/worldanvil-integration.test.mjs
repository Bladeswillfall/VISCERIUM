import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { convertLegacyArticleLinks, issueTasks, importBase, isWorldAnvilArticleFile, runIntegration } from '../scripts/integrate-worldanvil-import.mjs';

test('prefers a unique current Codex note over its legacy import when converting links', () => {
  const resonance = [{ title: 'Resonance', path: 'Drafts/WorldAnvil Import/Law-Resonance-433.md', current: false }];
  const targets = new Map([
    ['okse dominion', [
      { title: 'Okse Dominion', path: 'Lore/Eras/CITADEL/Okse Dominion.md', current: true },
      { title: 'Okse Dominion', path: 'Drafts/WorldAnvil Import/Organization-Okse Dominion-f51.md', current: false },
    ]],
    ['resonants', resonance],
  ]);
  const source = 'See [Okse Dominion](/w/viscerium/a/okse-dominion-article) and [Resonants](/w/viscerium/a/resonance-article).';
  const result = convertLegacyArticleLinks(source, targets);
  assert.equal(result.converted, 2);
  assert.equal(result.body, 'See [[Lore/Eras/CITADEL/Okse Dominion]] and [[Drafts/WorldAnvil Import/Law-Resonance-433|Resonants]].');
});

test('only source article filenames enter the integration corpus', () => {
  assert.equal(isWorldAnvilArticleFile('Person-Asena Unfrid-93f.md'), true);
  assert.equal(isWorldAnvilArticleFile('MilitaryConflict-The Endless war-7e9.md'), true);
  assert.equal(isWorldAnvilArticleFile('meta.md'), false);
  assert.equal(isWorldAnvilArticleFile('descriptionParsed.md'), false);
});

test('review tasks correspond to explicit migration issue flags', () => {
  const issues = ['needs-type-review','needs-era','duplicate-title','existing-codex-match','relationship-review','unresolved-legacy-links','missing-inline-assets'];
  const tasks = issueTasks({ sourceType:'Species', title:'Example', issues });
  assert.equal(tasks.length, issues.length);
  assert.ok(tasks.some((task) => task.includes('Myrkild workflow')));
  assert.ok(tasks.every((task) => task.trim().length > 0));
});

test('completed review tasks stay completed across integration runs', async (t) => {
  const vault = await fs.mkdtemp(path.join(os.tmpdir(), 'viscerium-wa-integration-'));
  t.after(() => fs.rm(vault, { recursive: true, force: true }));

  const importDir = path.join(vault, 'Drafts/WorldAnvil Import');
  const dataDir = path.join(vault, 'System/Imports/WorldAnvil');
  const note = path.join(importDir, 'Law-Resonance-AbC.md');
  await fs.mkdir(importDir, { recursive: true });
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(path.join(dataDir, 'integration-data.json'), '{}', 'utf8');
  await fs.writeFile(path.join(vault, 'Home.md'), '', 'utf8');
  await fs.writeFile(note, `---
title: "Resonance"
status: draft
type: article
import_source: worldanvil
import_issues:
  - "needs-era"
---
Resonance shapes the setting.

<!-- worldanvil-migration-review:start -->
## Import review

- [x] Decide whether legacy World Anvil type **Law** should remain a general article or move into an existing/dedicated Codex structure.
- [ ] Place this import in the correct VISCERIUM era or eras if its chronology is established.
<!-- worldanvil-migration-review:end -->
`, 'utf8');

  const first = await runIntegration({ vault, write: true });
  const afterFirst = await fs.readFile(note, 'utf8');
  const second = await runIntegration({ vault, write: true });

  assert.equal(first.issues.get('legacy-type-review'), undefined);
  assert.equal(first.issues.get('needs-era'), 1);
  assert.match(afterFirst, /^- \[x\] Decide whether legacy World Anvil type/m);
  assert.doesNotMatch(afterFirst, /^  - "legacy-type-review"$/m);
  assert.equal(await fs.readFile(note, 'utf8'), afterFirst);
  assert.equal(second.changed, 0);
});

test('migration Base provides card browsing and actionable review views', () => {
  const base = importBase();
  assert.match(base, /file\.inFolder\("Drafts\/WorldAnvil Import"\)/);
  assert.match(base, /import_source == "worldanvil"/);
  assert.match(base, /type: cards\n    name: Cards/);
  assert.match(base, /name: Needs era/);
  assert.match(base, /name: Type review/);
  assert.match(base, /name: Relationship review/);
  assert.match(base, /name: Link and asset review/);
});
