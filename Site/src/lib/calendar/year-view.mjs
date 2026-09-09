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
