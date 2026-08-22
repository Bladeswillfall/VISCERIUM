<%*
const HISTORICAL_ERAS = ["CITADEL", "SMOG", "NEARSIGHT", "ENTROPY"];
const ERA_OPTIONS = [...HISTORICAL_ERAS, "Universal"];
const ENTITY_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const AUTHORING_START = "<!-- viscerium:authoring:start -->";
const AUTHORING_END = "<!-- viscerium:authoring:end -->";
const STORYTELLER_START = "<!-- viscerium:storyteller:start -->";
const STORYTELLER_END = "<!-- viscerium:storyteller:end -->";
const LOCATION_DETAIL_TEMPLATE = "Templates/Lore/Add Location Fields.md";

const TYPES = {
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
};

const LOCATION_KINDS = {
  region: "Region",
  settlement: "Settlement",
  wilderness: "Wilderness",
  route: "Route",
  site: "Site / ruin / landmark",
};

function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "entity";
}

function usedEntityIds() {
  return new Set(tp.app.vault.getMarkdownFiles().map((file) => {
    const cache = tp.app.metadataCache.getFileCache(file);
    return String(cache?.frontmatter?.entity_id ?? "").trim();
  }).filter(Boolean));
}

function suggestedEntityId(title) {
  const used = usedEntityIds();
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
  if (!/^## Storyteller View$/m.test(source)) {
    throw new Error(`${path} must contain a Storyteller View heading.`);
  }
}

async function ensureFolder(folderPath) {
  let current = "";
  for (const segment of folderPath.split("/").filter(Boolean)) {
    current = current ? `${current}/${segment}` : segment;
    if (!tp.app.vault.getAbstractFileByPath(current)) await tp.app.vault.createFolder(current);
  }
}

const selection = await tp.system.suggester(
  Object.values(TYPES).map((entry) => entry.label),
  Object.keys(TYPES),
  true,
  "What are you creating?",
);
const config = TYPES[selection];
const currentTitle = tp.file.title === "Untitled" ? "" : tp.file.title;
const title = String(await tp.system.prompt("Name", currentTitle, true) ?? "").trim();
if (!title) throw new Error("A title is required to create a VISCERIUM note.");
if (title !== tp.file.title) await tp.file.rename(title);

const description = String(await tp.system.prompt("One-line identity (optional)", "", false) ?? "").trim();
const allowedEras = config.schemaType === "event" ? HISTORICAL_ERAS : ERA_OPTIONS;
const era = await tp.system.suggester(["Leave undefined", ...allowedEras], ["", ...allowedEras], false, "Era / scope") ?? "";
const entityId = config.schemaType === "event"
  ? ""
  : String(await tp.system.prompt(
      "Continuity entity ID (stable; change the suggested suffix when this is a different thing with a similar name)",
      suggestedEntityId(title),
      false,
    ) ?? "").trim();
if (entityId && !ENTITY_ID_PATTERN.test(entityId)) {
  throw new Error(`Invalid entity_id: ${entityId}. Use lowercase kebab-case, e.g. okse-dominion-a.`);
}

const pick = (options) => tp.user.reference_picker(tp, options);
const data = {};

if (config.schemaType === "character") {
  data.faction = await pick({ types: ["faction"], multiple: true, label: "faction", stubType: "faction", stubFolder: "Drafts/Inbox/Factions" });
  data.location = await pick({ types: ["location"], multiple: true, label: "location", stubType: "location", stubFolder: "Drafts/Inbox/Locations" });
  data.species = await pick({ types: ["species"], multiple: false, label: "species", stubType: "species", stubFolder: "Drafts/Inbox/Species" });
}
if (config.schemaType === "faction") {
  data.capital = await pick({ types: ["location"], multiple: false, label: "capital", stubType: "location", stubFolder: "Drafts/Inbox/Locations" });
  data.territory = await pick({ types: ["location"], multiple: true, label: "territory", stubType: "location", stubFolder: "Drafts/Inbox/Locations" });
  data.leader = await pick({ types: ["character"], multiple: false, label: "leader", stubType: "character", stubFolder: "Drafts/Inbox/Characters" });
}
if (config.schemaType === "location") {
  data.location_kind = await tp.system.suggester(
    ["Leave undefined", ...Object.values(LOCATION_KINDS)],
    ["", ...Object.keys(LOCATION_KINDS)],
    false,
    "Broad location kind — choose only if useful",
  ) ?? "";
  data.faction = await pick({ types: ["faction"], multiple: true, label: "faction", stubType: "faction", stubFolder: "Drafts/Inbox/Factions" });
  data.region = await pick({ types: ["location"], multiple: false, label: "parent region", stubType: "location", stubFolder: "Drafts/Inbox/Locations" });
}
if (config.schemaType === "event") {
  data.location = await pick({ types: ["location"], multiple: true, label: "location", stubType: "location", stubFolder: "Drafts/Inbox/Locations" });
  data.faction = await pick({ types: ["faction"], multiple: true, label: "faction", stubType: "faction", stubFolder: "Drafts/Inbox/Factions" });
  data.participants = await pick({ types: ["character"], multiple: true, label: "participant", stubType: "character", stubFolder: "Drafts/Inbox/Characters" });
}

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

tR += rendered;
await ensureFolder(config.folder);
if (tp.file.folder(true) !== config.folder) await tp.file.move(`${config.folder}/${title}`);

// Location notes can later be enriched progressively via Add Location Fields.
void LOCATION_DETAIL_TEMPLATE;
%>
