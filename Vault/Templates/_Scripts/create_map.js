const ERA_VALUES = Object.freeze(["CITADEL", "SMOG", "NEARSIGHT", "ENTROPY", "Universal"]);
const MAP_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "map";
}

function usedMapIds(tp) {
  return new Set(tp.app.vault.getMarkdownFiles().map((file) => {
    const frontmatter = tp.app.metadataCache.getFileCache(file)?.frontmatter ?? {};
    return String(frontmatter.mapId ?? "").trim();
  }).filter(Boolean));
}

function suggestedMapId(tp, title) {
  const used = usedMapIds(tp);
  const base = slugify(title);
  if (!used.has(base)) return base;

  let counter = 2;
  while (used.has(`${base}-${counter}`)) counter += 1;
  return `${base}-${counter}`;
}

function setBlankScalar(source, key, value) {
  if (value == null || value === "") return source;
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^${escaped}:\\s*$`, "m");
  if (!pattern.test(source)) throw new Error(`Selected VISCERIUM map template is missing blank ${key}.`);
  return source.replace(pattern, `${key}: ${JSON.stringify(value)}`);
}

function mapImages(tp) {
  return tp.app.vault.getFiles()
    .filter((file) => file.path.startsWith("Assets/Maps/") && /\.(webp|png|jpe?g|svg)$/i.test(file.path))
    .sort((a, b) => a.path.localeCompare(b.path));
}

function insertAuthoringMap(source, imagePath, markerPath, mapId) {
  const placeholder = `Use **TTRPG Tools - Maps: Insert new map...** in Edit mode when an image is assigned later. Use DOM rendering for desktop authoring. Switch to Canvas only if the map needs it for performance.`;
  if (!source.includes(placeholder)) throw new Error("Selected VISCERIUM map template is missing the authoring-map placeholder.");

  const block = [
    "> [!authoring]+ Map controls",
    "> Drag to pan. Use the mouse wheel or **+ / -** to zoom. **Shift-click** to add a marker. **Right-click** for marker, layer, drawing, measurement, and map options.",
    "",
    "```zoommap",
    `image: ${imagePath}`,
    `markers: ${markerPath}`,
    `id: ${mapId}-authoring`,
    "height: 720px",
    "width: 100%",
    "minZoom: 0.1",
    "maxZoom: 8",
    "responsive: false",
    "render: canvas",
    "resizable: true",
    "resizeHandle: native",
    "```",
  ].join("\n");

  return source.replace(placeholder, block);
}

module.exports = async function createMap(tp) {
  let rendered = await tp.user.create_from_skeleton(tp, {
    template: "Templates/Publishing/Map Template.md",
    folder: "Drafts/Inbox/Maps",
    prompt: "Map name",
  });

  const title = tp.file.title;
  const description = String(await tp.system.prompt("One-line map purpose (optional)", "", false) ?? "").trim();
  const era = await tp.system.suggester(
    ["Leave undefined", ...ERA_VALUES],
    ["", ...ERA_VALUES],
    false,
    "Era / scope",
  ) ?? "";

  const suggested = suggestedMapId(tp, title);
  const mapId = String(await tp.system.prompt("Map ID", suggested, true) ?? "").trim();
  if (!MAP_ID_PATTERN.test(mapId)) {
    throw new Error("Map ID must use lowercase kebab-case, for example errack-citadel.");
  }
  if (usedMapIds(tp).has(mapId)) throw new Error(`Map ID already exists: ${mapId}`);

  const images = mapImages(tp);
  let imagePath = "";
  if (images.length) {
    imagePath = await tp.system.suggester(
      ["Leave image unassigned", ...images.map((file) => file.path.replace(/^Assets\/Maps\//, ""))],
      ["", ...images.map((file) => file.path)],
      false,
      "Map image",
    ) ?? "";
  }

  rendered = setBlankScalar(rendered, "description", description);
  rendered = setBlankScalar(rendered, "era", era);
  rendered = setBlankScalar(rendered, "mapId", mapId);

  if (imagePath) {
    const relativeImage = imagePath.replace(/^Assets\/Maps\//, "");
    const markerPath = `${imagePath}.markers.json`;
    rendered = setBlankScalar(rendered, "image", `/assets/maps/${relativeImage}`);
    rendered = setBlankScalar(rendered, "mapMarkers", markerPath);
    rendered = insertAuthoringMap(rendered, imagePath, markerPath, mapId);
  }

  return rendered;
};

module.exports.suggestedMapId = suggestedMapId;
module.exports.setBlankScalar = setBlankScalar;
module.exports.insertAuthoringMap = insertAuthoringMap;
