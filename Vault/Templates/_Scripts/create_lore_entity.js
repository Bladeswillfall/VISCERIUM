const HISTORICAL_ERAS = ["CITADEL", "SMOG", "NEARSIGHT", "ENTROPY"];
const ERA_OPTIONS = [...HISTORICAL_ERAS, "Universal"];
const ENTITY_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const AUTHORING_START = "<!-- viscerium:authoring:start -->";
const AUTHORING_END = "<!-- viscerium:authoring:end -->";
const STORYTELLER_START = "<!-- viscerium:storyteller:start -->";
const STORYTELLER_END = "<!-- viscerium:storyteller:end -->";
const STORYTELLER_HEADING = "## Storyteller View";
const LOCATION_DETAIL_TEMPLATE = "Templates/Lore/Add Location Fields.md";

const ITEM_TYPES = Object.freeze({
  weapon: "Weapon",
  armour: "Armour",
  equipment: "Equipment",
  tool: "Tool",
  artefact: "Artefact",
  vehicle: "Vehicle",
  technology: "Technology",
});

const TYPES = Object.freeze({
  article: {
    label: "General article",
    folder: "Drafts/Inbox/Articles",
    template: "Templates/Lore/Article Template.md",
    schemaType: "article",
  },
  character: {
    label: "Character",
    folder: "Drafts/Inbox/Characters",
    template: "Templates/Lore/Character Template.md",
    schemaType: "character",
  },
  faction: {
    label: "Faction",
    folder: "Drafts/Inbox/Factions",
    template: "Templates/Lore/Faction Template.md",
    schemaType: "faction",
  },
  location: {
    label: "Location",
    folder: "Drafts/Inbox/Locations",
    template: "Templates/Lore/Location Template.md",
    schemaType: "location",
  },
  event: {
    label: "Event",
    folder: "Drafts/Inbox/Events",
    template: "Templates/Lore/Event Template.md",
    schemaType: "event",
  },
  species: {
    label: "Species",
    folder: "Drafts/Inbox/Species",
    template: "Templates/Lore/Species Template.md",
    schemaType: "species",
  },
  item: {
    label: "Item",
    folder: "Drafts/Inbox/Items",
    template: "Templates/Lore/Item Template.md",
    schemaType: "item",
  },
  culture: {
    label: "Culture",
    folder: "Drafts/Inbox/Articles",
    template: "Templates/Lore/Culture Template.md",
    schemaType: "article",
  },
  belief: {
    label: "Belief / religion",
    folder: "Drafts/Inbox/Articles",
    template: "Templates/Lore/Belief and Religion Template.md",
    schemaType: "article",
  },
  naming_language: {
    label: "Naming language",
    folder: "Drafts/Inbox/Articles",
    template: "Templates/Lore/Naming Language Template.md",
    schemaType: "article",
  },
  resonance_practice: {
    label: "Resonance practice",
    folder: "Drafts/Inbox/Articles",
    template: "Templates/Lore/Resonance Practice Template.md",
    schemaType: "article",
  },
});

const LOCATION_KINDS = Object.freeze({
  region: "Region",
  settlement: "Settlement",
  wilderness: "Wilderness",
  route: "Route",
  site: "Site / ruin / landmark",
});

function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "entity";
}

function usedEntityIds(tp) {
  return new Set(tp.app.vault.getMarkdownFiles().map((file) => {
    const cache = tp.app.metadataCache.getFileCache(file);
    return String(cache?.frontmatter?.entity_id ?? "").trim();
  }).filter(Boolean));
}

function suggestedEntityId(tp, title) {
  const used = usedEntityIds(tp);
  const base = slugify(title);
  if (!used.has(base)) return base;
  for (let code = 97; code <= 122; code += 1) {
    const candidate = `${base}-${String.fromCharCode(code)}`;
    if (!used.has(candidate)) return candidate;
  }
  let counter = 2;
  while (used.has(`${base}-${counter}`)) counter += 1;
  return `${base}-${counter}`;
}

function yamlValue(value) {
  if (Array.isArray(value)) return `[${value.map((item) => JSON.stringify(item)).join(", ")}]`;
  return JSON.stringify(value);
}

