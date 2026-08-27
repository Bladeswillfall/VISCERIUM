# Codex compression

The checked-in Vault remains the canonical source for public artwork. Build-time delivery derivatives are generated into the Site working tree and are not committed.

## Images

VISCERIUM keeps a **WebP-only source policy for raster artwork**. Genuine vector assets may remain SVG. PNG, JPEG/JPG, GIF, BMP, AVIF, TIFF and HEIC/HEIF raster files should still be converted before they enter the repository.

The checked-in Obsidian Image Converter settings select the **WebP 75** preset for artwork as it is added to the vault. Keep archival originals outside the repository when they are needed.

The source policy is enforced rather than relying on the plugin alone:

- `npm run doctor:vault` checks the vault and site image roots and fails on non-WebP source raster files.
- `npm run sync`, `npm run dev` and `npm run build` run the same image validation before public content is copied/generated.
- `.gitignore` ignores common non-WebP source raster extensions so they are not staged accidentally.

### Responsive delivery variants

After `sync-public-notes` has copied the public/referenced Vault assets, the content pipeline generates responsive delivery variants with Sharp. The original WebP is retained unchanged for full-resolution use such as detailed maps.

The standard target widths are **480 px, 960 px and 1600 px**. Images are never upscaled: when a source is smaller than the largest target, its native width becomes the final candidate instead.

For every candidate width the build provides:

- **WebP at quality 75** as the preferred/default delivery format.
- **progressive JPEG at quality 82** as the compatibility fallback for browsers that cannot display WebP.

Generated files live under:

```text
public/assets/images/variants/
public/assets/maps/variants/
```

The build also writes the same deterministic variant manifest to:

```text
public/assets/image-variants.json
src/data/image-variants.json
```

The manifest records the source dimensions and byte size plus the available WebP and JPEG candidates for each public image. It is deliberately generated from only assets already admitted to the public build, so enabling variants cannot publish private/unreleased Vault artwork.

Consumer markup should prefer WebP and leave JPEG as the ordinary `<img>` fallback, for example:

```html
<picture>
  <source type="image/webp" srcset="...480.webp 480w, ...960.webp 960w">
  <img src="...960.jpg" srcset="...480.jpg 480w, ...960.jpg 960w" alt="...">
</picture>
```

Modern browsers therefore select the smaller WebP candidate appropriate to the layout, while older browsers that do not understand `<picture>`/WebP can fall through to the JPEG `<img>`. Consumers such as preview cards, article images, header artwork and a future Basic Edition can choose from the same manifest instead of inventing separate image pipelines.

### Atlas tile delivery

Published WebP maps can also produce 512 px Atlas tile pyramids. Tiling must decode and encode new cropped files, so the tile build uses **lossless WebP** rather than applying another quality setting to treated source artwork.

The tile generator adds an alpha channel before libvips pads incomplete edge tiles. Padding outside the real map bounds stays transparent instead of appearing as black borders in Leaflet.

The canonical map WebP remains unchanged. The smaller 480 px, 960 px and 1600 px responsive variants still use the delivery quality settings above because they are intentionally bandwidth-saving derivatives.

No generated derivative is committed to Git. A clean build regenerates them from the canonical Vault WebP source.

## Delivery

Astro and Vite produce the static CSS and JavaScript bundles. Cloudflare Pages applies supported transfer compression when serving those files, so committed `.gz` or `.br` copies are unnecessary.

Run the normal production check from `Site/`:

```bash
npm ci
npm run build
```
