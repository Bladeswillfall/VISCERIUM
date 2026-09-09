export function buildMonthGrid(calendar, month, firstWeekday) {
  const daysPerWeek = calendar.weekdays.length;
  const offset = calendar.weekdays.indexOf(firstWeekday);
  if (offset < 0) throw new Error(`Unknown weekday '${firstWeekday}' in calendar '${calendar.id}'`);
  const cellCount = Math.ceil((offset + month.days) / daysPerWeek) * daysPerWeek;
  return Array.from({ length: cellCount }, (_, index) => {
    const day = index - offset + 1;
    return day >= 1 && day <= month.days ? day : null;
  });
}

export function buildTimelineEventsByDay(events) {
  const eventsByDay = new Map();
  for (const event of events) {
    if (event.precision !== 'day') continue;
    const dayEvents = eventsByDay.get(event.absoluteStartDay) ?? [];
    dayEvents.push(event);
    eventsByDay.set(event.absoluteStartDay, dayEvents);
  }
  return eventsByDay;
}
