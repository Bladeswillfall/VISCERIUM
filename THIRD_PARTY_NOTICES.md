# Third-Party Notices

VISCERIUM uses open-source frameworks, libraries, plugins, fonts, and development tools created and maintained by other people and organisations.

These components remain the property of their respective copyright holders and are governed by their own licence terms.

This document records the direct day-one dependencies and authoring integrations known to the repository. It does not relicense third-party material.

## Exact dependency records

Use these files as the exact version and installation records:

- `Site/package-lock.json` — public Codex, maps, graphs, timelines, search, rendering, and build dependencies;
- `Tools/obsidian-viscerium-timelines/package-lock.json` — first-party Obsidian timeline plugin dependencies;
- `Vault/.obsidian/community-plugins.json` — enabled Obsidian community-plugin identifiers;
- `Vault/System/Obsidian Plugin Profile.json` — tested Obsidian plugin versions, installation sources, and shared-setting paths; and
- `LICENSES/` — licence text and modification notices for third-party code intentionally redistributed by this repository.

Transitive package versions and SPDX licence identifiers are recorded in the relevant npm lockfile. Release and distribution checks must preserve all licence files and notices supplied by installed packages.

### Direct npm dependency declarations

The block below is maintained from the existing npm package manifests. It records each direct package's declared version constraint and the exact lifecycle-script approvals used by the strict npm install policy. Do not edit the managed block by hand; from `Site/`, run `npm run notices:update` after a dependency or lifecycle-script approval changes.

<!-- DEPENDENCIES:DIRECT:START -->
| Project | Package | Scope | Declared version |
| --- | --- | --- | --- |
| Codex (`Site/`) | `@astrojs/markdown-remark` | runtime | `7.2.1` |
| Codex (`Site/`) | `@astrojs/mdx` | runtime | `^7.0.3` |
| Codex (`Site/`) | `@astrojs/partytown` | runtime | `^2.1.7` |
| Codex (`Site/`) | `@astrojs/sitemap` | runtime | `3.7.3` |
| Codex (`Site/`) | `@astrojs/starlight` | runtime | `^0.41.3` |
| Codex (`Site/`) | `astro` | runtime | `^7.1.1` |
| Codex (`Site/`) | `chronos-timeline-md` | runtime | `1.1.0` |
| Codex (`Site/`) | `cytoscape` | runtime | `3.34.0` |
| Codex (`Site/`) | `cytoscape-dagre` | runtime | `4.0.0` |
| Codex (`Site/`) | `fuse.js` | runtime | `7.5.0` |
| Codex (`Site/`) | `gray-matter` | runtime | `^4.0.3` |
| Codex (`Site/`) | `katex` | runtime | `^0.18.1` |
| Codex (`Site/`) | `leaflet` | runtime | `1.9.4` |
| Codex (`Site/`) | `leaflet.control.layers.tree` | runtime | `1.2.0` |
| Codex (`Site/`) | `rehype-katex` | runtime | `^7.0.1` |
| Codex (`Site/`) | `remark-math` | runtime | `^6.0.0` |
| Codex (`Site/`) | `starlight-changelogs` | runtime | `^0.5.0` |
| Codex (`Site/`) | `starlight-giscus` | runtime | `^1.1.0` |
| Codex (`Site/`) | `starlight-scroll-to-top` | runtime | `^1.0.1` |
| Codex (`Site/`) | `starlight-site-graph` | runtime | `^0.5.0` |
| Codex (`Site/`) | `starlight-tags` | runtime | `^1.0.1` |
| Codex (`Site/`) | `starlight-telescope` | runtime | `^1.0.0` |
| Codex (`Site/`) | `vis-timeline` | runtime | `8.5.1` |
| Codex (`Site/`) | `@playwright/test` | development | `1.62.1` |
| Obsidian timelines plugin | `chronos-timeline-md` | runtime | `1.1.0` |
| Obsidian timelines plugin | `vis-timeline` | runtime | `8.5.1` |
| Obsidian timelines plugin | `esbuild` | development | `^0.28.1` |
| Obsidian timelines plugin | `obsidian` | development | `^1.8.7` |

