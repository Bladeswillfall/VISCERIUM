import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { worldAnvilTriageBase } from '../scripts/apply-worldanvil-base-triage.mjs';

const vaultBase = path.resolve(process.cwd(), '../Vault/System/Bases/World Anvil Import.base');

function assertActionableBase(base) {
  assert.match(base, /name: Review first/);
  assert.match(base, /formula\.priority_rank/);
  assert.match(base, /formula\.priority_tier/);
  assert.match(base, /Tier 1 · Setting spine/);
  assert.match(base, /Tier 4 · Defer/);
  assert.match(base, /Introduction to VISCERIUM/);
  assert.match(base, /Resonance/);
  assert.match(base, /Myrkild/);
  assert.match(base, /Naranor/);
  assert.match(base, /Aquillan Seas Trade Union/);
  assert.match(base, /Trans-Continental Socialist Confederation/);
  assert.match(base, /Evaxi, Nadir of Envy/);
  assert.match(base, /Toriel, Zenith of Charity/);
  assert.match(base, /tier1_titles:\s*'?\[/);
  assert.match(base, /tier2_titles:\s*'?\[/);
  assert.match(base, /tier3_source_types:\s*'?\[/);
  assert.doesNotMatch(base, /tier1_titles:\s*'?list\(/);
  assert.doesNotMatch(base, /tier2_titles:\s*'?list\(/);
  assert.doesNotMatch(base, /tier3_source_types:\s*'?list\(/);
  assert.match(base, /name: Identity conflicts/);
  assert.match(base, /formula\.issues\.contains\("existing-codex-match"\)/);
  assert.match(base, /formula\.issues\.contains\("duplicate-title"\)/);
  assert.match(base, /name: Needs attention/);
  assert.match(base, /name: Ready to file/);
  assert.match(base, /name: All imports/);
  assert.match(base, /formula\.issue_count > 0/);
  assert.match(base, /⚠ Missing era/);
  assert.match(base, /Compare with current Codex note/);
  assert.match(base, /formula\.era_count/);
  assert.match(base, /Decide continuity and create era editions/);
  assert.match(base, /Set the era with Creator Tools/);
  assert.match(base, /formula\.action_steps/);
  assert.match(base, /displayName: How to do it/);
  assert.match(base, /Open note → Ctrl\/Cmd\+P → Set controlled era \/ Universal scope/);
  assert.match(base, /Review destination and publication status/);
}

test('World Anvil triage Base generator prioritises editorial value without losing migration guidance', () => {
  assertActionableBase(worldAnvilTriageBase());
});

test('checked-in World Anvil Base retains editorial tiers and guided triage semantics after Obsidian reserialises it', async () => {
  assertActionableBase(await fs.readFile(vaultBase, 'utf8'));
});
