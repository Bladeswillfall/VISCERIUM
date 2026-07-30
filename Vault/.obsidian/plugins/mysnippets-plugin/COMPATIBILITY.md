# MySnippets compatibility build

This vault intentionally tracks the MySnippets runtime instead of relying on the community-store `1.2.3` bundle.

## Upstream

- Original plugin: `chetachiezikeuzor/MySnippets-Plugin`
- Obsidian 1.11 compatibility fork: `Moyf/MySnippets`
- Compatibility baseline: `1.2.4`
- Key upstream compatibility commit: `3689a6a9df6fdf32940e62f6c4b28332652993d5`

The fork fixes menu/toggle interaction changes introduced by newer Obsidian builds.

## Vault compatibility additions

The tracked runtime adds a small defensive layer on top of that compatibility work:

1. Prefer `app.customCss.setSnippetEnabled(name, enabled)` when available.
2. Fall back to `app.customCss.setCssEnabledStatus(name, enabled)` for older builds.
3. Verify the resulting state through `app.customCss.enabledSnippets`.
4. Re-sync the visible toggle after both switch clicks and whole-row clicks.
5. Use `app.customCss.openSnippetsFolder()` instead of depending on the older `getSnippetsFolder()` helper.
6. Expose a **MySnippets: Diagnose CSS snippet API** command and an API status line in plugin settings.

As of July 2026, contemporary Obsidian plugin code still exposes both `setSnippetEnabled` and `setCssEnabledStatus` in its internal CSS-manager typings.

## Why `main.js` and `styles.css` are tracked

The repository normally ignores installed community-plugin bundles. MySnippets is the deliberate exception because a normal vault pull must replace the incompatible `1.2.3` runtime, not merely update its manifest.

## License

The compatibility work is derived from MySnippets and remains subject to the Mozilla Public License 2.0.

https://mozilla.org/MPL/2.0/
