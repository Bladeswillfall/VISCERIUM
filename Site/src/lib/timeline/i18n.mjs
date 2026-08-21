export function timelineMessage(messages, key, values = {}) {
  const template = messages?.[key];
  if (typeof template !== 'string') throw new Error(`Missing timeline UI message: ${key}`);
  return Object.entries(values).reduce(
    (message, [name, value]) => message.replaceAll(`{${name}}`, String(value)),
    template,
  );
}

export function timelinePlural(messages, key, count, locale) {
  const category = new Intl.PluralRules(locale).select(count);
  const template = messages?.[`${key}.${category}`] ?? messages?.[`${key}.other`];
  if (typeof template !== 'string') throw new Error(`Missing timeline plural message: ${key}`);
  return timelineMessage({ value: template }, 'value', {
    count: new Intl.NumberFormat(locale).format(count),
  });
}

export function timelineList(values, locale) {
  return new Intl.ListFormat(locale, { style: 'short' }).format(values);
}
