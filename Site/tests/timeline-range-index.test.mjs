import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bucketTimelineEvents,
  createTimelineRangeIndex,
  queryTimelineRange,
  timelineEventSearchText,
} from '../src/lib/timeline/core.mjs';

function timelineEvent(id, absoluteStartDay, absoluteEndDay) {
  return {
    id,
    title: id,
    description: `${id} description`,
    absoluteStartDay,
    absoluteEndDay,
    importance: 'standard',
    categories: [],
    lanes: [],
    eras: [],
    factions: [],
    locations: [],
    participants: [],
    tags: [],
  };
}

test('range index returns points and long periods that overlap the requested window', () => {
  const events = [
    timelineEvent('late', 30),
    timelineEvent('long-period', 5, 20),
    timelineEvent('point', 10),
    timelineEvent('expired-period', -50, 8),
  ];
  const index = createTimelineRangeIndex(events);

  assert.deepEqual(
    queryTimelineRange(index, 9, 12).map((event) => event.id),
    ['long-period', 'point'],
  );
  assert.deepEqual(
    queryTimelineRange(index, 18, 25).map((event) => event.id),
    ['long-period'],
  );
  assert.deepEqual(
    queryTimelineRange(index, 30, 30).map((event) => event.id),
    ['late'],
  );
});

test('minimap density aggregation remains bounded while preserving event totals', () => {
  const events = Array.from({ length: 5_000 }, (_, index) => timelineEvent(`event-${index}`, index));
  const buckets = bucketTimelineEvents(events, 0, 4_999, 256);

  assert.ok(buckets.length <= 256);
  assert.equal(buckets.reduce((total, bucket) => total + bucket.count, 0), 5_000);
  assert.ok(buckets.every((bucket) => bucket.absoluteDay >= 0 && bucket.absoluteDay <= 4_999));
});

test('search text is prepared once from all searchable event metadata', () => {
  const event = timelineEvent('searchable', 10);
  event.title = 'The Black Furnace';
  event.factions = ['Okse Dominion'];
  event.locations = ['Lorndale'];
  event.tags = ['resonance'];

  const searchText = timelineEventSearchText(event);
  assert.match(searchText, /black furnace/);
  assert.match(searchText, /okse dominion/);
  assert.match(searchText, /lorndale/);
  assert.match(searchText, /resonance/);
});
