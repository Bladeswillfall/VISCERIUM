import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractLegacySidebar,
  normaliseImportedMarkdown,
  sidebarYaml,
} from '../scripts/normalise-worldanvil-sidebars.mjs';

test('extracts Asena-style person details into meta and Appearance', () => {
  const source = `Intro paragraph.\n\n[![](portrait.png)](/i/1)\n\nAsena Unfrid by Artist\n\nTitle\n\nFrue\n\nPronouns\n\nShe/Her\n\nAge\n\n34\n\nGender\n\nFemale\n\nEyes\n\nGrey-blue\n\nHair\n\nAsh brown, long length, straight\n\nSkin Tone/Pigmentation\n\nLight pale white, lightly freckled\n\nHeight\n\n5'5\" (1.65m)\n\nWeight\n\n150lbs (68kg)\n\nPhysical traits\n\nLean with a rectangular body shape\n\n**Children**\n\n_All artwork that isn't an original creation by myself will be replaced._\n\n## History\n\nHistory text.\n`;

  const result = extractLegacySidebar(source, 'Person-Asena Unfrid-93f.md');
  assert.ok(result.sidebar);
  assert.deepEqual(result.sidebar.meta.map((field) => [field.label, field.value]), [
    ['Title', 'Frue'],
    ['Pronouns', 'She/Her'],
    ['Age', '34'],
    ['Gender', 'Female'],
  ]);
  const appearance = result.sidebar.sections.find((section) => section.title === 'Appearance');
  assert.ok(appearance);
  assert.equal(appearance.fields.find((field) => field.label === 'Height').value, `5'5\" (1.65m)`);
  assert.equal(appearance.fields.find((field) => field.label === 'Physical traits').value, 'Lean with a rectangular body shape');
  assert.equal(result.body.includes('\nPronouns\n'), false);
  assert.equal(result.body.includes('## History'), true);
  assert.equal(result.body.includes("All artwork that isn't an original creation"), true);
});

test('routes item specifications and options without treating Production as Origin', () => {
  const source = `Item text.\n\n![](rifle.png)\n\nManufacturer\n\nAtheris\n\nOrigin\n\nProduction\n\n**Specifications**\n\nAmmunition\n\n11.63x53.5mm (.45-70 Government)\n\nLength\n\n47cm (18.5\")\n\nWeight\n\n2.56kg (5.64lbs)\n\nEffective range\n\n~80m (262.46ft)\n\nFeatures\n\nAmbidextrous design, Integral suppressor\n\n**Options**\n\nFiring-mode(s)\n\nAuto or semi-auto\n\nStock\n\nRetractable stock\n\n**Item type**\n\nWeapon, Ranged\n`;

  const result = extractLegacySidebar(source, 'Item-Atheris CQ-90-508.md');
  assert.ok(result.sidebar);
  assert.equal(result.sidebar.meta.find((field) => field.label === 'Manufacturer').value, 'Atheris');
  assert.equal(result.sidebar.meta.some((field) => field.label === 'Origin'), false);
  assert.equal(result.sidebar.meta.find((field) => field.label === 'Item type').value, 'Weapon, Ranged');
  const specs = result.sidebar.sections.find((section) => section.title === 'Specifications');
  const options = result.sidebar.sections.find((section) => section.title === 'Options');
  assert.ok(specs);
  assert.ok(options);
  assert.equal(specs.fields.find((field) => field.label === 'Weight').value, '2.56kg (5.64lbs)');
  assert.equal(options.fields.find((field) => field.label === 'Firing modes').value, 'Auto or semi-auto');
});

