import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FEED_FALLBACK_DATE,
  getAuthoredFeedDates,
  latestFeedDate,
} from '../src/lib/feed-dates.mjs';

test('feed dates keep creation and modification timestamps separate', () => {
  const dates = getAuthoredFeedDates({
    created: '2026-07-01',
    updated: '2026-08-03',
  });

  assert.equal(dates.created.toISOString(), '2026-07-01T00:00:00.000Z');
  assert.equal(dates.updated.toISOString(), '2026-08-03T00:00:00.000Z');
});

test('an authored creation date is also the initial update date', () => {
  const dates = getAuthoredFeedDates({ created: '2026-07-01' });

  assert.equal(dates.created.toISOString(), '2026-07-01T00:00:00.000Z');
  assert.equal(dates.updated.toISOString(), '2026-07-01T00:00:00.000Z');
});

test('standalone update timestamps cannot establish article history', () => {
  const dates = getAuthoredFeedDates({ updated: '2026-08-03T12:00:00Z' });

  assert.equal(dates.created, null);
  assert.equal(dates.updated.toISOString(), FEED_FALLBACK_DATE.toISOString());
});

test('legacy publication fields remain valid creation-date aliases', () => {
  assert.equal(
    getAuthoredFeedDates({ published: '2025-09-30' }).created.toISOString(),
    '2025-09-30T00:00:00.000Z',
  );
  assert.equal(
    getAuthoredFeedDates({ date: '2025-10-01' }).created.toISOString(),
    '2025-10-01T00:00:00.000Z',
  );
});

test('feed-level update time is stable when no authored dates exist', () => {
  assert.equal(latestFeedDate([]).toISOString(), FEED_FALLBACK_DATE.toISOString());

  const latest = latestFeedDate([
    { updated: new Date('2026-07-01') },
    { updated: new Date('2026-08-03') },
  ]);
  assert.equal(latest.toISOString(), '2026-08-03T00:00:00.000Z');
});
