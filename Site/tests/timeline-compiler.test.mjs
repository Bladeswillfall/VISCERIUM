import test from 'node:test';
import assert from 'node:assert/strict';
import { compileTimelineRecords, TimelineCompilationError } from '../src/lib/timeline/compiler.mjs';

function era(id, order, startYear, endYear, allowGapAfter = false) {
  return {
    sourcePath: `Eras/${id}.md`,
    href: `/eras/${id}/`,
    data: {
      title: id.toUpperCase(),
      description: `${id} era`,
      status: 'published',
      type: 'era',
      eraId: id,
      calendarDate: { calendar: 'okse', year: startYear, month: 'niewmonath', day: 1, precision: 'year' },
      calendarEndDate: { calendar: 'okse', year: endYear, intercalaryDay: 'engimanutur-02', precision: 'year' },
      timeline: { kind: 'era', order, visualToken: `e${order}`, allowGapAfter },
    },
  };
}

function baseEras() {
  return [
    era('citadel', 1, 9201, 9400, true),
    era('smog', 2, 10701, 10900),
    era('nearsight', 3, 10901, 11100, true),
    era('entropy', 4, 11401, 11600),
  ];
}

function event(name, year, overrides = {}) {
  return {
    sourcePath: `Eras/CITADEL/Events/${name}.md`,
    href: `/eras/citadel/events/${name.toLowerCase()}/`,
    data: {
      title: name,
      description: `${name} description`,
      status: 'published',
      type: 'event',
      era: 'CITADEL',
      calendarDate: { calendar: 'okse', year, month: 'niewmonath', day: 1, precision: 'day', certainty: 'exact' },
      timeline: { kind: 'event', importance: 'standard', categories: [], lanes: [], global: 'auto', era: 'auto', ...overrides.timeline },
      ...overrides,
    },
  };
}

test('compiler generates five fixed datasets with chronology-derived membership', () => {
  const records = [...baseEras(), event('Major Battle', 9250, { timeline: { importance: 'major', categories: ['military'], lanes: ['okse-dominion'] } })];
  const compiled = compileTimelineRecords(records);
  assert.deepEqual(Object.keys(compiled.datasets).sort(), ['citadel', 'entropy', 'nearsight', 'smog', 'super']);
  assert.equal(compiled.datasets.citadel.events.length, 1);
  assert.equal(compiled.datasets.super.events.length, 1);
  assert.deepEqual(compiled.events[0].eras, ['citadel']);
  assert.deepEqual(compiled.events[0].categories, ['military']);
  assert.deepEqual(compiled.events[0].lanes, ['okse-dominion']);
});

test('periods overlap every era they touch', () => {
  const crossing = event('Crossing Period', 10900, {
    era: ['SMOG', 'NEARSIGHT'],
    calendarEndDate: { calendar: 'okse', year: 10901, month: 'niewmonath', day: 1, precision: 'day' },
    timeline: { kind: 'period', importance: 'standard' },
  });
  const compiled = compileTimelineRecords([...baseEras(), crossing]);
  assert.deepEqual(compiled.events[0].eras, ['smog', 'nearsight']);
  assert.equal(compiled.datasets.smog.events.length, 1);
  assert.equal(compiled.datasets.nearsight.events.length, 1);
});

test('unknown categories survive with deterministic sorting and multiple lanes', () => {
  const records = [
    ...baseEras(),
    event('Zulu', 9250, { timeline: { importance: 'standard', categories: ['future-category'], lanes: ['a', 'b'], order: 2 } }),
    event('Alpha', 9250, { timeline: { importance: 'standard', categories: [], lanes: [], order: 1 } }),
    event('Major', 9250, { timeline: { importance: 'major' } }),
  ];
  const first = compileTimelineRecords(records);
  const second = compileTimelineRecords([...records].reverse());
  assert.deepEqual(first.events.map((item) => item.title), ['Major', 'Alpha', 'Zulu']);
  assert.deepEqual(second.events.map((item) => item.title), first.events.map((item) => item.title));
  assert.deepEqual(first.events.find((item) => item.title === 'Zulu').categories, ['future-category']);
  assert.deepEqual(first.events.find((item) => item.title === 'Zulu').lanes, ['a', 'b']);
});

test('explicit global include and exclude override automatic super membership', () => {
  const records = [
    ...baseEras(),
    event('Included Minor', 9250, { timeline: { importance: 'minor', global: 'include' } }),
    event('Excluded Landmark', 9251, { timeline: { importance: 'landmark', global: 'exclude' } }),
  ];
  const compiled = compileTimelineRecords(records);
  assert.deepEqual(compiled.datasets.super.events.map((item) => item.title), ['Included Minor']);
});

for (const [name, mutate, pattern] of [
  ['missing start date', (record) => { delete record.data.calendarDate; }, /Missing structured calendar date/],
  ['end before start', (record) => { record.data.calendarEndDate = { calendar: 'okse', year: 9249, month: 'niewmonath', day: 1 }; }, /earlier than its start/],
  ['mismatched era', (record) => { record.data.era = 'SMOG'; }, /conflicts with chronology/],
  ['invalid importance', (record) => { record.data.timeline.importance = 'critical'; }, /Invalid importance/],
  ['period without end', (record) => { record.data.timeline.kind = 'period'; }, /requires calendarEndDate/],
  ['legacy timeline year', (record) => { record.data.timeline.year = 9250; }, /Legacy timeline.year/],
]) {
  test(`compiler rejects ${name}`, () => {
    const record = event('Broken', 9250);
    mutate(record);
    assert.throws(() => compileTimelineRecords([...baseEras(), record]), (error) => {
      assert.ok(error instanceof TimelineCompilationError);
      assert.match(error.message, pattern);
      assert.match(error.message, /Broken\.md/);
      return true;
    });
  });
}

test('compiler rejects unintended era overlap and gaps', () => {
  const overlapping = baseEras();
  overlapping[1].data.calendarDate.year = 9400;
  assert.throws(() => compileTimelineRecords(overlapping), /overlaps/);

  const gapped = baseEras();
  gapped[1].data.timeline.allowGapAfter = false;
  gapped[2].data.calendarDate.year = 10905;
  assert.throws(() => compileTimelineRecords(gapped), /Gap follows era 'smog'/);
});
