const sourcePath = String(dv.current()?.file?.path ?? "");
const sourceFile = app.vault.getAbstractFileByPath(sourcePath);
const frontmatter = sourceFile ? (app.metadataCache.getFileCache(sourceFile)?.frontmatter ?? {}) : {};
const mapId = String(frontmatter.map?.id ?? "").trim();

if (!sourceFile || String(frontmatter.type ?? "").toLowerCase() !== "location") return;

const cleanLink = (value) => String(value ?? "")
  .trim()
  .replace(/^\[\[/, "")
  .replace(/\]\]$/, "")
  .split("|", 1)[0]
  .split("#", 1)[0]
  .replace(/^Vault\//i, "")
  .replace(/\.md$/i, "")
  .replace(/^\/+/, "")
  .toLowerCase();

const coordinatePercent = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return null;
  if (number <= 1) return number * 100;
  if (number <= 100) return number;
  return null;
};

const mapRecord = mapId
  ? app.vault.getMarkdownFiles()
      .map((file) => ({ file, frontmatter: app.metadataCache.getFileCache(file)?.frontmatter ?? {} }))
      .find(({ frontmatter: data }) => (
        String(data.type ?? "").toLowerCase() === "map"
        && String(data.mapId ?? "").trim() === mapId
      ))
  : null;

const root = dv.container.createDiv({ cls: "vc-article-context" });
const copy = root.createDiv({ cls: "vc-article-context-copy" });
copy.createDiv({ text: "CONNECTED CONTEXT", cls: "vc-article-context-kicker" });
copy.createEl("h3", { text: String(frontmatter.title ?? sourceFile.basename) });

const chips = copy.createDiv({ cls: "vc-article-context-chips" });
const chip = (label, value, target) => {
  const text = Array.isArray(value) ? value.filter(Boolean).join(" · ") : String(value ?? "").trim();
  if (!text) return;
  if (!target) {
    const item = chips.createSpan({ cls: "vc-article-context-chip" });
    item.createSpan({ text: label, cls: "vc-article-context-chip-label" });
    item.createSpan({ text });
    return;
  }
  const item = chips.createEl("button", { cls: "vc-article-context-chip is-link" });
  item.createSpan({ text: label, cls: "vc-article-context-chip-label" });
  item.createSpan({ text });
  item.addEventListener("click", () => app.workspace.openLinkText(target, sourcePath));
};

chip("Kind", frontmatter.location_kind);
chip("Era", frontmatter.era);
for (const faction of Array.isArray(frontmatter.faction) ? frontmatter.faction : [frontmatter.faction].filter(Boolean)) {
  chip("Faction", faction, cleanLink(faction));
}
if (frontmatter.region) chip("Parent", frontmatter.region, cleanLink(frontmatter.region));

if (!mapId) {
  root.addClass("has-no-map");
  return;
}

const map = root.createDiv({ cls: "vc-article-map-card" });
const mapHeader = map.createDiv({ cls: "vc-article-map-header" });
const mapHeading = mapHeader.createDiv();
mapHeading.createDiv({ text: "ATLAS", cls: "vc-article-context-kicker" });
mapHeading.createEl("strong", { text: mapRecord ? String(mapRecord.frontmatter.title ?? mapId) : mapId });

if (mapRecord) {
  const open = mapHeader.createEl("button", { text: "Open map", cls: "vc-article-map-open" });
  open.addEventListener("click", () => app.workspace.openLinkText(mapRecord.file.path, sourcePath));
}

const preview = map.createDiv({ cls: "vc-article-map-preview" });
preview.setAttribute("role", "img");
preview.setAttribute("aria-label", `Atlas preview for ${String(mapRecord?.frontmatter?.title ?? mapId)}`);
let markerX = coordinatePercent(frontmatter.map?.x);
let markerY = coordinatePercent(frontmatter.map?.y);

if (mapRecord) {
  const width = Number(mapRecord.frontmatter.width);
  const height = Number(mapRecord.frontmatter.height);
  if (Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0) {
    preview.style.aspectRatio = `${width} / ${height}`;
  }

  const publicImage = String(mapRecord.frontmatter.image ?? "").trim();
  const imagePath = publicImage.replace(/^\/assets\/maps\//i, "Assets/Maps/");
  const imageFile = imagePath ? app.vault.getAbstractFileByPath(imagePath) : null;
  if (imageFile?.extension) {
    preview.style.backgroundImage = `url(${JSON.stringify(app.vault.getResourcePath(imageFile))})`;
  }

  const markerPath = String(mapRecord.frontmatter.mapMarkers ?? "").trim();
  if ((markerX == null || markerY == null) && markerPath && await app.vault.adapter.exists(markerPath)) {
    try {
      const sidecar = JSON.parse(await app.vault.adapter.read(markerPath));
      const sourceKey = cleanLink(sourcePath);
      const titleKey = cleanLink(frontmatter.title);
      const marker = (Array.isArray(sidecar.markers) ? sidecar.markers : []).find((entry) => {
        const link = cleanLink(entry?.link);
        return link === sourceKey || link === titleKey || sourceKey.endsWith(`/${link}`) || link.endsWith(`/${sourceKey}`);
      });
      if (marker) {
        markerX = coordinatePercent(marker.x);
        markerY = coordinatePercent(marker.y);
      }
    } catch (error) {
      console.warn("VISCERIUM article map preview could not read marker data.", error);
    }
  }
}

const isRegion = String(frontmatter.location_kind ?? "").toLowerCase() === "region";
if (markerX != null && markerY != null) {
  const marker = preview.createDiv({ cls: `vc-article-map-marker ${isRegion ? "is-region" : "is-location"}` });
  marker.style.left = `${markerX}%`;
  marker.style.top = `${markerY}%`;
  marker.setAttribute("aria-label", isRegion ? "Region centre" : "Location marker");
}

const status = preview.createDiv({ cls: "vc-article-map-status" });
if (!mapRecord) status.setText(`Map "${mapId}" is linked but its map note is unavailable.`);
else if (markerX == null || markerY == null) status.setText("Map linked. Placement is still pending.");
else if (isRegion) status.setText("Region centre shown. A true area highlight requires an authored Atlas boundary.");
else status.setText("Placed on the linked Atlas.");