test('extracts settlement type, related history, leadership and places', () => {
  const source = `Settlement text.\n\n![](crest.png)\n\n**Type**\n\nLarge town\n\n**Related Historical Events**\n\n- 11203\n\n[Test](/history/test)\n\nRuler(s)\n\nJarl - Søren Vilulf,\nFrue - Asena Unfrid\n\nPlaces of note\n\nAldaborg fortress,\nJarl's Longhouse,\nSalt Market,\nMain Port,\n\n_All artwork that isn't an original creation by myself will be replaced._\n\n## Defences\n`;

  const result = extractLegacySidebar(source, 'Settlement-Aldaness-1ae.md');
  assert.ok(result.sidebar);
  assert.equal(result.sidebar.meta.find((field) => field.label === 'Type').value, 'Large town');
  const leadership = result.sidebar.sections.find((section) => section.title === 'Leadership');
  const places = result.sidebar.sections.find((section) => section.title === 'Places of note');
  const history = result.sidebar.sections.find((section) => section.title === 'Related historical events');
  assert.ok(leadership);
  assert.ok(places);
  assert.ok(history);
  assert.deepEqual(leadership.fields[0].value, ['Jarl - Søren Vilulf', 'Frue - Asena Unfrid']);
  assert.deepEqual(places.items, ['Aldaborg fortress', "Jarl's Longhouse", 'Salt Market', 'Main Port']);
  assert.equal(history.items.some((item) => typeof item === 'object' && item.label === 'Test' && item.href === '/history/test'), true);
  assert.equal(result.body.includes('## Defences'), true);
});

test('preserves additional material fields instead of swallowing them into Origin', () => {
  const source = `Material prose.\n\nType\n\nBiocrystalline Material\n\nOrigin\n\nExpelled Myrkild mineral waste\n\nRarity\n\nRare / Hazardous to harvest\n\nFound In\n\nTransit rifts, nest-chambers, feeding pits\n\nPrimary Property\n\nAbsorbs and deadens Resonance\n\nFormation Driver\n\nMyrkild bio-harmonics acting upon rejected inorganic residue\n\n_All artwork that isn't an original creation by myself will be replaced._\n`;

  const result = extractLegacySidebar(source, 'Material-Harmonic Sinspar-916.md');
  assert.ok(result.sidebar);
  assert.equal(result.sidebar.meta.find((field) => field.label === 'Origin').value, 'Expelled Myrkild mineral waste');
  assert.equal(result.sidebar.meta.find((field) => field.label === 'Rarity').value, 'Rare / Hazardous to harvest');
  const details = result.sidebar.sections.find((section) => section.title === 'Details');
  assert.ok(details);
  assert.equal(details.fields.find((field) => field.label === 'Found in').value, 'Transit rifts, nest-chambers, feeding pits');
  assert.equal(details.fields.find((field) => field.label === 'Primary property').value, 'Absorbs and deadens Resonance');
  assert.equal(details.fields.find((field) => field.label === 'Formation driver').value, 'Myrkild bio-harmonics acting upon rejected inorganic residue');
});

test('keeps medication administration fields separate', () => {
  const source = `Drug prose.\n\n**Item type**\n\nMedical\n\nRoute of administration\n\nInhalation\n\nOnset of action\n\n~3 seconds\n\nElimination half-life\n\n2-3hours\n\n_All artwork that isn't an original creation by myself will be replaced._\n`;

  const result = extractLegacySidebar(source, 'Item-Amphetalgescicortisone-ff2.md');
  const administration = result.sidebar.sections.find((section) => section.title === 'Administration');
  assert.ok(administration);
  assert.equal(administration.fields.find((field) => field.label === 'Route of administration').value, 'Inhalation');
  assert.equal(administration.fields.find((field) => field.label === 'Onset of action').value, '~3 seconds');
  assert.equal(administration.fields.find((field) => field.label === 'Elimination half-life').value, '2-3hours');
});

test('preserves active member lists as sidebar items', () => {
  const source = `Formation prose.\n\n**Type**\n\nSpecial Forces\n\nMembers (Active)\n\n**Delta Two One**  \nCpl. May Zhang,  \n[Tpr. Bailey Pittman](/w/viscerium/a/tpr-bailey-pittman-person),  \nTpr. Tobi Schöler,  \nTpr. Louis Hodari,  \n**Delta Two Two**  \nLCpl. Akanni Balogun,  \nTpr. Mía Alvarado,  \nTpr. Ilya Artemiy Valerianovich\n\n_All artwork that isn't an original creation by myself will be replaced._\n`;

  const result = extractLegacySidebar(source, 'Formation-Delta Two-d23.md');
  const members = result.sidebar.sections.find((section) => section.title === 'Members');
  assert.ok(members);
  assert.equal(members.items.includes('Cpl. May Zhang'), true);
  assert.equal(members.items.includes('Tpr. Ilya Artemiy Valerianovich'), true);
  assert.equal(result.body.includes('Tpr. Ilya Artemiy Valerianovich'), false);
});

