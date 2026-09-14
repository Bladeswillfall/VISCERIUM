# Contributor attribution

Contributor profiles live in `src/data/contributors.json`. Page frontmatter references profiles by ID and records the work done on that page.

Contributor avatars are resolved separately. Run `npm run contributors:sync` after adding or changing a profile. The command caches a GitHub profile image when the profile URL points to GitHub. For other profiles, or when GitHub cannot be reached, it generates a deterministic Solacon from the contributor name. Normal development and production builds do not fetch or transform avatars.

The generated path map lives in `src/data/contributor-avatars.json`. Checked-in avatar files live under `public/assets/contributors/`.

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

Duplicate IDs are merged. Roles are de-duplicated without changing their display spelling. Authors are listed first.

The contributor strip shows role text for every role. Its decorative SVG ring shows at most four role segments in this order: Author, Co-author, Editor, Research, Illustrator, Consultant, then other roles. Unknown roles remain in the text and use the neutral ring segment style.
