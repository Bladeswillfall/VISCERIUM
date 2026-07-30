import test from 'node:test';
import assert from 'node:assert/strict';
import { extractVehicleSidebar, normaliseVehicleMarkdown } from '../scripts/normalise-worldanvil-vehicle-sidebars.mjs';

test('extracts road vehicle dimensions, power plant and suspension', () => {
  const source = `Vehicle prose.\n\nRole\n\nProtected patrol vehicle\n\nManufacturer\n\n[TBC]\n\nLength\n\n6.25m (20.50ft)\n\nWidth\n\n2.75m (9.02ft)\n\nHeight\n\n2.27m (7.44ft)\n\nWeight\n\n9,500kg (20,944lbs)\n\nArmament\n\nVariable\n\nCrew\n\n1+4\n\n**Power plant**\n\nEngine\n\nV8 5.5L petrol\n\nPower output\n\n760hp (566kW)\n\nTorque output\n\n698lb⋅ft (946N⋅m)\n\nTop speed\n\n90mph (145kph)\n\nTransmission\n\n5-speed automatic\n\nDrivetrain\n\n4x4 with front and rear LSD differentials\n\n**Suspension**\n\nSpring type\n\nCoil-over shock absorbers\n\nAxle type\n\nPortal axles\n\n_All artwork that isn't an original creation by myself will be replaced._\n`;

  const result = extractVehicleSidebar(source);
  assert.ok(result.sidebar);
  assert.equal(result.sidebar.meta.find((field) => field.label === 'Role').value, 'Protected patrol vehicle');
  assert.equal(result.sidebar.meta.some((field) => field.label === 'Manufacturer'), false);
  const specs = result.sidebar.sections.find((section) => section.title === 'Specifications');
  const power = result.sidebar.sections.find((section) => section.title === 'Power plant');
  const suspension = result.sidebar.sections.find((section) => section.title === 'Suspension');
  assert.equal(specs.fields.find((field) => field.label === 'Armament').value, 'Variable');
  assert.equal(power.fields.find((field) => field.label === 'Engine').value, 'V8 5.5L petrol');
  assert.equal(power.fields.find((field) => field.label === 'Top speed').value, '90mph (145kph)');
  assert.equal(suspension.fields.find((field) => field.label === 'Axle type').value, 'Portal axles');
});

test('treats nested aircraft armament as a section instead of cross-pairing labels', () => {
  const source = `Aircraft prose.\n\nRole\n\nDropship/Gunship\n\nManufacturer\n\nSigd Aerospace\n\nWeight\n\n14,700kg (32,407lbs)\n\nCrew\n\n4+8\n\nLevel Flight Top Speed (VH)\n\n765km/h (475mph)\n\nDesign Diving Speed (VD)\n\n1358km/h (843mph)\n\n**Armament**\n\nNose Gun\n\nKW-42 - 35x228mm, ABM or HESH rounds\n\nDoor Gun(s)\n\nMk.82 - 12.7x99mm, UVc rounds\n\n_All artwork that isn't an original creation by myself will be replaced._\n`;

  const result = extractVehicleSidebar(source);
  const armament = result.sidebar.sections.find((section) => section.title === 'Armament');
  assert.ok(armament);
  assert.equal(armament.fields.find((field) => field.label === 'Nose gun').value, 'KW-42 - 35x228mm, ABM or HESH rounds');
  assert.equal(armament.fields.find((field) => field.label === 'Door gun(s)').value, 'Mk.82 - 12.7x99mm, UVc rounds');
  assert.equal(result.body.includes('Door Gun(s)'), false);
});

test('drops empty and unit-only vehicle-template placeholders', () => {
  const source = `Vehicle prose.\n\nRole\n\nAmphibious Infantry Fighting Vehicle\n\nManufacturer\n\n[TBC]\n\nLength\n\n__m (__ft)\n\nWeight\n\n__kg (__lbs)\n\n**Power plant**\n\nEngine\n\nL\n\nPower output\n\nhp (kW)\n\nPWR ratio (standard)(hp/lb)\n\nPWR ratio (plus e-power)(hp/lb)\n\nTransmission\n\nDrivetrain\n\nRange extender\n\nkW\n\n**Suspension**\n\nSpring type\n\nAxle type\n\n_All artwork that isn't an original creation by myself will be replaced._\n`;

  const result = extractVehicleSidebar(source);
  assert.deepEqual(result.sidebar.meta, [{ label: 'Role', value: 'Amphibious Infantry Fighting Vehicle' }]);
  assert.equal(result.sidebar.sections.some((section) => section.title === 'Specifications'), false);
  assert.equal(result.sidebar.sections.some((section) => section.title === 'Power plant'), false);
  assert.equal(result.sidebar.sections.some((section) => section.title === 'Suspension'), false);
  assert.equal(result.body.includes('[TBC]'), false);
  assert.equal(result.body.includes('hp (kW)'), false);
});

test('normalised vehicles are then safe for the general pass to skip', () => {
  const source = `Role\n\nStealth multirole fighter\n\nManufacturer\n\nMakolev\n\nWeight\n\nCrew\n\n_All artwork that isn't an original creation by myself will be replaced._\n`;
  const result = normaliseVehicleMarkdown(source);
  assert.equal(result.changed, true);
  assert.match(result.markdown, /^---\nsidebar:\n  replaceMeta: true/);
  assert.match(result.markdown, /label: "Role"/);
  assert.match(result.markdown, /value: "Stealth multirole fighter"/);
  assert.equal(result.markdown.includes('\nWeight\n'), false);
  assert.equal(result.markdown.includes('\nCrew\n'), false);
});