test('keeps largest-recorded measurements in their own section', () => {
  const source = `Creature prose.\n\nAvg. Height\n\n~10ft (3.05m)\n\nAvg. Weight\n\n~525lbs (238.13kg)\n\n**Largest recorded:**\n\nHeight\n\n11.1ft (3.38m)\n\nWeight\n\n676lbs (306.62kg)\n\n_All artwork that isn't an original creation by myself will be replaced._\n`;

  const result = extractLegacySidebar(source, 'Condition-Abberath-88a.md');
  const profile = result.sidebar.sections.find((section) => section.title === 'Physical profile');
  const largest = result.sidebar.sections.find((section) => section.title === 'Largest recorded');
  assert.equal(profile.fields.find((field) => field.label === 'Average height').value, '~10ft (3.05m)');
  assert.equal(profile.fields.find((field) => field.label === 'Average weight').value, '~525lbs (238.13kg)');
  assert.equal(largest.fields.find((field) => field.label === 'Height').value, '11.1ft (3.38m)');
  assert.equal(largest.fields.find((field) => field.label === 'Weight').value, '676lbs (306.62kg)');
});

test('removes an orphaned Details heading when its legacy fields are extracted', () => {
  const source = `Intro.\n\n## Details\n\nPronouns\n\nShe/Her\n\nAge\n\n34\n\n## History\n\nHistory.\n`;
  const result = extractLegacySidebar(source, 'Person-Test-000.md');
  assert.ok(result.sidebar);
  assert.equal(result.body.includes('## Details'), false);
  assert.equal(result.body.includes('## History'), true);
});

test('does not treat a lone prose label as a confident sidebar without legacy context', () => {
  const source = `## Biography\n\nAge\n\nAge was something the chroniclers argued about for decades.\n\nThe story continues here.\n`;
  const result = extractLegacySidebar(source, 'Person-Test-000.md');
  assert.equal(result.sidebar, null);
  assert.equal(result.body, source);
});

test('adds sidebar frontmatter without rewriting existing frontmatter', () => {
  const source = `---\ntitle: Test Person\nstatus: draft\ntype: character\n---\nIntro.\n\n![](portrait.png)\n\nPronouns\n\nShe/Her\n\nAge\n\n34\n`;
  const result = normaliseImportedMarkdown(source, 'Person-Test-000.md');
  assert.equal(result.changed, true);
  assert.match(result.markdown, /^---\ntitle: Test Person\nstatus: draft\ntype: character\nsidebar:/);
  assert.match(result.markdown, /replaceMeta: true/);
  assert.equal(result.markdown.includes('\nPronouns\n'), false);
});

test('leaves notes with an existing sidebar untouched', () => {
  const source = `---\ntitle: Existing\nsidebar:\n  replaceMeta: true\n---\nPronouns\n\nShe/Her\n\nAge\n\n34\n`;
  const result = normaliseImportedMarkdown(source, 'Person-Existing-000.md');
  assert.equal(result.changed, false);
  assert.equal(result.reason, 'existing-sidebar');
  assert.equal(result.markdown, source);
});

test('sidebar YAML matches the current replaceMeta/meta/sections shape', () => {
  const yaml = sidebarYaml({
    meta: [{ label: 'Pronouns', value: 'She/Her' }],
    sections: [{ title: 'Appearance', fields: [{ label: 'Eyes', value: 'Grey-blue' }], items: [] }],
  });
  assert.match(yaml, /^sidebar:\n  replaceMeta: true/m);
  assert.match(yaml, /  meta:\n    - label: "Pronouns"\n      value: "She\/Her"/);
  assert.match(yaml, /  sections:\n    - title: "Appearance"\n      fields:/);
});
