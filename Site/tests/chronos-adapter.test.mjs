import test from 'node:test';
import assert from 'node:assert/strict';
import { createChronosTimelineModel } from '../src/lib/timeline/chronos-adapter.mjs';
import { syntheticDateToAbsoluteDay } from '../src/lib/timeline/core.mjs';

function fixture() {
  const events = [
    {
      id: 'event-a',
      title: 'First event',
      description: 'A point event.',
      href: '/first/',
      absoluteStartDay: 10,
      precision: 'day',
      certainty: 'exact',
      kind: 'event',
      importance: 'major',
      categories: ['military'],
      lanes: ['okse-dominion'],
    },
    {
      id: 'event-b',
      title: 'Long event',
      description: 'A ranged event.',
      href: '/long/',
      absoluteStartDay: 20,
      absoluteEndDay: 25,
      precision: 'year',
      endPrecision: 'year',
      certainty: 'disputed',
      kind: 'period',
      importance: 'standard',
      categories: ['unmapped-category'],
      lanes: [],
    },
    {
      id: 'event-c',
      title: 'Landmark point',
      description: 'A Chronos point item.',
      href: '/landmark/',
      absoluteStartDay: 30,
      precision: 'month',
      certainty: 'legendary',
      kind: 'milestone',
      importance: 'landmark',
      categories: ['resonance'],
      lanes: ['okse-dominion'],
    },
  ];

  return {
    id: 'super',
    title: 'Super timeline',
    absoluteStartDay: 0,
    absoluteEndDay: 100,
    events,
    eras: [
      {
        id: 'citadel',
        title: 'CITADEL',
        href: '/eras/citadel/',
        visualToken: 'e1',
        absoluteStartDay: 0,
        absoluteEndDay: 50,
      },
    ],
  };
}

test('serializes canonical records through native Chronos syntax and parsing', () => {
  const dataset = fixture();
  const model = createChronosTimelineModel({
    dataset,
    formatEventDate: (event) => `day ${event.absoluteStartDay}`,
  });

  assert.match(model.source, /> NOTODAY/);
  assert.match(model.source, /> ORDERBY start/);
  assert.match(model.source, /@ \[[^\]]+\] #orange \{Chronology\} CITADEL/);
  assert.match(model.source, /- \[[^\]]+\] #orange \{Chronology\} First event \| A point event\./);
  assert.match(model.source, /\* \[[^\]]+\] #purple \{Chronology\} Landmark point/);

  assert.equal(model.groups.length, 1);
  assert.equal(model.groups[0].content, 'Chronology');
  assert.equal(model.parsed.groups, model.groups);
  assert.equal(model.parsed.markers.length, 0);
  assert.equal(model.parsed.flags.noToday, true);

  const first = model.items.find((item) => item.id === 'event-a');
  assert.equal(first.type, undefined);
  assert.equal(first.group, model.groups[0].id);
  assert.equal(syntheticDateToAbsoluteDay(first.start), 10);
  assert.match(first.className, /is-link/);
  assert.match(first.className, /importance-major/);
  assert.match(first.title, /day 10/);
  assert.match(first.style, /chronos-color-orange/);

  const period = model.items.find((item) => item.id === 'event-b');
  assert.equal(period.type, undefined);
  assert.equal(syntheticDateToAbsoluteDay(period.start), 20);
  assert.equal(syntheticDateToAbsoluteDay(period.end), 26);
  assert.match(period.className, /with-caps/);
  assert.match(period.className, /category-unknown/);

  const milestone = model.items.find((item) => item.id === 'event-c');
  assert.equal(milestone.type, 'point');
  assert.equal(syntheticDateToAbsoluteDay(milestone.start), 30);
  assert.match(milestone.className, /certainty-legendary/);

  const era = model.items.find((item) => item.id.startsWith('era:citadel:'));
  assert.equal(era.type, 'background');
  assert.equal(syntheticDateToAbsoluteDay(era.start), 0);
  assert.equal(syntheticDateToAbsoluteDay(era.end), 51);
});

test('lets Chronos create native groups from declared lanes without changing chronology', () => {
  const dataset = fixture();
  const model = createChronosTimelineModel({
    dataset,
    laneMode: 'lane',
    formatEventDate: (event) => String(event.absoluteStartDay),
    visibleStartDay: 5,
    visibleEndDay: 40,
  });

  assert.deepEqual(model.groups.map((group) => group.content), ['Okse Dominion', 'Other / unassigned']);
  assert.equal(model.items.find((item) => item.id === 'event-a').group, model.groups[0].id);
  assert.equal(model.items.find((item) => item.id === 'event-b').group, model.groups[1].id);
  assert.equal(syntheticDateToAbsoluteDay(new Date(model.parsed.flags.defaultView.start)), 5);
  assert.equal(syntheticDateToAbsoluteDay(new Date(model.parsed.flags.defaultView.end)), 40);
  assert.equal(model.items.filter((item) => item.id.startsWith('era:citadel:')).length, 2);
});

test('sanitizes parser delimiters while retaining canonical metadata', () => {
  const dataset = fixture();
  dataset.events[0].title = 'First | event';
  dataset.events[0].description = '<unsafe> | detail';
  const model = createChronosTimelineModel({
    dataset,
    formatEventDate: (event) => String(event.absoluteStartDay),
  });
  const item = model.items.find((entry) => entry.id === 'event-a');

  assert.match(model.source, /First — event/);
  assert.match(model.source, /&lt;unsafe&gt; — detail/);
  assert.equal(item.data, dataset.events[0]);
  assert.equal(item.cLink, '/first/');
});

test('maps distant VISCERIUM dates into Chronos four-digit parser years', () => {
  const dataset = fixture();
  const shift = 3_360_000;
  dataset.absoluteStartDay += shift;
  dataset.absoluteEndDay += shift;
  for (const era of dataset.eras) {
    era.absoluteStartDay += shift;
    era.absoluteEndDay += shift;
  }
  for (const event of dataset.events) {
    event.absoluteStartDay += shift;
    if (event.absoluteEndDay !== undefined) event.absoluteEndDay += shift;
  }

  const model = createChronosTimelineModel({
    dataset,
    formatEventDate: (event) => String(event.absoluteStartDay),
  });

  assert.doesNotMatch(model.source, /[+-]\d{6}/);
  assert.match(model.source, /> DEFAULTVIEW 2000-01-01\|2000-04-10/);
  const first = model.items.find((item) => item.id === 'event-a');
  assert.equal(syntheticDateToAbsoluteDay(first.start, model.syntheticOriginDay), shift + 10);
});

test('requires a VISCERIUM date formatter rather than exposing synthetic dates', () => {
  assert.throws(
    () => createChronosTimelineModel({ dataset: fixture() }),
    /requires a date formatter/,
  );
});