function setTopLevelField(source, key, value) {
  if (value == null || value === "" || (Array.isArray(value) && value.length === 0)) return source;
  const lines = source.split("\n");
  const end = lines.indexOf("---", 1);
  if (lines[0] !== "---" || end < 0) throw new Error("Selected VISCERIUM template is missing valid frontmatter.");

  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const fieldPattern = new RegExp(`^${escaped}:`);
  const existing = lines.findIndex((line, index) => index > 0 && index < end && fieldPattern.test(line));
  const rendered = `${key}: ${yamlValue(value)}`;

  if (existing >= 0) {
    lines[existing] = rendered;
    return lines.join("\n");
  }

  const typeIndex = lines.findIndex((line, index) => index > 0 && index < end && /^type:/.test(line));
  lines.splice(typeIndex >= 0 ? typeIndex + 1 : end, 0, rendered);
  return lines.join("\n");
}

function setNestedScalar(source, parentKey, key, value) {
  if (value == null || value === "") return source;

  const lines = source.split("\n");
  const parentIndex = lines.findIndex((line) => line === `${parentKey}:`);
  if (parentIndex < 0) throw new Error(`Selected VISCERIUM template is missing ${parentKey}.`);

  let end = parentIndex + 1;
  while (end < lines.length && (lines[end].startsWith("  ") || lines[end].trim() === "")) end += 1;

  const fieldIndex = lines.findIndex(
    (line, index) => index > parentIndex && index < end && line.startsWith(`  ${key}:`),
  );
  if (fieldIndex < 0) throw new Error(`Selected VISCERIUM template is missing ${parentKey}.${key}.`);

  lines[fieldIndex] = `  ${key}: ${JSON.stringify(value)}`;
  return lines.join("\n");
}

