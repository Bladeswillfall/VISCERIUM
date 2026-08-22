# MySnippets Compatibility Runtime Notice

The VISCERIUM repository intentionally distributes a modified compatibility runtime based on the Obsidian community plugin **MySnippets**.

## Upstream work

- Original project: MySnippets by Chetachi
- Upstream project: `chetachiezikeuzor/MySnippets`
- Compatibility work used as a basis: `Moyf/MySnippets`
- Recorded compatibility baseline: release/version `1.2.4`

The upstream authors and contributors retain their respective rights.

## VISCERIUM-covered files

The following files are intentionally distributed from this repository:

- `Vault/.obsidian/plugins/mysnippets-plugin/main.js`
- `Vault/.obsidian/plugins/mysnippets-plugin/styles.css`
- `Vault/.obsidian/plugins/mysnippets-plugin/manifest.json`
- `Vault/.obsidian/plugins/mysnippets-plugin/data.json`

The JavaScript compatibility runtime is the Source Code Form made available to recipients. It remains governed by the Mozilla Public License 2.0 rather than the VISCERIUM first-party MIT licence.

## Recorded VISCERIUM modifications

The file header and repository tests record compatibility work including:

- preferring `app.customCss.setSnippetEnabled` when available;
- falling back to `setCssEnabledStatus` for older Obsidian builds;
- verifying and re-synchronising visible toggle state after changes; and
- avoiding reliance on `getSnippetsFolder` when creating or opening snippets.

Future modifications to the covered runtime must remain identifiable in source and in this notice.

## Licence and source availability

The covered runtime is available in Source Code Form at the repository paths listed above.

It is distributed under the **Mozilla Public License, version 2.0**. The source header provides the MPL Exhibit A notice. The official licence text is available from Mozilla at <https://mozilla.org/MPL/2.0/>.

Nothing in this notice grants rights to VISCERIUM Lore, canon, artwork, branding, maps, or other proprietary creative material.

References to MySnippets, Obsidian, the upstream authors, and their projects are descriptive attribution only and do not imply endorsement or affiliation.
