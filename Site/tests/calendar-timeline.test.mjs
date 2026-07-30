import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fromAbsoluteDay,
  formatAbsoluteDay,
  getCalendar,
  isLeapYear,
  resolveCalendarDate,
  toAbsoluteDay,
} from '../src/lib/calendar/runtime.mjs';
import {
  absoluteDayToSyntheticDate,
  chooseCalendar,
  compareTimelineEvents,
  eventOverlapsRange,
  isSuperTimelineEvent,
  parseTimelineUrlState,
  resolveEraMembership,
  syntheticDateToAbsoluteDay,
  updateTimelineUrl,
} from '../src/lib/timeline/core.mjs';

test('calendar source date round-trips through absolute world-time', () => {
  const source = { calendar: 'okse', year: 9250, month: 'solmanuthur', day: 16 };
  const absolute = toAbsoluteDay(source);
  assert.deepEqual(fromAbsoluteDay(absolute, 'okse'), source);
  assert.equal(resolveCalendarDate(source).absoluteDay, absolute);
});

test('negative absolute days round-trip', () => {
  const source = { calendar: 'okse', year: -10, month: 'niewmonath', day: 1 };
  const absolute = toAbsoluteDay(source);
  assert.ok(absolute < 0);
  assert.deepEqual(fromAbsoluteDay(absolute, 'okse'), source);
});

test('leap and intercalary rules are enforced', () => {
  const calendar = getCalendar('okse');
  assert.equal(isLeapYear(calendar, 20004), true);
  assert.equal(isLeapYear(calendar, 20005), false);
  assert.doesNotThrow(() => toAbsoluteDay({ calendar: 'okse', year: 20004, intercalaryDay: 'engimanutur-02' }));
  assert.throws(() => toAbsoluteDay({ calendar: 'okse', year: 20005, intercalaryDay: 'engimanutur-02' }), /only exists in leap years/);
  assert.throws(() => toAbsoluteDay({ calendar: 'okse', year: 4, month: 'not-a-month', day: 1 }), /Unknown month/);
});

test('precision changes labels, never chronology', () => {
  const input = { calendar: 'okse', year: 9250, month: 'solmanuthur', day: 16 };
  const absolute = toAbsoluteDay(input);
  assert.equal(formatAbsoluteDay(absolute, 'okse', 'year'), '9,250');
  assert.match(formatAbsoluteDay(absolute, 'okse', 'month'), /Sólmanuthur/);
  assert.match(formatAbsoluteDay(absolute, 'okse', 'day'), /16 Sólmanuthur/);
  assert.equal(toAbsoluteDay({ ...input, precision: 'year' }), absolute);
});

test('synthetic UTC dates preserve one world day without timezone drift', () => {
  for (const absolute of [-1_000_000, -1, 0, 1, 1_000_000]) {
    const date = absoluteDayToSyntheticDate(absolute);
    assert.equal(date.getUTCHours(), 0);
    assert.equal(syntheticDateToAbsoluteDay(date), absolute);
  }
  assert.throws(() => absoluteDayToSyntheticDate(Number.MAX_SAFE_INTEGER), /safe synthetic JavaScript date range/);
});

test('timeline-local synthetic origins keep distant world dates inside four-digit years', () => {
  const origin = 3_360_000;
  const absolute = origin + 73_000;
  const date = absoluteDayToSyntheticDate(absolute, origin);
  assert.ok(date.getUTCFullYear() >= 2000 && date.getUTCFullYear() < 9999);
  assert.equal(syntheticDateToAbsoluteDay(date, origin), absolute);
});

test('era membership includes boundaries and overlapping periods', () => {
  const eras = [
    { id: 'a', order: 1, absoluteStartDay: 0, absoluteEndDay: 9 },
    { id: 'b', order: 2, absoluteStartDay: 10, absoluteEndDay: 19 },
  ];
  assert.deepEqual(resolveEraMembership(0, undefined, eras), ['a']);
  assert.deepEqual(resolveEraMembership(9, undefined, eras), ['a']);
  assert.deepEqual(resolveEraMembership(10, undefined, eras), ['b']);
  assert.deepEqual(resolveEraMembership(8, 12, eras), ['a', 'b']);
  assert.equal(eventOverlapsRange({ absoluteStartDay: 8, absoluteEndDay: 12 }, 10, 19), true);
});

test('super inclusion follows importance and explicit overrides', () => {
  assert.equal(isSuperTimelineEvent('landmark', 'auto'), true);
  assert.equal(isSuperTimelineEvent('major', 'auto'), true);
  assert.equal(isSuperTimelineEvent('standard', 'auto'), false);
  assert.equal(isSuperTimelineEvent('incidental', 'include'), true);
  assert.equal(isSuperTimelineEvent('landmark', 'exclude'), false);
});

test('same-day sorting uses importance, editorial order, title and stable id', () => {
  const base = { absoluteStartDay: 10, importance: 'standard', editorialOrder: 0, title: 'B', id: 'b' };
  const events = [
    base,
    { ...base, importance: 'major', title: 'Z', id: 'z' },
    { ...base, editorialOrder: -1, title: 'C', id: 'c' },
    { ...base, title: 'A', id: 'a' },
  ].sort(compareTimelineEvents);
  assert.deepEqual(events.map((event) => event.id), ['z', 'c', 'a', 'b']);
});

test('URL state rejects invalid calendars and remains shareable', () => {
  const parsed = parseTimelineUrlState('https://example.test/timelines/super/?calendar=bogus&event=e-1&lane=category', {
    calendarIds: ['okse'],
    fallbackCalendar: 'okse',
  });
  assert.equal(parsed.calendar, 'okse');
  assert.equal(parsed.selected, 'e-1');
  assert.equal(parsed.laneMode, 'category');
  const updated = updateTimelineUrl('https://example.test/timelines/super/', { calendar: 'okse', selected: 'e-1' });
  assert.equal(updated.searchParams.get('calendar'), 'okse');
  assert.equal(updated.searchParams.get('event'), 'e-1');
});

test('missing timeline ranges remain undefined while explicit zero remains valid', () => {
  const absent = parseTimelineUrlState('https://example.test/eras/smog/', {
    calendarIds: ['okse'],
    fallbackCalendar: 'okse',
  });
  assert.equal(absent.visibleStartDay, undefined);
  assert.equal(absent.visibleEndDay, undefined);

  const explicitZero = parseTimelineUrlState('https://example.test/eras/smog/?start=0&end=0', {
    calendarIds: ['okse'],
    fallbackCalendar: 'okse',
  });
  assert.equal(explicitZero.visibleStartDay, 0);
  assert.equal(explicitZero.visibleEndDay, 0);

  const invalid = parseTimelineUrlState('https://example.test/eras/smog/?start=&end=not-a-number', {
    calendarIds: ['okse'],
    fallbackCalendar: 'okse',
  });
  assert.equal(invalid.visibleStartDay, undefined);
  assert.equal(invalid.visibleEndDay, undefined);
});

test('calendar selection priority is query, storage, timeline, global', () => {
  const calendarIds = ['okse', 'other'];
  assert.equal(chooseCalendar({ queryCalendar: 'other', storedCalendar: 'okse', timelineDefault: 'okse', globalDefault: 'okse', calendarIds }), 'other');
  assert.equal(chooseCalendar({ storedCalendar: 'other', timelineDefault: 'okse', globalDefault: 'okse', calendarIds }), 'other');
  assert.equal(chooseCalendar({ storedCalendar: 'bad', timelineDefault: 'okse', globalDefault: 'other', calendarIds }), 'okse');
});
