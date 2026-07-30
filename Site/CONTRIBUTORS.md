# Contributor attribution

Contributor profiles live in `src/data/contributors.json`. Store each profile's checked-in WebP avatar in `public/assets/contributors/`; builds never fetch or transform avatars.

`defaultContributors` are added to normal public lore pages. Disable that for one page with:

```yaml
defaultContributors: false
```

Add page-specific contributors by registry ID and one or more roles:

```yaml
contributors:
  - id: another-writer
    role: Author
  - id: lore-editor
    roles:
      - Editor
      - Research
```

String shorthand is also supported and receives the `Contributor` role:

```yaml
contributors:
  - another-writer
```

Duplicate IDs are merged, roles are combined, and authors are listed first.
