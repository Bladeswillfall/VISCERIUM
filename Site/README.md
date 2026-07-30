# VISCERIUM

This Astro/Starlight app publishes selected Markdown notes from the sibling Obsidian vault.

## Commands

Run commands from this `Site/` directory.

```sh
npm install
npm run sync
npm run dev
npm run build
npm test
npm run preview
```

- `npm run sync` copies publishable notes from `../Vault/Lore` into `src/content/docs`.
- `npm run dev` syncs notes, then starts the Astro dev server.
- `npm run build` syncs notes, then builds the production site.
- `npm test` runs the same build validation used before commits.
- `npm run preview` previews the latest production build.

## Publishing Rules

Only notes with `status: published` are published:

```yaml
status: published
```

Published notes must also include `title` and `description`. Their routes are derived from paths relative to `Vault/Lore/`; `slug` frontmatter is rejected. Optional fields currently supported by the content schema include `type`, `era`, and `faction`.

## Configuration

Template defaults live in `site.config.mjs`. Override them with environment variables when creating a project-specific site:

```sh
SITE_TITLE="VISCERIUM" SITE_URL="https://www.viscerium.co.uk" npm run build
```

Set `SITE_URL` to the production origin used for sitemap generation. Use `LORE_SOURCE_DIR` only if your vault layout differs from the template.

Giscus, Webmentions, analytics, and the Worker-backed contact form are disabled until complete owner-controlled values are supplied. Use `.env.example` as the public-variable reference. Never expose the Worker secrets listed in `CONTACT_FORM_SETUP.md`.
