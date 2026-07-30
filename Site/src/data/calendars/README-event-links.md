# Calendar event links

Calendar day cells can link to event articles when a rendered calendar block supplies links for observance slugs.

```yaml
calendarBlocks:
  ID-0001:
    calendar: okse
    year: 4
    eventLinks:
      summer-turning: /calendar/events/summer-turning/
      autumn-turning:
        href: /calendar/events/autumn-turning/
        label: Autumn Turning article
```

Aliases accepted by the sync script:

- `eventLinks`
- `observanceLinks`
- `links`

Calendar data can also define permanent links directly on an observance:

```ts
{
  slug: 'summer-turning',
  name: 'Summer Turning',
  type: 'solstice',
  month: 'solmanuthur',
  day: 16,
  href: '/calendar/events/summer-turning/',
}
```

The cell falls back to its local day anchor when no linked observance exists.
