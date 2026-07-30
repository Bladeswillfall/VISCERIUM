import test from 'node:test';
import assert from 'node:assert/strict';
import { diagnoseCreatorVault } from '../scripts/vault-doctor.mjs';

function record(relativePath, data) {
  return { relativePath, file: `/tmp/Vault/${relativePath}`, data, content: '' };
}

function ordinary(overrides = {}) {
  return {
    title: 'Red Reed',
    description: 'A test plant.',
    status: 'draft',
    type: 'flora',
    development_level: 'stub',
    eras: ['CITADEL'],
    locations: [],
    biomes: [],
    tags: ['story-entity', 'flora'],
    ...overrides,
  };
}

test('valid ordinary entity passes without requiring optional detail', () => {
  const result = diagnoseCreatorVault({
    records: [record('Drafts/Databases/Flora/Red Reed.md', ordinary())],
  });
  assert.equal(result.ok, true);
  assert.equal(result.errors.length, 0);
});

test('legacy publish booleans are rejected outside templates', () => {
  const result = diagnoseCreatorVault({
    records: [record('Drafts/Notes/Old Workflow.md', {
      title: 'Old Workflow',
      status: 'draft',
      type: 'article',
      publish: false,
    })],
  });
  assert.equal(result.ok, false);
  assert.equal(result.errors.some((item) => item.code === 'legacy-publish-field'), true);
});

test('templates are excluded from creator entity counts and diagnostics', () => {
  const result = diagnoseCreatorVault({
    records: [record('Templates/Databases/Myrkild Unit Profile.md', {
      title: '{{title}}',
      description: 'Template.',
      type: 'myrkild-unit',
      era: 'FUTURE',
      unit_id: 'DUPLICATE-TEMPLATE-ID',
      locations: [],
      biomes: [],
      tags: ['myrkild', 'unit'],
    })],
  });
  assert.equal(result.ok, true);
  assert.equal(result.entityCount, 0);
  assert.deepEqual(result.diagnostics, []);
});

test('folder and type contradictions are errors', () => {
  const result = diagnoseCreatorVault({
    records: [record('Drafts/Databases/Fauna/Red Reed.md', ordinary())],
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.map((item) => item.code).join(','), /folder-type-mismatch/);
});

test('ordinary entity era structure is validated without demanding an era', () => {
  const invalidType = diagnoseCreatorVault({
    records: [record('Drafts/Databases/Flora/Red Reed.md', ordinary({ eras: 'CITADEL' }))],
  });
  assert.equal(invalidType.ok, false);
  assert.match(invalidType.errors.map((item) => item.code).join(','), /eras-type/);

  const unknownEra = diagnoseCreatorVault({
    records: [record('Drafts/Databases/Flora/Red Reed.md', ordinary({ eras: ['CITADEL', 'FUTURE'] }))],
  });
  assert.equal(unknownEra.ok, false);
  assert.match(unknownEra.errors.map((item) => item.code).join(','), /unknown-era/);

  const absentEra = ordinary();
  delete absentEra.eras;
  assert.equal(diagnoseCreatorVault({ records: [record('Drafts/Databases/Flora/Red Reed.md', absentEra)] }).ok, true);
});

test('near matches to canonical titles are notices, not errors', () => {
  const result = diagnoseCreatorVault({
    records: [
      record('Lore/Degel System/Okse Dominion.md', {
        title: 'Okse Dominion',
        description: 'Canonical faction.',
        status: 'published',
        type: 'faction',
      }),
      record('Drafts/Databases/Flora/Red Reed.md', ordinary({ locations: ['Okse Dominon'] })),
    ],
  });
  assert.equal(result.ok, true);
  assert.equal(result.errors.length, 0);
  assert.equal(result.notices.some((item) => item.code === 'near-canonical-name'), true);
  assert.match(result.notices.map((item) => item.message).join('\n'), /Okse Dominion/);
});

test('loose root entities produce a notice but do not fail', () => {
  const result = diagnoseCreatorVault({ records: [record('Red Reed.md', ordinary())] });
  assert.equal(result.ok, true);
  assert.equal(result.notices.some((item) => item.code === 'loose-entity'), true);
});

test('Myrkild keep their specialised singular era and unique unit IDs', () => {
  const base = {
    title: 'Mawspawn',
    description: 'Imported unit.',
    status: 'draft',
    type: 'myrkild-unit',
    era: 'CITADEL',
    locations: [],
    biomes: [],
    tags: ['myrkild', 'unit'],
    unit_id: 'MYR-001',
  };
  const valid = diagnoseCreatorVault({ records: [record('Drafts/Databases/Myrkild Units/Purespawn/CITADEL/Mawspawn.md', base)] });
  assert.equal(valid.ok, true);

  const duplicate = diagnoseCreatorVault({
    records: [
      record('Drafts/Databases/Myrkild Units/Purespawn/CITADEL/Mawspawn.md', base),
      record('Drafts/Databases/Myrkild Units/Purespawn/SMOG/Mawspawn.md', { ...base, era: 'SMOG' }),
    ],
  });
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.errors.some((item) => item.code === 'duplicate-unit-id'), true);
});

test('unknown development states and malformed list properties are errors', () => {
  const result = diagnoseCreatorVault({
    records: [record('Drafts/Databases/Flora/Red Reed.md', ordinary({ development_level: 'half-done', locations: 'Askalia' }))],
  });
  assert.equal(result.ok, false);
  assert.equal(result.errors.some((item) => item.code === 'development-level'), true);
  assert.equal(result.errors.some((item) => item.code === 'property-type'), true);
});
