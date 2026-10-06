# Changelog

All notable changes to the VISCERIUM Codex and related creator tools are recorded here.

This file uses [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) so Starlight Changelogs can generate the `/releases/` pages.

The entries from 31 July to 28 September 2026 were reconstructed from merged GitHub pull requests. Their dates are **UTC merge dates**, not independently verified production deployment dates. These retrospective version labels group completed work; they do not claim that matching GitHub Releases or deployments occurred on those dates. The original 8 and 10 July entries are retained as authored.

## [Unreleased]

### Added in Unreleased

- Added reusable era-themed artifacts and anchored marginalia, including accessible CITADEL manuscript pagination ([#217](https://github.com/Bladeswillfall/VISCERIUM/pull/217)).
- Added seven Elias Vail WebP cell illustrations with contour wrapping and clickable Bailey-format attribution pages in Myrkild (backported from [#219](https://github.com/Bladeswillfall/VISCERIUM/pull/219)).
- Added a responsive homepage Recent Articles carousel with era-themed header placeholders, an expandable grid and smooth drag scrolling ([#197](https://github.com/Bladeswillfall/VISCERIUM/pull/197)).

### Changed in Unreleased

- Enabled Astro's experimental incremental static-build cache for VISCERIUM-owned dynamic routes, moved Atlas and responsive-image caches into Cloudflare's persisted Astro cache tree, skipped duplicate validation during Cloudflare builds, and replaced post-merge full CI with a cache-seeding build on main.
- Increased the homepage Recent Articles grid limit from 6 to 36 entries ([#224](https://github.com/Bladeswillfall/VISCERIUM/pull/224)).
- Restored ordinary Myrkild strain prose and removed cell-image margins (backported from [#219](https://github.com/Bladeswillfall/VISCERIUM/pull/219)).
- Made Overview-only sidebar folders link directly to their article and subdued folders without other published articles ([#180](https://github.com/Bladeswillfall/VISCERIUM/pull/180)).
- Updated release notes with colour-coded change labels and clearer date and version layouts; fixed British English release-date formatting.

### Removed in Unreleased

- Removed the standalone What's New page and its link from the homepage Recent Articles section; the carousel and public feeds remain available.

### Fixed in Unreleased

- Kept explicitly included inter-era events visible on the super timeline at wide zoom levels, including their article links ([#222](https://github.com/Bladeswillfall/VISCERIUM/pull/222)).

## [0.14.0] - 2026-09-28

### Added in 0.14.0

- Published SMOG and NEARSIGHT Atlas maps, with links and previews on their era pages ([#181](https://github.com/Bladeswillfall/VISCERIUM/pull/181)).
- Added ASTU, TCSC and Krass Dominion flag artwork to the relevant lore pages ([#182](https://github.com/Bladeswillfall/VISCERIUM/pull/182)).
- Added responsive era map artwork to Start Here and kept ENTROPY's original illustration ([#185](https://github.com/Bladeswillfall/VISCERIUM/pull/185)).
- Added transparent VISCERIUM favicons, app icons and social-sharing previews ([#184](https://github.com/Bladeswillfall/VISCERIUM/pull/184)).

### Fixed in 0.14.0

- Restored the Krass Dominion flag on CITADEL power cards ([#183](https://github.com/Bladeswillfall/VISCERIUM/pull/183)).

## [0.13.0] - 2026-09-24

### Added in 0.13.0

- Centralised Obsidian's creator entry points, including the Home creation controls ([#174](https://github.com/Bladeswillfall/VISCERIUM/pull/174)).
- Added connected editorial tools for article relationships, Atlas placement and chronology inside Obsidian ([#179](https://github.com/Bladeswillfall/VISCERIUM/pull/179)).

## [0.12.8] - 2026-09-23

### Fixed in 0.12.8

- Aligned the Rauthrbak Min regression test with its private-draft status; public references remain unlinked ([#176](https://github.com/Bladeswillfall/VISCERIUM/pull/176)).

## [0.12.7] - 2026-09-21

### Changed in 0.12.7

- Limited World Graph to published articles and improved the layout of disconnected groups ([#167](https://github.com/Bladeswillfall/VISCERIUM/pull/167)).
- Reduced repeated page CSS and shared more layout code across Support, Contact and Start Here ([#126](https://github.com/Bladeswillfall/VISCERIUM/pull/126)).
- Prepared an unpublished language-menu control for future translations; English remains the only live locale ([#147](https://github.com/Bladeswillfall/VISCERIUM/pull/147)).
- Added a creator-only audit for outstanding CITADEL lore migration and naming conflicts ([#116](https://github.com/Bladeswillfall/VISCERIUM/pull/116)).

### Fixed in 0.12.7

- Repaired canonical Okse links and removed public links to the private Rauthrbak Min draft ([#149](https://github.com/Bladeswillfall/VISCERIUM/pull/149)).
- Updated a vulnerable dependency, restored the tracked development-variable example and stabilised World Graph browser tests ([#170](https://github.com/Bladeswillfall/VISCERIUM/pull/170), [#169](https://github.com/Bladeswillfall/VISCERIUM/pull/169), [#171](https://github.com/Bladeswillfall/VISCERIUM/pull/171)).

## [0.12.6] - 2026-09-17

### Changed in 0.12.6

- Refreshed the GitHub README banner, heading and status badges ([#164](https://github.com/Bladeswillfall/VISCERIUM/pull/164)).

## [0.12.5] - 2026-09-16

### Changed in 0.12.5

- Expanded Valenheim's CITADEL lore and indented its subsections for easier reading ([#157](https://github.com/Bladeswillfall/VISCERIUM/pull/157), [#160](https://github.com/Bladeswillfall/VISCERIUM/pull/160)).
- Aligned page content, Community and footer layouts on wide screens and expanded World Graph's desktop layout ([#162](https://github.com/Bladeswillfall/VISCERIUM/pull/162)).
- Removed redundant Overview links from the left sidebar while keeping category pages accessible ([#163](https://github.com/Bladeswillfall/VISCERIUM/pull/163)).
- Clarified repository structure and moved maintained first-party Obsidian plugin sources into Tools ([#158](https://github.com/Bladeswillfall/VISCERIUM/pull/158)).

## [0.12.4] - 2026-09-15

### Added in 0.12.4

- Automated catch-up for completed monthly analytics reports and added longer-lived interaction and traffic summaries ([#152](https://github.com/Bladeswillfall/VISCERIUM/pull/152), [#153](https://github.com/Bladeswillfall/VISCERIUM/pull/153)).

### Fixed in 0.12.4

- Repaired GitHub issue links on Support and Contact and fixed the Support heading at desktop widths ([#155](https://github.com/Bladeswillfall/VISCERIUM/pull/155), [#156](https://github.com/Bladeswillfall/VISCERIUM/pull/156)).

## [0.12.3] - 2026-09-14

### Added in 0.12.3

- Added an Obsidian StoryLine workflow for recording scene changes and reviewing story state ([#115](https://github.com/Bladeswillfall/VISCERIUM/pull/115)).
- Added a long-term aggregate analytics archive for page visits and community activity ([#150](https://github.com/Bladeswillfall/VISCERIUM/pull/150)).
- Prepared French and German translation placeholders without publishing new languages ([#141](https://github.com/Bladeswillfall/VISCERIUM/pull/141)).

### Fixed in 0.12.3

- Restored production contact-form configuration and clarified README privacy wording and related checks ([#145](https://github.com/Bladeswillfall/VISCERIUM/pull/145), [#148](https://github.com/Bladeswillfall/VISCERIUM/pull/148), [#151](https://github.com/Bladeswillfall/VISCERIUM/pull/151)).

## [0.12.2] - 2026-09-12

### Changed in 0.12.2

- Standardised site icons using locally stored solid Material Symbols ([#144](https://github.com/Bladeswillfall/VISCERIUM/pull/144)).
- Updated the Astro, Starlight, graph, timeline, image-processing, linting and gateway runtime dependencies ([#32](https://github.com/Bladeswillfall/VISCERIUM/pull/32), [#58](https://github.com/Bladeswillfall/VISCERIUM/pull/58), [#121](https://github.com/Bladeswillfall/VISCERIUM/pull/121), [#133](https://github.com/Bladeswillfall/VISCERIUM/pull/133), [#134](https://github.com/Bladeswillfall/VISCERIUM/pull/134), [#136](https://github.com/Bladeswillfall/VISCERIUM/pull/136), [#137](https://github.com/Bladeswillfall/VISCERIUM/pull/137), [#138](https://github.com/Bladeswillfall/VISCERIUM/pull/138), [#139](https://github.com/Bladeswillfall/VISCERIUM/pull/139), [#143](https://github.com/Bladeswillfall/VISCERIUM/pull/143)).

## [0.12.1] - 2026-09-11

### Fixed in 0.12.1

- Addressed accessibility issues found in the WCAG 2.2 AA audit, including skip links, headings, control contrast and missing artwork ([#142](https://github.com/Bladeswillfall/VISCERIUM/pull/142)).
- Added automated Axe accessibility checks to the existing browser test workflow ([#140](https://github.com/Bladeswillfall/VISCERIUM/pull/140)).

## [0.12.0] - 2026-09-10

### Added in 0.12.0

- Made the calendar year interactive, with year navigation, correct weekday alignment and timeline-aware dates ([#130](https://github.com/Bladeswillfall/VISCERIUM/pull/130)).

## [0.11.1] - 2026-09-09

### Added in 0.11.1

- Added contributor role rings and generated Solacon avatars for contributors without an available profile picture ([#131](https://github.com/Bladeswillfall/VISCERIUM/pull/131)).

## [0.11.0] - 2026-09-08

### Added in 0.11.0

- Published the human-authorship policy and creator commentary, with a corrected canonical statement route ([#127](https://github.com/Bladeswillfall/VISCERIUM/pull/127), [#128](https://github.com/Bladeswillfall/VISCERIUM/pull/128)).
- Separated private Workshop material from the public vault and tightened the publication boundary ([#125](https://github.com/Bladeswillfall/VISCERIUM/pull/125)).

### Changed in 0.11.0

- Removed article pagination from standalone policy pages ([#129](https://github.com/Bladeswillfall/VISCERIUM/pull/129)).

## [0.10.3] - 2026-09-07

### Changed in 0.10.3

- Redesigned Support with a full-width layout and a live Bluesky link ([#117](https://github.com/Bladeswillfall/VISCERIUM/pull/117)).

## [0.10.2] - 2026-09-04

### Fixed in 0.10.2

- Expanded the World Graph's readable fallback, improved node spacing and enlarged interactive targets ([#123](https://github.com/Bladeswillfall/VISCERIUM/pull/123), [#124](https://github.com/Bladeswillfall/VISCERIUM/pull/124)).
- Refined the Appreciate button's spacing and era-aware styling ([#119](https://github.com/Bladeswillfall/VISCERIUM/pull/119)).

## [0.10.1] - 2026-09-03

### Added in 0.10.1

- Tracked successful Kudos additions and removals as Rybbit events ([#122](https://github.com/Bladeswillfall/VISCERIUM/pull/122)).

## [0.10.0] - 2026-09-02

### Added in 0.10.0

- Introduced reversible Community Kudos with stable page IDs and Webmention appreciation counts ([#118](https://github.com/Bladeswillfall/VISCERIUM/pull/118)).

## [0.9.2] - 2026-08-30

### Added in 0.9.2

- Added a custom 404 page with links back to the Codex and improved the Support page's reading layout ([#114](https://github.com/Bladeswillfall/VISCERIUM/pull/114)).
- Added a browser test for delivery of Rybbit's homepage interaction events ([#113](https://github.com/Bladeswillfall/VISCERIUM/pull/113)).

## [0.9.1] - 2026-08-27

### Added in 0.9.1

- Added IndieWeb microformats to published articles and the site's identity markup ([#109](https://github.com/Bladeswillfall/VISCERIUM/pull/109)).
- Published missing CITADEL nation pages and repaired nation power-card links and artwork ([#112](https://github.com/Bladeswillfall/VISCERIUM/pull/112)).

### Changed in 0.9.1

- Moved reading navigation before article references and discussions, and standardised reading-event analytics on Rybbit ([#111](https://github.com/Bladeswillfall/VISCERIUM/pull/111)).
- Added a repository complexity limit for maintainable code ([#104](https://github.com/Bladeswillfall/VISCERIUM/pull/104)).

## [0.9.0] - 2026-08-26

### Added in 0.9.0

- Generated responsive public images and tiled Atlas maps so large artwork loads according to screen size and zoom ([#81](https://github.com/Bladeswillfall/VISCERIUM/pull/81), [#82](https://github.com/Bladeswillfall/VISCERIUM/pull/82)).
- Integrated self-hosted Rybbit analytics and redesigned the Contact page ([#97](https://github.com/Bladeswillfall/VISCERIUM/pull/97), [#95](https://github.com/Bladeswillfall/VISCERIUM/pull/95)).
- Explained Webmentions directly on article pages and repaired Webmention.io login metadata ([#85](https://github.com/Bladeswillfall/VISCERIUM/pull/85), [#83](https://github.com/Bladeswillfall/VISCERIUM/pull/83)).

### Changed in 0.9.0

- Improved first-load, homepage and mobile rendering, including deferred search and fewer render-blocking styles ([#96](https://github.com/Bladeswillfall/VISCERIUM/pull/96), [#98](https://github.com/Bladeswillfall/VISCERIUM/pull/98), [#99](https://github.com/Bladeswillfall/VISCERIUM/pull/99), [#100](https://github.com/Bladeswillfall/VISCERIUM/pull/100)).
- Split CI into separate jobs, simplified content-build stages and tightened metadata validation and architecture checks ([#86](https://github.com/Bladeswillfall/VISCERIUM/pull/86), [#89](https://github.com/Bladeswillfall/VISCERIUM/pull/89), [#90](https://github.com/Bladeswillfall/VISCERIUM/pull/90), [#91](https://github.com/Bladeswillfall/VISCERIUM/pull/91), [#92](https://github.com/Bladeswillfall/VISCERIUM/pull/92)).
- Clarified the comment gateway's MIT licence, authenticated trusted proxy headers and removed redundant advanced CodeQL configuration ([#87](https://github.com/Bladeswillfall/VISCERIUM/pull/87), [#88](https://github.com/Bladeswillfall/VISCERIUM/pull/88), [#93](https://github.com/Bladeswillfall/VISCERIUM/pull/93)).

### Fixed in 0.9.0

- Prevented an initial desktop sidebar shift, removed an ineffective report-only CSP directive and stabilised Firefox World Graph tests ([#101](https://github.com/Bladeswillfall/VISCERIUM/pull/101), [#102](https://github.com/Bladeswillfall/VISCERIUM/pull/102), [#84](https://github.com/Bladeswillfall/VISCERIUM/pull/84)).

## [0.8.0] - 2026-08-25

### Added in 0.8.0

- Enabled Webmentions and placed external responses below the article alongside separate discussions ([#80](https://github.com/Bladeswillfall/VISCERIUM/pull/80)).

## [0.7.0] - 2026-08-24

### Added in 0.7.0

- Replaced article Giscus comments with self-hosted Remark42 ([#66](https://github.com/Bladeswillfall/VISCERIUM/pull/66)).
- Added a protected comment-writing gateway and public-site security checks ([#70](https://github.com/Bladeswillfall/VISCERIUM/pull/70), [#69](https://github.com/Bladeswillfall/VISCERIUM/pull/69)).

### Changed in 0.7.0

- Simplified local build tooling, deferred below-the-fold comments and removed unused components ([#76](https://github.com/Bladeswillfall/VISCERIUM/pull/76)).
- Updated CodeQL Actions and the Starlight Changelogs dependency ([#73](https://github.com/Bladeswillfall/VISCERIUM/pull/73), [#74](https://github.com/Bladeswillfall/VISCERIUM/pull/74), [#71](https://github.com/Bladeswillfall/VISCERIUM/pull/71)).

### Fixed in 0.7.0

- Corrected the comment gateway's Docker base image so VPS builds work ([#75](https://github.com/Bladeswillfall/VISCERIUM/pull/75)).

## [0.6.2] - 2026-08-23

### Added in 0.6.2

- Added Reader settings with appearance controls and optional sensitive-media concealment ([#68](https://github.com/Bladeswillfall/VISCERIUM/pull/68)).

### Fixed in 0.6.2

- Repaired Giscus repository and locale settings and resolved Valenheim deployment regressions ([#62](https://github.com/Bladeswillfall/VISCERIUM/pull/62), [#64](https://github.com/Bladeswillfall/VISCERIUM/pull/64), [#67](https://github.com/Bladeswillfall/VISCERIUM/pull/67)).

## [0.6.1] - 2026-08-22

### Changed in 0.6.1

- Redesigned Lore templates for long-form writing and kept creator guidance out of published Codex pages ([#63](https://github.com/Bladeswillfall/VISCERIUM/pull/63)).

## [0.6.0] - 2026-08-21

### Added in 0.6.0

- Established WCAG 2.2 AA accessibility requirements and a progressive-enhancement contract for interactive content ([#51](https://github.com/Bladeswillfall/VISCERIUM/pull/51), [#56](https://github.com/Bladeswillfall/VISCERIUM/pull/56)).
- Prepared the Codex for future localisation while keeping English as the sole published language ([#52](https://github.com/Bladeswillfall/VISCERIUM/pull/52)).

### Changed in 0.6.0

- Documented the design system and formalised security headers and report-only CSP checks ([#57](https://github.com/Bladeswillfall/VISCERIUM/pull/57), [#55](https://github.com/Bladeswillfall/VISCERIUM/pull/55)).

## [0.5.4] - 2026-08-20

### Changed in 0.5.4

- Restyled Obsidian Bases controls to match the creator Home dashboard, then aligned the styling with current Bases markup ([#60](https://github.com/Bladeswillfall/VISCERIUM/pull/60), [#61](https://github.com/Bladeswillfall/VISCERIUM/pull/61)).

## [0.5.3] - 2026-08-18

### Fixed in 0.5.3

- Corrected CSS URL encoding in the creator Home hero image ([#50](https://github.com/Bladeswillfall/VISCERIUM/pull/50)).

## [0.5.2] - 2026-08-17

### Added in 0.5.2

- Added offline reading typography for the Obsidian vault ([#48](https://github.com/Bladeswillfall/VISCERIUM/pull/48)).

### Changed in 0.5.2

- Made first-party code comments easier to read and repaired tests after the Home dashboard refactor ([#47](https://github.com/Bladeswillfall/VISCERIUM/pull/47), [#49](https://github.com/Bladeswillfall/VISCERIUM/pull/49)).

## [0.5.1] - 2026-08-16

### Changed in 0.5.1

- Added Chronicle controls to the creator Home dashboard ([#43](https://github.com/Bladeswillfall/VISCERIUM/pull/43)).
- Added configurable Obsidian tag styling and corrected its support for Properties and Bases ([#44](https://github.com/Bladeswillfall/VISCERIUM/pull/44), [#45](https://github.com/Bladeswillfall/VISCERIUM/pull/45)).
- Clarified stylesheet ownership and shared validation and parsing logic across site features ([#46](https://github.com/Bladeswillfall/VISCERIUM/pull/46)).

## [0.5.0] - 2026-08-15

### Added in 0.5.0

- Added the Chronicle periodic-review workflow and article reading-time indicators ([#42](https://github.com/Bladeswillfall/VISCERIUM/pull/42)).
- Updated the local lore vault's organisation and source files ([#35](https://github.com/Bladeswillfall/VISCERIUM/pull/35)).

## [0.4.1] - 2026-08-10

### Added in 0.4.1

- Added a private daily-journal workflow for creator activity ([#36](https://github.com/Bladeswillfall/VISCERIUM/pull/36)).
- Published the Content & Production policy and redesigned the public footer ([#33](https://github.com/Bladeswillfall/VISCERIUM/pull/33)).

### Changed in 0.4.1

- Reorganised CITADEL lore around nations and organisations and made authored publication dates authoritative for SEO ([#34](https://github.com/Bladeswillfall/VISCERIUM/pull/34), [#37](https://github.com/Bladeswillfall/VISCERIUM/pull/37)).
- Restricted npm install scripts and resolved dependency and code-scanning security alerts ([#38](https://github.com/Bladeswillfall/VISCERIUM/pull/38), [#39](https://github.com/Bladeswillfall/VISCERIUM/pull/39)).

## [0.4.0] - 2026-08-06

### Changed in 0.4.0

- Introduced the canonical Codex sidebar hierarchy and consistent era and category navigation ([#29](https://github.com/Bladeswillfall/VISCERIUM/pull/29)).

## [0.3.3] - 2026-08-05

### Fixed in 0.3.3

- Updated the StoryLine privacy test to match local-only settings ([#28](https://github.com/Bladeswillfall/VISCERIUM/pull/28)).

## [0.3.2] - 2026-08-04

### Added in 0.3.2

- Added creator SOP checklists, worksheets and research provenance guidance ([#23](https://github.com/Bladeswillfall/VISCERIUM/pull/23)).

### Changed in 0.3.2

- Reworked the README, including a linked VISCERIUM banner and clearer licensing rules ([#22](https://github.com/Bladeswillfall/VISCERIUM/pull/22), [#24](https://github.com/Bladeswillfall/VISCERIUM/pull/24)).
- Made RSS and Atom publication dates author-controlled, and moved article sidebar references to Obsidian wikilinks ([#25](https://github.com/Bladeswillfall/VISCERIUM/pull/25), [#27](https://github.com/Bladeswillfall/VISCERIUM/pull/27)).

### Fixed in 0.3.2

- Restored licence and attribution files lost during a vault backup ([#26](https://github.com/Bladeswillfall/VISCERIUM/pull/26)).

## [0.3.1] - 2026-08-03

### Added in 0.3.1

- Added folder-aware Obsidian templates and normalised migrated World Anvil filenames ([#16](https://github.com/Bladeswillfall/VISCERIUM/pull/16), [#17](https://github.com/Bladeswillfall/VISCERIUM/pull/17)).
- Added marked Storyteller sections and header-image rendering inside Obsidian ([#18](https://github.com/Bladeswillfall/VISCERIUM/pull/18), [#19](https://github.com/Bladeswillfall/VISCERIUM/pull/19)).
- Updated source article content ([#15](https://github.com/Bladeswillfall/VISCERIUM/pull/15)).

### Fixed in 0.3.1

- Refined header-image behaviour, restored responsive Obsidian article widths and updated browser-test dependencies ([#20](https://github.com/Bladeswillfall/VISCERIUM/pull/20), [#21](https://github.com/Bladeswillfall/VISCERIUM/pull/21), [#7](https://github.com/Bladeswillfall/VISCERIUM/pull/7)).

## [0.3.0] - 2026-08-02

### Added in 0.3.0

- Added a Bases-first creator Home dashboard, metadata tools and article-image layouts ([#12](https://github.com/Bladeswillfall/VISCERIUM/pull/12)).
- Added an audit-first preparation tool for safely migrating World Anvil content ([#14](https://github.com/Bladeswillfall/VISCERIUM/pull/14)).

### Changed in 0.3.0

- Refined the Home heading and issue-severity indicators ([#13](https://github.com/Bladeswillfall/VISCERIUM/pull/13)).

## [0.2.1] - 2026-07-31

### Added in 0.2.1

- Enabled Giscus comments for standard lore pages while keeping structural pages excluded ([#9](https://github.com/Bladeswillfall/VISCERIUM/pull/9), [#10](https://github.com/Bladeswillfall/VISCERIUM/pull/10), [#11](https://github.com/Bladeswillfall/VISCERIUM/pull/11)).

### Changed in 0.2.1

- Made browser checks reproducible and removed duplicate private-authoring ignore rules ([#6](https://github.com/Bladeswillfall/VISCERIUM/pull/6), [#8](https://github.com/Bladeswillfall/VISCERIUM/pull/8)).

## [0.2.0] - 2026-07-10

### Added in 0.2.0

- Added automatically generated public index pages for every category folder containing published canon notes.
- Added subcategory and descendant-page listings to generated category routes.
- Added an automated What's New page driven by public note dates and Git history.

### Changed

- Updated graph, backlinks, feeds, and sidebar navigation to use canonical public slugs.
- Excluded generated category indexes from RSS and Atom update feeds.

## [0.1.0] - 2026-07-08

### Added in 0.1.0

- Added the first VISCERIUM Codex changelog source file.
- Added the Starlight Changelogs integration and generated changelog pages.
- Added a distinct Changelogs section at the bottom of the left site-navigation sidebar.

### Notes

- Future codex feature updates should add a new version section above this entry.
- The `Unreleased` section can be used while drafting, but Starlight Changelogs ignores it until it becomes a dated version entry.

[Unreleased]: https://github.com/Bladeswillfall/VISCERIUM/blob/main/Site/CHANGELOG.md
