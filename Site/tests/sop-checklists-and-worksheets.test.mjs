import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(process.cwd(), '..');
const read = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
const exists = (relativePath) => fs.existsSync(path.join(repoRoot, relativePath));

const newSops = [
  'Vault/System/SOPs/012 - Nation Article Authoring SOP.md',
  'Vault/System/SOPs/013 - Settlement Article Authoring SOP.md',
  'Vault/System/SOPs/014 - Political Character Authoring SOP.md',
];

const checklistFiles = [
  'Vault/System/SOPs/Checklists/002a - Entity Article Publication Checklist.md',
  'Vault/System/SOPs/Checklists/004a - Frontmatter Publication Checklist.md',
  'Vault/System/SOPs/Checklists/005a - Article Image Layout Publication Checklist.md',
  'Vault/System/SOPs/Checklists/009a - Atlas Publication Checklist.md',
  'Vault/System/SOPs/Checklists/010a - Storyteller Publication Checklist.md',
  'Vault/System/SOPs/Checklists/011a - Sourcebook Reference Readiness Checklist.md',
  'Vault/System/SOPs/Checklists/012a - Nation Article Publication Checklist.md',
  'Vault/System/SOPs/Checklists/012b - Nation Article Reference Readiness Checklist.md',
  'Vault/System/SOPs/Checklists/013a - Settlement Article Publication Checklist.md',
  'Vault/System/SOPs/Checklists/013b - Settlement Article Reference Readiness Checklist.md',
  'Vault/System/SOPs/Checklists/014a - Political Character Publication Checklist.md',
];

const worksheetFiles = [
  'Vault/System/SOPs/Worksheets/012-W01 - Culture Coherence Worksheet.md',
  'Vault/System/SOPs/Worksheets/012-W02 - Political System and Fracture Worksheet.md',
  'Vault/System/SOPs/Worksheets/012-W03 - Resource Economy and Logistics Worksheet.md',
  'Vault/System/SOPs/Worksheets/012-W04 - CITADEL and SMOG Research Baseline Worksheet.md',
  'Vault/System/SOPs/Worksheets/013-W01 - Settlement Location and Support Worksheet.md',
  'Vault/System/SOPs/Worksheets/013-W02 - CITADEL Population Estimate Worksheet.md',
  'Vault/System/SOPs/Worksheets/014-W01 - Political Character Conflict Worksheet.md',
];

const sourceFiles = [
  'Vault/System/References/Source Notes/SRC-001 - The Grainbound Worksheets.md',
  'Vault/System/References/Source Notes/SRC-002 - Build Kingdoms.md',
  'Vault/System/References/Source Notes/SRC-003 - Worldbuilding and History Stack Exchange.md',
  'Vault/System/References/Source Notes/SRC-004 - Medieval Demographics Made Easy.md',
  'Vault/System/References/Source Notes/SRC-005 - Food Timeline.md',
  'Vault/System/References/Source Notes/SRC-006 - Equipment and Process Visual References.md',
];

test('the SOP index assigns permanent identifiers and links readiness tools', () => {
  const index = read('Vault/System/SOPs/SOP Index.md');

  for (let number = 1; number <= 14; number += 1) {
    const id = `SOP-${String(number).padStart(3, '0')}`;
    assert.match(index, new RegExp(`\\b${id}\\b`), `SOP index must include ${id}`);
  }

  assert.match(index, /\[\[Checklists\/Checklist Index\|Checklist Index\]\]/);
  assert.match(index, /\[\[Worksheets\/Worksheet Index\|Worksheet Index\]\]/);
  assert.match(index, /Research Source Register/);
  assert.match(index, /Do not renumber an existing SOP/);
});

