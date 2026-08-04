# Codex Publishing and Deployment SOP

> **Use this SOP when:** You publish Lore, run the Codex locally, or change production deployment settings.
>
> **Result:** The Codex builds from the correct source and publishes without exposing private material or secrets.
>
> **First action:** Identify whether you are changing source Lore, presentation, or deployment configuration.

## Purpose

Use one controlled workflow for Codex publishing and deployment.

Keep creator source files separate from generated website files.

Prevent private notes, invalid metadata, and secrets from entering the public build.

## Before you start

Confirm these requirements:

1. Work from the repository root.
2. Use Node.js 24 for the production-compatible local build.
3. Install dependencies with `npm ci`.
4. Read `CONTRIBUTING.md` before a repository change.
5. Read the nearest specialist SOP before a Lore or schema change.
6. Keep secrets outside the repository.

Do not edit `Site/src/content/docs/` manually.

> **Why:** The sync process regenerates that directory from source Lore.

## Choose a route

| Task | Use this route |
| --- | --- |
| Publish or revise a Lore article | [Publish a Lore note](#publish-a-lore-note) |
| Add columns, cards, asides, or equations | [Format Codex content](#format-codex-content) |
| Prepare artwork | [Prepare images](#prepare-images) |
| Preview or validate the site | [Run the Codex locally](#run-the-codex-locally) |
| Configure Cloudflare Pages | [Deploy the static site](#deploy-the-static-site) |
| Enable analytics or optional services | [Configure optional integrations](#configure-optional-integrations) |

## Repository layout

Use these source-of-truth locations:

| Path | Purpose | Publishing rule |
| --- | --- | --- |
| `Vault/` | Obsidian creator vault | Open this folder in Obsidian. |
| `Vault/Lore/` | Source Lore | Only eligible published notes from this folder enter the Codex. |
| `Vault/Drafts/` | Draft material | Never publish through the normal sync. |
| `Vault/Private/` | Private creator material | Never publish through the normal sync. |
| `Vault/Stories/` | StoryLine and narrative projects | Never use as Codex source. |
| `Vault/System/` | Templates, SOPs, schema, and creator systems | Never publish through the normal sync. |
| `Vault/Assets/Images/` | Source artwork | Copy referenced assets during sync. |
| `Vault/Assets/Maps/` | Source map assets | Copy referenced assets during sync. |
| `Site/` | Astro and Starlight website | Build the public static site here. |
| `Site/src/content/docs/` | Generated Codex content | Do not edit manually. |

Public routes derive from each note path relative to `Vault/Lore/`.

Moving a published note can therefore change its public URL.

## Publish a Lore note

### Phase 1: Create the source

1. Create or open a Markdown note inside `Vault/Lore/`.
2. Use the correct Lore folder for the entity and era.
3. Add the required frontmatter.
4. Write the article in the source note.
5. Reference source assets with Obsidian embeds.

Use this minimum public frontmatter:

```yaml
---
title: Example Title
description: "A short SEO-safe page description."
status: published
type: article
---
```

Do not add `slug` to a published source note.

Use only the controlled status, type, era, and relationship values defined by the schema and creator tools.

### Phase 2: Check publication eligibility

1. Confirm that the note is inside `Vault/Lore/`.
2. Confirm that `title` is present.
3. Confirm that `description` is present.
4. Confirm that `status` is `published`.
5. Confirm that the note contains no private or draft-only material.
6. Confirm that each referenced asset exists under `Vault/Assets/`.

### Check the result

The sync must generate one public article from the source note.

The generated route must match the note path relative to `Vault/Lore/`.

The build must fail when required public metadata is missing.

## Format Codex content

Use normal Markdown for prose, headings, lists, links, tables, and fenced code.

Use the controlled Codex tags only when Markdown cannot provide the required layout.

Write layout tags on their own lines.

### Equal columns

```md
[cols]
[col]
Left content.
[/col]

[col]
Right content.
[/col]
[/cols]
```

### Unequal columns

```md
[cols:2-1 gap=lg]
[col]
Wide main text.
[/col]

[col]
Narrow sidebar.
[/col]
[/cols]
```

### Responsive twelve-column row

```md
[row]
[col:12 md:8]
Main article body.
[/col]

[col:12 md:4]
Sidebar body.
[/col]
[/row]
```

### Cards

```md
[card:accent]
Card content.
[/card]
```

### Asides

Use native Starlight aside syntax:

```md
:::note[Archivist note]
Note content.
:::

:::caution[Content warning]
Warning content.
:::

:::note[Recovered fragment]
In-world quoted text.
:::
```

Legacy `[note]`, `[warning]`, and `[lore]` tags still compile to native asides.

Do not add legacy tags to new content.

### Equation panels

````md
[equation:title="Resonance decay model"]
$$
R(t)=R_0e^{-\lambda t}
$$
[/equation]
````

Supported layout tags are `[cols]`, `[row]`, `[col]`, `[card]`, and `[equation]`.

### Mathematical notation

The build renders mathematics with `remark-math`, `rehype-katex`, and KaTeX.

Use TeX delimiters in source notes.

Inline example:

```md
Resonance decay can be represented as $R(t)=R_0e^{-\lambda t}$.
```

Display example:

```md
$$
R(t)=R_0e^{-\lambda t}
$$
```

Complex display example:

```md
$$
\begin{aligned}
\mathcal{R}_{total}
  &= \sum_{i=1}^{n} \alpha_i \psi_i(t) \\
  &= \alpha_1 \psi_1(t) + \alpha_2 \psi_2(t) + \cdots + \alpha_n \psi_n(t)
\end{aligned}
$$
```

### Typography reference

The main typography layer is `Site/src/styles/typography.css`.

| Use | Typeface |
| --- | --- |
| Display text, page H1, and site title | `Cinzel` |
| Body prose | `Source Serif 4` |
| Interface, metadata, captions, tables, and lower headings | `IBM Plex Sans` |
| Code and terminal fragments | `IBM Plex Mono` |
| Mathematical notation | Compile-time KaTeX output |

Do not add a new typeface without an interface and performance review.

## Prepare images

1. Store source raster artwork under `Vault/Assets/Images/` or `Vault/Assets/Maps/`.
2. Use the checked-in Obsidian Image Converter preset.
3. Convert repository raster artwork to WebP before publication.
4. Use SVG only for genuine vector artwork.
5. Reference the source asset from the Lore note.
6. Run the sync.

The build does not create parallel `.gz` or `.br` source files.

Astro and Vite build the static assets.

Cloudflare Pages handles transfer compression when it serves the site.

Read `Site/COMPRESSION.md` for compression constraints and exceptions.

### Check the result

The referenced asset must appear under `Site/public/assets/` after sync.

The source asset must remain under `Vault/Assets/`.

## Run the Codex locally

### Phase 1: Install and sync

Run these commands:

```bash
cd Site
npm ci
npm run sync
```

### Phase 2: Preview or build

Start the local development server:

```bash
npm run dev
```

Use the combined sync and development command when source Lore changed:

```bash
npm run dev:sync
```

Run the production build before publication:

```bash
npm run build
```

### Phase 3: Run confidence checks

Run the normal repository confidence check before a pull request:

```bash
npm ci
npm test
npm run benchmark:timelines
```

Use focused checks when required:

```bash
npm run doctor:vault
npm run sync
npm run validate:vault
npm run validate:timelines
npm run validate
npm run generate:maps
npm run generate:timelines
npm run test:unit
```

Read `CONTRIBUTING.md` for feature-specific validation requirements.

### Check the result

The production build must complete without an error.

The generated Codex must contain only eligible published Lore.

No private, draft, StoryLine, System, or Template note can appear in the generated output.

## Deploy the static site

The main Codex deploys as a static Cloudflare Pages site.

Use these Cloudflare Pages settings:

```text
Root directory: Site
Build command: npm run build
Build output directory: dist
Node version: 24
Environment variable: SITE_URL=https://www.viscerium.co.uk
```

Set `SITE_URL=https://www.viscerium.co.uk` in the production environment.

The checked-in fallback uses the same canonical URL.

Do not add a Wrangler file only for the Pages deployment.

Keep Resend and Turnstile secrets in the separate contact Worker.

Never commit those secrets to the static Pages project.

Read `CLOUDFLARE_PAGES_SETUP.md` and `Site/CONTACT_FORM_SETUP.md` for the complete service setup.

### Check the result

Cloudflare Pages must run `npm run build` from `Site/`.

The deployed canonical URLs must use `https://www.viscerium.co.uk`.

The static project must contain no private Worker secret.

## Configure optional integrations

Enable or change an integration only after you verify its owner-controlled identifier, URL, and privacy requirements.

### Webmentions

Use `www.viscerium.co.uk` as the intended identity.

The site enables Webmentions only when `PUBLIC_WEBMENTIONS_ENABLED=1` and an endpoint exists.

Verify the domain with Webmention.io before you enable the integration.

### Giscus

The site is configured for repository `Bladeswillfall/VISCERIUM` and the `Comments` discussion category.

Giscus is enabled by default when the configured repository and category identifiers are present.

Set `PUBLIC_GISCUS_ENABLED=0` to disable it.

Verify the GitHub Discussions repository, category, and identifiers before you change the defaults.

### Contact form

The private contact form requires all these values:

```bash
PUBLIC_CONTACT_FORM_ENABLED=1
PUBLIC_CONTACT_FORM_ENDPOINT=https://example-worker.example.workers.dev/
PUBLIC_TURNSTILE_SITE_KEY=example-public-site-key
```

Use a valid HTTPS Worker endpoint.

Keep the Resend secret and Turnstile secret in the separate Worker.

When the required values are absent, the contact page shows a paused-state message and directs public issues to GitHub.

### Support and social links

Edit `Site/src/config/supportLinks.mjs` only when real public URLs exist.

Do not activate a placeholder.

### Sitemap

`@astrojs/sitemap` uses `siteConfig.site`.

Set `SITE_URL` to the production canonical domain before deployment.

### Partytown

`@astrojs/partytown` is configured in `Site/astro.config.mjs`.

It forwards `dataLayer.push` for a future GA4 or GTM-style integration.

### Analytics

GA4 and Cloudflare Web Analytics are disabled by default.

Use these environment variables when real public identifiers are available:

```bash
PUBLIC_GA4_ENABLED=0
PUBLIC_GA4_MEASUREMENT_ID=
PUBLIC_CLOUDFLARE_WEB_ANALYTICS_ENABLED=0
PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN=
```

Enable an analytics path only when its enable flag and identifier are both valid.

Do not enable Cloudflare automatic Web Analytics injection and the repository-managed snippet together.

Configure Search Console verification separately with `PUBLIC_GOOGLE_SITE_VERIFICATION`.

Complete the required consent and privacy review before analytics activation.

### Check the result

The built site must emit no optional tracking script while its integration is disabled.

The contact form must remain disabled when its endpoint or Turnstile key is invalid.

No placeholder identifier can activate a service.

## Stop condition

Stop when all these statements are true:

1. The source change is in the authoritative location.
2. The sync produces the expected public output.
3. The production build completes successfully.
4. No private material or secret enters the build.
5. The required checks pass.
6. The pull request identifies the source change and validation.

## Troubleshooting

### A published article does not appear

1. Confirm that the source note is under `Vault/Lore/`.
2. Confirm that `status` is `published`.
3. Confirm that `title` and `description` exist.
4. Run `npm run doctor:vault`.
5. Run `npm run sync` again.

### A public URL changed unexpectedly

Check whether the source note moved inside `Vault/Lore/`.

Public routes derive from the relative source path.

### A manual website edit disappears

Check whether the edit was made under `Site/src/content/docs/`.

Move the change to the source note under `Vault/Lore/`.

Run the sync again.

### An image does not copy

1. Confirm that the asset exists under `Vault/Assets/`.
2. Confirm that the note uses a valid Obsidian embed.
3. Confirm that the file name and extension match exactly.
4. Run `npm run sync` again.

### Analytics appears twice

Disable either Cloudflare automatic injection or the repository-managed analytics snippet.

Do not run both systems.

## Related documentation

- `CONTRIBUTING.md`
- `Architecture/README.md`
- `CLOUDFLARE_PAGES_SETUP.md`
- `Site/CONTACT_FORM_SETUP.md`
- `Site/COMPRESSION.md`
- `Site/TIMELINES.md`
- `Vault/System/Publishing Rules.md`
- `Vault/System/SOPs/Creator Command Reference.md`
- `Vault/System/SOPs/Documentation Writing Standard.md`
