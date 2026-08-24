import test from 'node:test';
import assert from 'node:assert/strict';
import { createTimelineModel } from '../src/lib/timeline/vis-adapter.mjs';
import { syntheticDateToAbsoluteDay } from '../src/lib/timeline/core.mjs';

const messages = {
  chronology: 'Chronology',
  otherGroup: 'Other / unassigned',
  untitledEvent: 'Untitled event',
  zoomEra: '{era}: use the era control to zoom',
};

function fixture() {
  const events = [
    {
      id: 'event-a', title: 'First event', description: 'A point event.', href: '/first/',
      absoluteStartDay: 10, precision: 'day', certainty: 'exact', kind: 'event',
      importance: 'major', categories: ['military'], lanes: ['okse-dominion'],
    },
    {
      id: 'event-b', title: 'Long event', description: 'A ranged event.', href: '/long/',
      absoluteStartDay: 20, absoluteEndDay: 25, precision: 'year', endPrecision: 'year',
      certainty: 'disputed', kind: 'period', importance: 'standard',
      categories: ['unmapped-category'], lanes: [],
    },
    {
      id: 'event-c', title: 'Landmark point', description: 'A milestone.', href: '/landmark/',
      absoluteStartDay: 30, precision: 'month', certainty: 'legendary', kind: 'milestone',
      importance: 'landmark', categories: ['resonance'], lanes: ['okse-dominion'],
    },
  ];
  return {
    id: 'super', title: 'Super timeline', absoluteStartDay: 0, absoluteEndDay: 100, events,
    eras: [{
      id: 'citadel', title: 'CITADEL', href: '/eras/citadel/', visualToken: 'e1',
      absoluteStartDay: 0, absoluteEndDay: 50,
    }],
  };
}

function create(dataset = fixture(), options = {}) {
  return createTimelineModel({
    dataset,
    messages,
    formatEventDate: (event) => `day ${event.absoluteStartDay}`,
    ...options,
  });
}

test('converts canonical records directly into vis-timeline items', () => {
  const model = create();
  assert.deepEqual(model.groups.map(({ content }) => content), ['Chronology']);
  assert.deepEqual(Object.keys(model).sort(), ['groups', 'items', 'syntheticOriginDay']);

  const first = model.items.find(({ id }) => id === 'event-a');
  assert.equal(first.type, 'box');
  assert.equal(syntheticDateToAbsoluteDay(first.start, model.syntheticOriginDay), 10);
  assert.match(first.className, /importance-major/);
  assert.match(first.className, /category-military/);
  assert.match(first.title, /day 10/);

  const period = model.items.find(({ id }) => id === 'event-b');
  assert.equal(period.type, 'range');
  assert.equal(syntheticDateToAbsoluteDay(period.end, model.syntheticOriginDay), 26);
  assert.match(period.className, /certainty-disputed/);
  assert.match(period.className, /category-unknown/);

  const milestone = model.items.find(({ id }) => id === 'event-c');
  assert.equal(milestone.type, 'point');
  assert.equal(syntheticDateToAbsoluteDay(milestone.start, model.syntheticOriginDay), 30);

  const era = model.items.find(({ id }) => id.startsWith('era:citadel:'));
  assert.equal(era.type, 'background');
  assert.equal(syntheticDateToAbsoluteDay(era.end, model.syntheticOriginDay), 51);
});

test('creates declared-lane groups and assigns ungrouped records to Other', () => {
  const model = create(fixture(), { laneMode: 'lane' });
  assert.deepEqual(model.groups.map(({ content }) => content), ['Okse Dominion', 'Other / unassigned']);
  assert.equal(model.items.find(({ id }) => id === 'event-a').group, model.groups[0].id);
  assert.equal(model.items.find(({ id }) => id === 'event-b').group, model.groups[1].id);
  assert.equal(model.items.filter(({ id }) => id.startsWith('era:citadel:')).length, 2);
});

test('escapes event text while retaining canonical metadata and links', () => {
  const dataset = fixture();
  dataset.events[0].title = '<First & event>';
  dataset.events[0].description = '<unsafe> detail';
  const item = create(dataset).items.find(({ id }) => id === 'event-a');
  assert.equal(item.content, '&lt;First &amp; event&gt;');
  assert.match(item.title, /&lt;unsafe&gt; detail/);
  assert.equal(item.data, dataset.events[0]);
  assert.equal(item.cLink, '/first/');
});

test('keeps distant dates exact by using a dataset-relative synthetic origin', () => {
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
  const model = create(dataset);
  const first = model.items.find(({ id }) => id === 'event-a');
  assert.equal(model.syntheticOriginDay, shift);
  assert.equal(syntheticDateToAbsoluteDay(first.start, model.syntheticOriginDay), shift + 10);
});

test('rejects malformed data and missing fictional-date formatters', () => {
  assert.throws(() => createTimelineModel({ dataset: fixture(), messages }), /requires a date formatter/);
  assert.throws(() => createTimelineModel({ dataset: { id: 'broken' }, formatEventDate() {} }), /malformed/);
});