#### Approved npm lifecycle scripts

These exact package/version entries are permitted to run install lifecycle scripts under the repository strict allowlist policy.

| Project | Package/version | Lifecycle script |
| --- | --- | --- |
| Codex (`Site/`) | `esbuild@0.28.1` | approved |
| Codex (`Site/`) | `fsevents@2.3.2` | approved |
| Codex (`Site/`) | `fsevents@2.3.3` | approved |
| Obsidian timelines plugin | `esbuild@0.28.1` | approved |
<!-- DEPENDENCIES:DIRECT:END -->

The lockfiles remain authoritative for exact resolved and transitive versions. The human-authored sections below remain authoritative for why a component is used and for licence, attribution, modification, and redistribution obligations.

## Public Codex and build stack

| Component | Role in VISCERIUM | Upstream licence |
| --- | --- | --- |
| [Astro](https://github.com/withastro/astro) and official `@astrojs/*` integrations | Static site framework, Markdown, MDX, sitemap, and Partytown integrations | MIT |
| [Starlight](https://github.com/withastro/starlight) | Documentation-site shell and content framework | MIT |
| `starlight-changelogs` | Changelog presentation | MIT |
| `starlight-giscus` | Giscus comments integration | MIT |
| `starlight-scroll-to-top` | Scroll-to-top interface | MIT |
| `starlight-site-graph` | Public site-graph integration | MIT |
| `starlight-tags` | Tag pages and tag navigation | MIT |
| `starlight-telescope` | Public search integration | MIT |
| [Cytoscape.js](https://github.com/cytoscape/cytoscape.js) (`cytoscape`) | Relationship and graph visualisation | MIT |
| [cytoscape-dagre](https://github.com/cytoscape/cytoscape.js-dagre) | Directed graph layout | MIT |
| [Leaflet](https://github.com/Leaflet/Leaflet) (`leaflet`) | Public interactive maps | BSD-2-Clause |
| [Leaflet.Control.Layers.Tree](https://github.com/jjimenezshaw/Leaflet.Control.Layers.Tree) (`leaflet.control.layers.tree`) | Hierarchical map-layer controls | BSD-3-Clause |
| [vis-timeline](https://github.com/visjs/vis-timeline) | Interactive timeline rendering | Apache-2.0 OR MIT |
| [chronos-timeline-md](https://github.com/clairefro/chronos-timeline-md) | Markdown-to-timeline parsing | ISC |
| [Fuse.js](https://github.com/krisk/Fuse.js) (`fuse.js`) | Fuzzy search | Apache-2.0 |
| [gray-matter](https://github.com/jonschlinkert/gray-matter) | Markdown frontmatter parsing | MIT |
| [KaTeX](https://github.com/KaTeX/KaTeX) (`katex`) | Mathematical notation rendering | MIT |
| [remark-math](https://github.com/remarkjs/remark-math) | Markdown mathematics parsing | MIT |
| [rehype-katex](https://github.com/remarkjs/remark-math) | KaTeX output integration | MIT |
| [Playwright](https://github.com/microsoft/playwright) (`@playwright/test`) | Browser and interface testing | Apache-2.0 |
| [esbuild](https://github.com/evanw/esbuild) | First-party Obsidian plugin bundling | MIT |
| [Obsidian API](https://github.com/obsidianmd/obsidian-api) | Type definitions and API surface for first-party plugins | MIT |

The direct package list and current version constraints are defined in `Site/package.json` and `Tools/obsidian-viscerium-timelines/package.json` and mirrored into the managed declaration block above.

## Obsidian application

[Obsidian](https://obsidian.md/) is the creator workspace used with the VISCERIUM vault.

The Obsidian desktop and mobile applications are not distributed or relicensed by this repository. Users obtain Obsidian separately under Obsidian's own terms.

References to Obsidian, its interface, and its plugin API do not imply endorsement or affiliation.

## Obsidian community plugins

The repository records plugin IDs, tested versions, and selected shared settings needed to reproduce the creator environment.

Ordinary third-party plugin executables, styles, manifests, workers, binaries, maps, and caches are excluded by `.gitignore`. Users obtain those files from the upstream project or the Obsidian community-plugin service.

Selected `data.json` files remain tracked when they define an intentional VISCERIUM workflow. They are configuration, not a redistribution of the upstream plugin implementation.

| Plugin | Creator or maintainer | Upstream licence |
| --- | --- | --- |
| [Image Converter](https://community.obsidian.md/plugins/image-converter) | xRyul | MIT |
| [Editing Toolbar](https://community.obsidian.md/plugins/editing-toolbar) | pkm-er / cumany | MPL-2.0 |
| [Breadcrumbs](https://community.obsidian.md/plugins/breadcrumbs) | Michael Porter; originally SkepticMystic | MIT |
| [Templater](https://community.obsidian.md/plugins/templater-obsidian) | SilentVoid13; maintained by Zachatoo | AGPL-3.0 |
| [Auto-Properties](https://community.obsidian.md/plugins/auto-properties) | Aaron Gillespie | MIT |
| [Metadata Menu](https://community.obsidian.md/plugins/metadata-menu) | mdelobelle | MIT |
| [MySnippets](https://community.obsidian.md/plugins/mysnippets-plugin) | Chetachi; compatibility work also credits Moyf | MPL-2.0 |
| [StoryLine](https://community.obsidian.md/plugins/storyline) | Jan Sandström | MIT |
| [Daily Activity](https://community.obsidian.md/plugins/daily-activity) | Trevor Rydalch / trydalch | No licence file published upstream; runtime is installed separately and is not redistributed here |
| [Journal Bases](https://github.com/dsebastien/obsidian-journal-base) | Sébastien Dubois / dsebastien | MIT |
| [Iconic](https://community.obsidian.md/plugins/iconic) | Holo / gfxholo | MIT-0; bundled icon and Unicode resources have separate notices upstream |
| [TTRPG Tools - Maps](https://community.obsidian.md/plugins/zoom-map) | Johannes Schwartz / Jareika | MIT |
| [Advanced Tables](https://community.obsidian.md/plugins/table-editor-obsidian) | Tony Grosinger | GPL-3.0 |
| [Chronos Timeline](https://community.obsidian.md/plugins/chronos) | Claire Froelich / clairefro | MIT |
| [Dataview](https://github.com/blacksmithgu/obsidian-dataview) | blacksmithgu and contributors | MIT |
| [Obsidian Git](https://community.obsidian.md/plugins/obsidian-git) | Vinzent; originally denolehov | MIT |
| [Importer](https://community.obsidian.md/plugins/obsidian-importer) | Obsidian and contributors | MIT |
| [Style Settings](https://community.obsidian.md/plugins/obsidian-style-settings) | mgmeyers / obsidian-community | GPL-3.0 |
| [Harper](https://community.obsidian.md/plugins/harper) | Automattic and Harper contributors | Apache-2.0 |
| [Calendar](https://github.com/liamcain/obsidian-calendar-plugin) | Liam Cain | MIT |

### Vendored MySnippets compatibility runtime

Unlike most third-party plugin bundles, these files are intentionally tracked:

- `Vault/.obsidian/plugins/mysnippets-plugin/main.js`;
- `Vault/.obsidian/plugins/mysnippets-plugin/styles.css`; and
- the related manifest and configuration.

The compatibility runtime is based on MySnippets by Chetachi and compatibility work maintained in `Moyf/MySnippets`.

That runtime remains under the Mozilla Public License 2.0. Its file header identifies the applicable licence and upstream work. The repository MIT licence does not apply to it.

The complete local compliance record is:

- [`LICENSES/MPL-2.0.txt`](LICENSES/MPL-2.0.txt) — official Mozilla Public License 2.0 text; and
- [`LICENSES/MySnippets-NOTICE.md`](LICENSES/MySnippets-NOTICE.md) — upstream basis, covered files, recorded VISCERIUM modifications, and source-availability notice.

### First-party VISCERIUM plugins

The following original VISCERIUM plugin code is licensed under `LICENSE-CODE.md`:

- VISCERIUM Timelines;
- VISCERIUM Creator Tools;
- VISCERIUM Layout Tools;
- VISCERIUM Image Tools, where original source or runtime files are present; and
- VISCERIUM Journal Tools.

These plugins use the Obsidian API under its MIT licence. The first-party MIT licence does not grant rights to VISCERIUM Lore or creative assets processed by those plugins.

## Fonts

The Codex typography uses open font families under the SIL Open Font License 1.1:

| Font family | Copyright project | Licence |
| --- | --- | --- |
| [Cinzel](https://github.com/googlefonts/Cinzel) | Cinzel project authors | OFL-1.1 |
| [Source Serif 4](https://github.com/adobe-fonts/source-serif) | Adobe and Source Serif project authors | OFL-1.1 |
| [IBM Plex Sans](https://github.com/IBM/plex) | IBM and IBM Plex project authors | OFL-1.1 |
| [IBM Plex Mono](https://github.com/IBM/plex) | IBM and IBM Plex project authors | OFL-1.1 |

Font names, reserved font names, copyright notices, and licence files must be preserved as required by the respective font packages.

## Services and platforms

VISCERIUM also integrates with or deploys through services such as GitHub, Cloudflare Pages, Giscus, Resend, Turnstile, Webmention.io, and optional analytics providers.

Use of a service is governed by that provider's terms. A service integration is not an open-source dependency and does not imply sponsorship or endorsement.

## Trademarks

Astro, Starlight, Obsidian, GitHub, Cloudflare, Leaflet, Cytoscape, Playwright, and other product or project names may be trademarks of their respective owners.

Their use here is descriptive attribution only.

## Automated coverage checks

The repository checks that:

- the managed direct-dependency declaration matches the current `package.json` files, including declared version constraints;
- the managed lifecycle-script approval table matches the exact `allowScripts` entries in the npm package manifests;
- every direct `Site/package.json` dependency is still named or explicitly covered in the human-authored attribution sections outside the managed dependency block;
- every enabled non-first-party Obsidian plugin is represented here; and
- the vendored MySnippets exception retains its MPL header, licence text, modification notice, and source-availability notice.

These checks prevent silent dependency and attribution drift, but they do not replace a complete release audit of transitive dependencies and distributed artefacts.

## Maintenance rule

Run `npm run notices:update` from `Site/` after any dependency declaration or approved lifecycle-script entry changes, then review and commit the resulting `THIRD_PARTY_NOTICES.md` change. CI runs `npm run notices:check` and fails when the managed block is stale.

Also update the human-authored attribution sections when any of these changes occurs:

1. Add or remove a direct npm dependency.
2. Change what a third-party dependency is used for or change its licence.
3. Commit a third-party plugin bundle or source file.
4. Add a font, icon set, map library, graph library, or timeline library.
5. Fork or modify third-party code.
6. Prepare a source or binary distribution outside the normal GitHub and Cloudflare workflows.

A direct dependency version-only change does not require duplicating the version manually in the human-authored tables; the managed declaration block records it from the package manifest. Any corresponding licence, attribution, behaviour, or redistribution change still requires human review.

Update `Vault/System/Obsidian Plugin Profile.json` after a tested plugin upgrade.

A complete release audit must inspect the installed dependency tree and preserve every licence, notice, attribution, and source-availability obligation required by the versions being distributed.
