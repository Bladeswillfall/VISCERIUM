# Codex compression

The build does not rewrite source assets or run a second minifier over Astro's output.

## Images

VISCERIUM uses a **WebP-only policy for raster artwork**. Genuine vector assets may remain SVG. PNG, JPEG/JPG, GIF, BMP, AVIF, TIFF and HEIC/HEIF raster files should be converted before they enter the repository.

The checked-in Obsidian Image Converter settings select the **WebP 75** preset for artwork as it is added to the vault. Keep archival originals outside the repository when they are needed.

The policy is enforced rather than relying on the plugin alone:

- `npm run doctor:vault` checks the vault and site image roots and fails on non-WebP raster files.
- `npm run sync`, `npm run dev` and `npm run build` run the same image validation before public content is copied/generated.
- `.gitignore` ignores common non-WebP raster extensions so they are not staged accidentally.

The sync step copies only referenced vault assets into `Site/public/assets/`. It **does not re-encode them**. This avoids repeated lossy conversion and a Sharp dependency while ensuring the checked-in source is already in the intended delivery format.

## Delivery

Astro and Vite produce the static CSS and JavaScript bundles. Cloudflare Pages applies supported transfer compression when serving those files, so committed `.gz` or `.br` copies are unnecessary.

Run the normal production check from `Site/`:

```bash
npm ci
npm run build
```