function setTemplateTitle(source, title) {
  return source.replace(
    /^title:\s*["']?\{\{title\}\}["']?\s*$/m,
    `title: ${JSON.stringify(title)}`,
  );
}

function validateTemplate(source, path) {
  for (const marker of [AUTHORING_START, AUTHORING_END, STORYTELLER_START, STORYTELLER_END]) {
    if (!source.includes(marker)) throw new Error(`${path} is missing required marker: ${marker}`);
  }
  if (!source.split("\n").includes(STORYTELLER_HEADING)) {
    throw new Error(`${path} must contain a Storyteller View heading.`);
  }
}

async function ensureFolder(tp, folderPath) {
  let current = "";
  for (const segment of folderPath.split("/").filter(Boolean)) {
    current = current ? `${current}/${segment}` : segment;
    if (!tp.app.vault.getAbstractFileByPath(current)) await tp.app.vault.createFolder(current);
  }
}

async function chooseAvailableTitle(tp, folder) {
  while (true) {
    const currentTitle = tp.file.title === "Untitled" ? "" : tp.file.title;
    const title = String(await tp.system.prompt("Name", currentTitle, true) ?? "").trim();
    if (!title) throw new Error("A title is required to create a VISCERIUM note.");

    const destination = `${folder}/${title}.md`;
    const existing = tp.app.vault.getAbstractFileByPath(destination);
    const currentPath = tp.config?.target_file?.path;
    if (!existing || existing.path === currentPath) return title;

    new tp.obsidian.Notice(
      `"${title}" already exists at ${destination}. Choose a different name.`,
      8000,
    );
  }
}

async function chooseType(tp, requested) {
  const requestedType = String(requested ?? "").trim();
  if (requestedType && !TYPES[requestedType]) throw new Error(`Unknown VISCERIUM Lore type: ${requestedType}`);
  if (requestedType) return requestedType;
  return await tp.system.suggester(
    Object.values(TYPES).map((entry) => entry.label),
    Object.keys(TYPES),
    true,
    "What are you creating?",
  );
}

async function chooseEntityId(tp, config, title) {
  if (config.schemaType === "event") return "";
  const entityId = String(await tp.system.prompt(
    "Continuity entity ID (stable; change the suggested suffix when this is a different thing with a similar name)",
    suggestedEntityId(tp, title),
    false,
  ) ?? "").trim();
  if (entityId && !ENTITY_ID_PATTERN.test(entityId)) {
    throw new Error(`Invalid entity_id: ${entityId}. Use lowercase kebab-case, e.g. okse-dominion-a.`);
  }
  return entityId;
}

const pick = (tp, options) => tp.user.reference_picker(tp, options);

async function collectCharacterData(tp) {
  return {
    faction: await pick(tp, { types: ["faction"], multiple: true, label: "faction", stubType: "faction", stubFolder: "Drafts/Inbox/Factions" }),
    location: await pick(tp, { types: ["location"], multiple: true, label: "location", stubType: "location", stubFolder: "Drafts/Inbox/Locations" }),
    species: await pick(tp, { types: ["species"], multiple: false, label: "species", stubType: "species", stubFolder: "Drafts/Inbox/Species" }),
  };
}

async function collectFactionData(tp) {
  return {
    capital: await pick(tp, { types: ["location"], multiple: false, label: "capital", stubType: "location", stubFolder: "Drafts/Inbox/Locations" }),
    territory: await pick(tp, { types: ["location"], multiple: true, label: "territory", stubType: "location", stubFolder: "Drafts/Inbox/Locations" }),
    leader: await pick(tp, { types: ["character"], multiple: false, label: "leader", stubType: "character", stubFolder: "Drafts/Inbox/Characters" }),
  };
}

async function collectLocationData(tp, options = {}) {
  return {
    location_kind: await tp.system.suggester(
      ["Leave undefined", ...Object.values(LOCATION_KINDS)],
      ["", ...Object.keys(LOCATION_KINDS)],
      false,
      "Broad location kind — choose only if useful",
    ) ?? "",
    faction: await pick(tp, { types: ["faction"], multiple: true, label: "faction", stubType: "faction", stubFolder: "Drafts/Inbox/Factions", era: options.era }),
    region: await pick(tp, { types: ["location"], multiple: false, label: "parent region", stubType: "location", stubFolder: "Drafts/Inbox/Locations", era: options.era }),
  };
}

async function chooseLocationMapId(tp, era) {
  const maps = tp.app.vault.getMarkdownFiles()
    .filter((file) => file.path.startsWith("Lore/"))
    .map((file) => ({ file, frontmatter: tp.app.metadataCache.getFileCache(file)?.frontmatter ?? {} }))
    .filter(({ frontmatter }) => (
      String(frontmatter.type ?? "").toLowerCase() === "map"
      && String(frontmatter.mapId ?? "").trim()
    ))
    .sort((a, b) => {
      const aEra = String(a.frontmatter.era ?? "").trim();
      const bEra = String(b.frontmatter.era ?? "").trim();
      const aMatch = era && aEra === era ? 0 : 1;
      const bMatch = era && bEra === era ? 0 : 1;
      const aTitle = String(a.frontmatter.title ?? a.file.basename ?? a.file.path);
      const bTitle = String(b.frontmatter.title ?? b.file.basename ?? b.file.path);
      return aMatch - bMatch || aTitle.localeCompare(bTitle);
    });

  if (!maps.length) return "";

  return await tp.system.suggester(
    ["Skip for now", ...maps.map(({ file, frontmatter }) => {
      const title = String(frontmatter.title ?? file.basename ?? file.path);
      const mapId = String(frontmatter.mapId).trim();
      const mapEra = String(frontmatter.era ?? "").trim();
      return [title, mapEra, mapId].filter(Boolean).join(" · ");
    })],
    ["", ...maps.map(({ frontmatter }) => String(frontmatter.mapId).trim())],
    false,
    "Atlas target. Marker placement waits until this location has a canonical Lore path",
  ) ?? "";
}

async function collectEventData(tp) {
  return {
    location: await pick(tp, { types: ["location"], multiple: true, label: "location", stubType: "location", stubFolder: "Drafts/Inbox/Locations" }),
    faction: await pick(tp, { types: ["faction"], multiple: true, label: "faction", stubType: "faction", stubFolder: "Drafts/Inbox/Factions" }),
    participants: await pick(tp, { types: ["character"], multiple: true, label: "participant", stubType: "character", stubFolder: "Drafts/Inbox/Characters" }),
  };
}

async function collectEventDate(tp) {
  const addToTimeline = await tp.system.suggester(
    ["Skip for now", "Add year to canonical timeline"],
    [false, true],
    false,
    "Add this event to the canonical timeline now?",
  ) ?? false;
  if (!addToTimeline) return null;

  const yearInput = String(await tp.system.prompt("Okse year", "", true) ?? "").trim();
  if (!/^-?\d+$/.test(yearInput)) throw new Error("Okse year must be an integer.");

  const certainty = await tp.system.suggester(
    ["Exact", "Approximate", "Disputed", "Legendary"],
    ["exact", "approximate", "disputed", "legendary"],
    true,
    "How certain is this year?",
  );

  return {
    year: Number(yearInput),
    month: "niewmonath",
    day: 1,
    precision: "year",
    certainty,
  };
}

async function collectItemData(tp, options) {
  const requestedItemType = String(options.itemType ?? "").trim();
  if (requestedItemType && !ITEM_TYPES[requestedItemType]) {
    throw new Error(`Unknown VISCERIUM item type: ${requestedItemType}`);
  }
  const itemType = requestedItemType || await tp.system.suggester(
    ["Leave undefined", ...Object.values(ITEM_TYPES)],
    ["", ...Object.keys(ITEM_TYPES)],
    false,
    "Broad item type",
  ) || "";

  return {
    item_type: itemType,
    faction: await pick(tp, { types: ["faction"], multiple: true, label: "faction", stubType: "faction", stubFolder: "Drafts/Inbox/Factions" }),
    location: await pick(tp, { types: ["location"], multiple: true, label: "location", stubType: "location", stubFolder: "Drafts/Inbox/Locations" }),
  };
}

const DATA_COLLECTORS = Object.freeze({
  character: collectCharacterData,
  faction: collectFactionData,
  location: collectLocationData,
  event: collectEventData,
  item: collectItemData,
});

async function collectData(tp, schemaType, options) {
  const collector = DATA_COLLECTORS[schemaType];
  return collector ? await collector(tp, options) : {};
}

module.exports = async function createLoreEntity(tp, options = {}) {
  const selection = await chooseType(tp, options.type);
  const config = TYPES[selection];
  const title = await chooseAvailableTitle(tp, config.folder);
  if (title !== tp.file.title) await tp.file.rename(title);

  const description = String(await tp.system.prompt("One-line identity (optional)", "", false) ?? "").trim();
  const allowedEras = config.schemaType === "event" ? HISTORICAL_ERAS : ERA_OPTIONS;
  const era = await tp.system.suggester(["Leave undefined", ...allowedEras], ["", ...allowedEras], false, "Era / scope") ?? "";
  const entityId = await chooseEntityId(tp, config, title);
  const data = await collectData(tp, config.schemaType, { ...options, era });
  const locationMapId = config.schemaType === "location" ? await chooseLocationMapId(tp, era) : "";
  const eventDate = config.schemaType === "event" ? await collectEventDate(tp) : null;

  const templateFile = tp.app.vault.getAbstractFileByPath(config.template);
  if (!templateFile) throw new Error(`Missing VISCERIUM template: ${config.template}`);
  let rendered = await tp.app.vault.read(templateFile);
  validateTemplate(rendered, config.template);
  rendered = setTemplateTitle(rendered, title);
  rendered = setTopLevelField(rendered, "description", description);
  rendered = setTopLevelField(rendered, "era", era);
  rendered = setTopLevelField(rendered, "development_level", "stub");
  if (entityId) rendered = setTopLevelField(rendered, "entity_id", entityId);
  for (const [key, value] of Object.entries(data)) rendered = setTopLevelField(rendered, key, value);
  if (locationMapId) rendered = setNestedScalar(rendered, "map", "id", locationMapId);
  if (eventDate) {
    for (const [key, value] of Object.entries(eventDate)) {
      rendered = setNestedScalar(rendered, "calendarDate", key, value);
    }
  }

  await ensureFolder(tp, config.folder);
  if (tp.file.folder(true) !== config.folder) await tp.file.move(`${config.folder}/${title}`);

  void LOCATION_DETAIL_TEMPLATE;
  return rendered;
};

module.exports.TYPES = TYPES;
module.exports.ITEM_TYPES = ITEM_TYPES;
module.exports.setNestedScalar = setNestedScalar;
