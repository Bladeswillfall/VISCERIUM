# SEO and structured-data contract

The public Codex should expose the identity and relationships already present in VISCERIUM Markdown/YAML instead of maintaining a second SEO-only content model.

## Contract

- Every indexable page has one canonical URL.
- Canonical URLs, sitemap entries, feeds, social metadata and structured data must resolve from the same page identity.
- Site-level metadata should describe VISCERIUM as a `WebSite`/creative property.
- Lore articles should emit JSON-LD using the closest defensible Schema.org type, falling back to `CreativeWork`/`Article` rather than inventing unsupported types.
- Article metadata should include available title, description, canonical URL, image, author/creator, dates, tags and parent collection/era relationships.
- Visible breadcrumb hierarchy and `BreadcrumbList` structured data must be generated from the same route/navigation model.
- Open Graph and social-card values should reuse canonical article metadata.
- Structured data must never claim facts that are absent from canonical frontmatter/content.
- Non-public creator material remains excluded from indexes and structured-data generation.

## Validation

Add tests that parse representative generated metadata objects and verify canonical URL consistency, required JSON-LD fields and breadcrumb parity. Search-engine-specific enhancements remain optional; standards-based metadata is the source of truth.
