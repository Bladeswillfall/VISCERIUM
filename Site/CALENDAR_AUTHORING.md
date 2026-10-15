# Calendar authoring guide

This guide describes the Obsidian frontmatter and shortcodes that generate the public [Okse Calendar](https://www.viscerium.co.uk/calendar/).

The public calendar module is placed with an Obsidian-friendly shortcode. The sync step converts the source Markdown to Astro MDX, keeping lore notes editable in Obsidian.

## Placing calendars in articles

Define the calendar block in frontmatter:

```yaml
calendarBlocks:
  ID-0001:
    calendar: okse
    year: 4
```

Then place it anywhere in the Markdown body:

```md
[Calendar:ID-0001]
```

For quick tests, you can also write the calendar directly:

```md
[Calendar:okse year=4]
```

## Linking calendar events to articles

Calendar events use the observance `slug` from the calendar data. To make a date cell open an article instead of only jumping to its own day anchor, add `eventLinks` to the relevant calendar block:

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

The direct string form is enough for most cases. Use the object form when the hover/title text should name the target article differently from the observance itself.

You can also use either of these aliases if they read better in a given note:

```yaml
calendarBlocks:
  ID-0001:
    calendar: okse
    year: 4
    observanceLinks:
      winter-turning: /calendar/events/winter-turning/
```

```yaml
calendarBlocks:
  ID-0001:
    calendar: okse
    year: 4
    links:
      spring-turning:
        article: calendar/events/spring-turning
```

When a day has a linked observance, the whole date cell opens the article and receives the linked-event styling. If a day has no linked observance, it still links to its local calendar anchor as before.

For permanent links that should exist every time a calendar is rendered, add `href` or `article` directly to the observance in the structured calendar data instead of repeating it in page frontmatter.

## Using Okse dates in articles

Event articles can declare a structured date in frontmatter:

```yaml
calendarDate:
  calendar: okse
  year: 20001
  month: niewmonath
  day: 1
  displayCalendars:
    - okse
```

Intercalary days use `intercalaryDay` instead of `month` and `day`:

```yaml
calendarDate:
  calendar: okse
  year: 20004
  intercalaryDay: engimanutur-02
```

The site resolves the source date into hidden absolute world-time first, then renders it through the selected display calendars.
