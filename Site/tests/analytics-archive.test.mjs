import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  countCommentsByCommunity,
  dateRange,
  londonBoundaryMs,
  monthRange,
  parseArgs,
} from '../../Infrastructure/analytics/archive.mjs';

const id = '2bef0971-7237-40d5-b247-b7812c0dad55';

test('backfill date ranges are inclusive', () => {
  assert.deepEqual(dateRange('2026-08-30', '2026-09-01'), [
    '2026-08-30',
    '2026-08-31',
    '2026-09-01',
  ]);
});

test('monthly tasks cover the whole calendar month without summing daily uniques', () => {
  assert.deepEqual(monthRange('2026-08'), { start: '2026-08-01', end: '2026-09-01' });
  assert.deepEqual(parseArgs(['--month=2026-08']).tasks, [
    { kind: 'monthly', key: '2026-08-01', start: '2026-08-01', end: '2026-09-01' },
  ]);
});

test('historical ranges do not attach current snapshots by default', () => {
  assert.equal(parseArgs(['--from=2026-08-26', '--to=2026-08-27']).snapshots, false);
  assert.equal(parseArgs(['--date=2026-08-26']).snapshots, false);
  assert.equal(parseArgs(['--date=2026-08-26', '--snapshots']).snapshots, true);
});

test('Europe/London boundaries follow BST and GMT', () => {
  assert.equal(new Date(londonBoundaryMs('2026-09-14')).toISOString(), '2026-09-13T23:00:00.000Z');
  assert.equal(new Date(londonBoundaryMs('2026-12-14')).toISOString(), '2026-12-14T00:00:00.000Z');
});

test('Remark42 activity is counted by permanent community thread ID and London day', () => {
  const counts = countCommentsByCommunity([
    { time: '2026-09-13T22:59:59Z', locator: { url: `https://www.viscerium.co.uk/community/${id}/` } },
    { time: '2026-09-13T23:00:00Z', locator: { url: `https://www.viscerium.co.uk/community/${id}/` } },
    { time: '2026-09-14T22:59:59Z', locator: { url: `https://www.viscerium.co.uk/community/${id}/` } },
    { time: '2026-09-14T23:00:00Z', locator: { url: `https://www.viscerium.co.uk/community/${id}/` } },
  ], '2026-09-14', '2026-09-15');
  assert.equal(counts.get(id), 2);
});