test('new subject SOPs use the shared structure and link their tools', () => {
  for (const file of newSops) {
    assert.ok(exists(file), `${file} must exist`);
    const content = read(file);

    assert.match(content, /^---[\s\S]*document_type: sop[\s\S]*sop_id: SOP-\d{3}[\s\S]*---/);
    assert.match(content, /> \*\*Use this SOP when:\*\*/);
    assert.match(content, /> \*\*Result:\*\*/);
    assert.match(content, /> \*\*First action:\*\*/);
    assert.match(content, /\[\[Documentation Writing Standard\]\]/);
    assert.match(content, /## Verification checklist/);
    assert.match(content, /## Check the result/);
    assert.match(content, /## Stop condition/);
  }
});

test('checklists have unique identifiers, parent links, and readiness decisions', () => {
  const identifiers = new Set();

  for (const file of checklistFiles) {
    assert.ok(exists(file), `${file} must exist`);
    const content = read(file);
    const id = content.match(/checklist_id: (CHK-\d{3}[a-z])/i)?.[1];

    assert.ok(id, `${file} must declare checklist_id`);
    assert.ok(!identifiers.has(id), `${id} must be unique`);
    identifiers.add(id);

    assert.match(content, /document_type: checklist/);
    assert.match(content, /parent_sop: SOP-\d{3}/);
    assert.match(content, /readiness_level: (publication|reference)/);
    assert.match(content, /> \*\*Parent (SOP|workflow|guide):\*\*/);
    assert.match(content, /## Decision/);
    assert.match(content, /- \[ \] \*\*(Publication ready|Reference ready)/);
  }
});

test('worksheets preserve provenance, assumptions, departures, and VISCERIUM additions', () => {
  const identifiers = new Set();
  const requiredSections = [
    '## Completion record',
    '## Assumptions and confidence',
    '## Departures from the research baseline',
    '## Sources and adaptation notes',
    '## Original VISCERIUM additions',
  ];

  for (const file of worksheetFiles) {
    assert.ok(exists(file), `${file} must exist`);
    const content = read(file);
    const id = content.match(/worksheet_id: (WKS-\d{3}-\d{2})/)?.[1];

    assert.ok(id, `${file} must declare worksheet_id`);
    assert.ok(!identifiers.has(id), `${id} must be unique`);
    identifiers.add(id);

    assert.match(content, /document_type: worksheet/);
    assert.match(content, /parent_sop: SOP-\d{3}/);
    assert.match(content, /contributors:/);
    assert.match(content, /sources:/);

    for (const section of requiredSections) {
      assert.ok(content.includes(section), `${file} must include ${section}`);
    }
  }
});

test('the research register and source notes describe evidence and adaptation limits', () => {
  const register = read('Vault/System/References/Research Source Register.md');

  for (let number = 1; number <= 6; number += 1) {
    const id = `SRC-${String(number).padStart(3, '0')}`;
    assert.match(register, new RegExp(`\\b${id}\\b`), `source register must include ${id}`);
  }

  assert.match(register, /Attribution records provenance\. It does not replace permission\./);
  assert.match(register, /adapted-calculation/);
  assert.match(register, /community-analysis/);
  assert.match(register, /visual-inspiration/);

  for (const file of sourceFiles) {
    assert.ok(exists(file), `${file} must exist`);
    const content = read(file);
    assert.match(content, /source_id: SRC-\d{3}/);
    assert.match(content, /evidence_role:/);
    assert.match(content, /## Suitable uses/);
    assert.match(content, /## (VISCERIUM adaptation rules|Adaptation rules)/);
    assert.match(content, /## Unsuitable claims/);
  }
});

test('estimation worksheets label models and expose source-dependent assumptions', () => {
  const population = read('Vault/System/SOPs/Worksheets/013-W02 - CITADEL Population Estimate Worksheet.md');

  assert.match(population, /model_status: planning-estimate/);
  assert.match(population, /> \*\*Model status:\*\* Planning estimate/);
  assert.match(population, /The result is not canon/);
  assert.match(population, /> \*\*Source basis:\*\*/);
  assert.match(population, /## 8\. Run sensitivity checks/);
  assert.match(population, /## 9\. Choose the canon expression/);
});

test('established SOPs link to their new reciprocal checklists', () => {
  const expectedLinks = new Map([
    ['Vault/System/SOPs/Entity Authoring SOP.md', 'Checklists/002a - Entity Article Publication Checklist'],
    ['Vault/System/SOPs/Frontmatter Authoring Workflow.md', 'Checklists/004a - Frontmatter Publication Checklist'],
    ['Vault/System/SOPs/Article Image Layout.md', 'Checklists/005a - Article Image Layout Publication Checklist'],
    ['Vault/System/SOPs/Atlas Authoring SOP.md', 'Checklists/009a - Atlas Publication Checklist'],
    ['Vault/System/SOPs/Storyteller View SOP.md', 'Checklists/010a - Storyteller Publication Checklist'],
    ['Vault/System/SOPs/Sourcebook Readiness SOP.md', 'Checklists/011a - Sourcebook Reference Readiness Checklist'],
  ]);

  for (const [file, link] of expectedLinks) {
    assert.match(read(file), new RegExp(link.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
