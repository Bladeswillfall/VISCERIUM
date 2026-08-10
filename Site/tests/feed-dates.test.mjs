import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FEED_FALLBACK_DATE,
  getAuthoredFeedDates,
  latestFeedDate,
} from '../src/lib/feed-dates.mjs';

test('feed dates keep publication and modification timestamps separate', () => {
  const dates = getAuthoredFeedDates({
    published: '2026-07-01',
    updated: '2026-08-03',
  });

  assert.equal(dates.published.toISOString(), '2026-07-01T00:00:00.000Z');
  assert.equal(dates.updated.toISOString(), '2026-08-03T00:00:00.000Z');
});

test('publication date is also the initial update date when no later update exists', () => {
  const dates = getAuthoredFeedDates({ published: '2026-07-01' });

  assert.equal(dates.published.toISOString(), '2026-07-01T00:00:00.000Z');
  assert.equal(dates.updated.toISOString(), '2026-07-01T00:00:00.000Z');
});

test('public modification date cannot predate publication', () => {
  const dates = getAuthoredFeedDates({
    published: '2026-08-06',
    updated: '2026-08-05',
  });

  assert.equal(dates.published.toISOString(), '2026-08-06T00:00:00.000Z');
  assert.equal(dates.updated.toISOString(), '2026-08-06T00:00:00.000Z');
});

test('creation date is internal provenance, not a publication-date alias', () => {
  const dates = getAuthoredFeedDates({
    created: '2026-06-01',
    updated: '2026-08-03',
  });

  assert.equal(dates.published, null);
  assert.equal(dates.updated.toISOString(), '2026-08-03T00:00:00.000Z');
});

test('legacy date remains a publication-date alias', () => {
  assert.equal(
    getAuthoredFeedDates({ date: '2025-10-01' }).published.toISOString(),
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
