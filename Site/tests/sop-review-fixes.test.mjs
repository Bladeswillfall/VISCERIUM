import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(process.cwd(), '..');
const read = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

const sopFiles = new Map([
  ['SOP-001', 'Vault/System/SOPs/World Anvil Migration SOP.md'],
  ['SOP-002', 'Vault/System/SOPs/Entity Authoring SOP.md'],
  ['SOP-003', 'Vault/System/SOPs/Story Entity Workflow SOP.md'],
  ['SOP-004', 'Vault/System/SOPs/Frontmatter Authoring Workflow.md'],
  ['SOP-005', 'Vault/System/SOPs/Article Image Layout.md'],
  ['SOP-006', 'Vault/System/SOPs/Era Edition Workflow SOP.md'],
  ['SOP-007', 'Vault/System/SOPs/Schema Change SOP.md'],
  ['SOP-008', 'Vault/System/SOPs/Relationship Authoring SOP.md'],
  ['SOP-009', 'Vault/System/SOPs/Atlas Authoring SOP.md'],
  ['SOP-010', 'Vault/System/SOPs/Storyteller View SOP.md'],
  ['SOP-011', 'Vault/System/SOPs/Sourcebook Readiness SOP.md'],
  ['SOP-012', 'Vault/System/SOPs/012 - Nation Article Authoring SOP.md'],
  ['SOP-013', 'Vault/System/SOPs/013 - Settlement Article Authoring SOP.md'],
  ['SOP-014', 'Vault/System/SOPs/014 - Political Character Authoring SOP.md'],
]);

const worksheetFiles = [
  'Vault/System/SOPs/Worksheets/012-W01 - Culture Coherence Worksheet.md',
  'Vault/System/SOPs/Worksheets/012-W02 - Political System and Fracture Worksheet.md',
  'Vault/System/SOPs/Worksheets/012-W03 - Resource Economy and Logistics Worksheet.md',
  'Vault/System/SOPs/Worksheets/012-W04 - CITADEL and SMOG Research Baseline Worksheet.md',
  'Vault/System/SOPs/Worksheets/013-W01 - Settlement Location and Support Worksheet.md',
  'Vault/System/SOPs/Worksheets/013-W02 - CITADEL Population Estimate Worksheet.md',
  'Vault/System/SOPs/Worksheets/014-W01 - Political Character Conflict Worksheet.md',
];

const evidenceRoles = new Set([
  'primary',
  'scholarly-secondary',
  'reputable-reference',
  'practical-synthesis',
  'community-analysis',
  'visual-inspiration',
  'unverified',
]);

const extractFrontmatter = (content, file) => {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(match, `${file} must have YAML frontmatter`);
  return match[1];
};

const usageValues = (frontmatter) => {
  const values = [];
  const lines = frontmatter.split('\n');
  let usageIndent = null;

  for (const line of lines) {
    const indent = line.match(/^\s*/)[0].length;
    const trimmed = line.trim();

    if (/^usage:\s*\[/.test(trimmed)) {
      const inline = trimmed.match(/^usage:\s*\[(.*)\]$/)?.[1] ?? '';
      values.push(...inline.split(',').map((value) => value.trim()).filter(Boolean));
      usageIndent = null;
      continue;
    }

    if (trimmed === 'usage:') {
      usageIndent = indent;
      continue;
    }

    if (usageIndent !== null) {
      if (!trimmed) continue;
      if (indent <= usageIndent) {
        usageIndent = null;
      } else if (trimmed.startsWith('- ')) {
        values.push(trimmed.slice(2).trim());
      }
    }
  }

  return values;
};

test('every permanent SOP identifier resolves to one SOP file', () => {
  const seen = new Set();

  for (const [sopId, file] of sopFiles) {
    const frontmatter = extractFrontmatter(read(file), file);
    assert.match(frontmatter, /(?:^|\n)document_type: sop(?:\n|$)/, `${file} must identify itself as an SOP`);
    assert.match(frontmatter, new RegExp(`(?:^|\\n)sop_id: ${sopId}(?:\\n|$)`), `${file} must own ${sopId}`);
    assert.ok(!seen.has(sopId), `${sopId} must be unique`);
    seen.add(sopId);
  }
});

test('worksheet sources separate evidence roles from usage types', () => {
  for (const file of worksheetFiles) {
    const frontmatter = extractFrontmatter(read(file), file);
    const sourceCount = (frontmatter.match(/(?:^|\n)\s*- source_id:/g) ?? []).length;
    const evidenceCount = (frontmatter.match(/(?:^|\n)\s+evidence_role:/g) ?? []).length;

    assert.equal(evidenceCount, sourceCount, `${file} must give each source one evidence_role`);

    for (const usage of usageValues(frontmatter)) {
      assert.ok(!evidenceRoles.has(usage), `${file} must not store evidence role ${usage} in usage`);
    }
  }
});

test('population estimate preserves food extracted for the target settlement', () => {
  const file = 'Vault/System/SOPs/Worksheets/013-W02 - CITADEL Population Estimate Worksheet.md';
  const content = read(file);

  assert.match(content, /## 5\. Estimate target-bound food/);
  assert.match(content, /Extraction diverted elsewhere/);
  assert.match(content, /target-bound amount = gross output - reserves - subsistence - extraction diverted elsewhere - spoilage - local use/);
  assert.match(content, /remains in the total when its destination still supplies the target settlement/);
  assert.doesNotMatch(content, /exportable amount = gross output - reserves - subsistence - extraction - spoilage - local use/);
});
