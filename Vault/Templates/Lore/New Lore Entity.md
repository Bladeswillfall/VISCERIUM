<%*
const HISTORICAL_ERAS = ["CITADEL", "SMOG", "NEARSIGHT", "ENTROPY"];
const ERA_OPTIONS = [...HISTORICAL_ERAS, "Universal"];
const ENTITY_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TYPES = {
  character: { label: "Character", folder: "Drafts/Inbox/Characters" },
  faction: { label: "Faction", folder: "Drafts/Inbox/Factions" },
  location: { label: "Location", folder: "Drafts/Inbox/Locations" },
  event: { label: "Event", folder: "Drafts/Inbox/Events" },
  species: { label: "Species", folder: "Drafts/Inbox/Species" },
};
const LOCATION_KINDS = {
  region: "Region",
  settlement: "Settlement",
  wilderness: "Wilderness",
  route: "Route",
  site: "Site / ruin / landmark",
};
const STORYTELLER_START = "<!-- viscerium:storyteller:start -->";
const STORYTELLER_END = "<!-- viscerium:storyteller:end -->";

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

const type = await tp.system.suggester(Object.values(TYPES).map((entry) => entry.label), Object.keys(TYPES), true, "What are you creating?");
const config = TYPES[type];
const currentTitle = tp.file.title === "Untitled" ? "" : tp.file.title;
const title = String(await tp.system.prompt("Name", currentTitle, true) ?? "").trim();
if (title && title !== tp.file.title) await tp.file.rename(title);
const description = String(await tp.system.prompt("One-line identity (optional)", "", false) ?? "").trim();
const allowedEras = type === "event" ? HISTORICAL_ERAS : ERA_OPTIONS;
const era = await tp.system.suggester(["Leave undefined", ...allowedEras], ["", ...allowedEras], false, "Era / scope") ?? "";
const entityId = type === "event"
  ? ""
  : String(await tp.system.prompt(
      "Continuity entity ID (stable; change the suggested suffix when this is a different thing with a similar name)",
      suggestedEntityId(title),
      false
    ) ?? "").trim();
if (entityId && !ENTITY_ID_PATTERN.test(entityId)) {
  throw new Error(`Invalid entity_id: ${entityId}. Use lowercase kebab-case, e.g. okse-dominion-a.`);
}
const pick = (options) => tp.user.reference_picker(tp, options);
const data = {};

async function ensureFolder(folderPath) {
  let current = "";
  for (const segment of folderPath.split("/").filter(Boolean)) {
    current = current ? `${current}/${segment}` : segment;
    if (!tp.app.vault.getAbstractFileByPath(current)) await tp.app.vault.createFolder(current);
  }
}

if (type === "character") {
  data.faction = await pick({ types: ["faction"], multiple: true, label: "faction", stubType: "faction", stubFolder: "Drafts/Inbox/Factions" });
  data.location = await pick({ types: ["location"], multiple: true, label: "location", stubType: "location", stubFolder: "Drafts/Inbox/Locations" });
  data.species = await pick({ types: ["species"], multiple: false, label: "species", stubType: "species", stubFolder: "Drafts/Inbox/Species" });
}
if (type === "faction") {
  data.capital = await pick({ types: ["location"], multiple: false, label: "capital", stubType: "location", stubFolder: "Drafts/Inbox/Locations" });
  data.territory = await pick({ types: ["location"], multiple: true, label: "territory", stubType: "location", stubFolder: "Drafts/Inbox/Locations" });
  data.leader = await pick({ types: ["character"], multiple: false, label: "leader", stubType: "character", stubFolder: "Drafts/Inbox/Characters" });
}
if (type === "location") {
  data.location_kind = await tp.system.suggester(
    ["Leave undefined", ...Object.values(LOCATION_KINDS)],
    ["", ...Object.keys(LOCATION_KINDS)],
    false,
    "Broad location kind — choose only if useful"
  ) ?? "";
  data.faction = await pick({ types: ["faction"], multiple: true, label: "faction", stubType: "faction", stubFolder: "Drafts/Inbox/Factions" });
  data.region = await pick({ types: ["location"], multiple: false, label: "parent region", stubType: "location", stubFolder: "Drafts/Inbox/Locations" });
}
if (type === "event") {
  data.location = await pick({ types: ["location"], multiple: true, label: "location", stubType: "location", stubFolder: "Drafts/Inbox/Locations" });
  data.faction = await pick({ types: ["faction"], multiple: true, label: "faction", stubType: "faction", stubFolder: "Drafts/Inbox/Factions" });
  data.participants = await pick({ types: ["character"], multiple: true, label: "participant", stubType: "character", stubFolder: "Drafts/Inbox/Characters" });
}

const yamlValue = (value) => Array.isArray(value) ? `[${value.map((item) => JSON.stringify(item)).join(", ")}]` : JSON.stringify(value);
const frontmatter = ["---", `title: ${JSON.stringify(title)}`, `description: ${JSON.stringify(description)}`, "created:", "published:", "updated:", "status: draft", `type: ${type}`, "development_level: stub"];
if (entityId) frontmatter.push(`entity_id: ${JSON.stringify(entityId)}`);
if (era) frontmatter.push(`era: ${JSON.stringify(era)}`);
for (const [key, value] of Object.entries(data)) {
  if (Array.isArray(value) ? value.length : Boolean(value)) frontmatter.push(`${key}: ${yamlValue(value)}`);
}
frontmatter.push(`tags: [${JSON.stringify(type)}]`, "---");

const bodies = {
  character: ["## Summary", "", "## Appearance", "", "## Personality", "", "## Biography", "", "## Relationships"],
  faction: ["## Summary", "", "## Culture", "", "## Government", "", "## Military", "", "## Economy", "", "## History"],
  location: ["## Summary", "", "## Geography", "", "## People and Culture", "", "## Everyday Life", "", "## History", "", "## Story Use"],
  event: ["## Summary", "", "## Background", "", "## The Event", "", "## Aftermath", "", "## Outcome"],
  species: ["## Summary", "", "## Identification", "", "## Ecology", "", "## Relationship with people"],
};

const guidance = type === "location"
  ? [
      "> [!tip] Grow locations progressively",
      "> Record only the detail that makes this place usable. Later, use **Templater: Insert template → Add Location Fields** for settlement, wilderness, site or route detail. Put scene-facing material in the Storyteller View section at the foot of the note.",
      ""
    ]
  : [];

const body = [
  ...guidance,
  ...bodies[type],
  "",
  "## Related",
  "",
  "- [ ] Review this inbox draft and promote it deliberately when established.",
  "",
  STORYTELLER_START,
  "",
  "## Storyteller View",
  "",
  STORYTELLER_END,
  ""
];
tR += `${frontmatter.join("\n")}\n\n${body.join("\n")}`;
await ensureFolder(config.folder);
if (tp.file.folder(true) !== config.folder) await tp.file.move(`${config.folder}/${title}`);
%>
