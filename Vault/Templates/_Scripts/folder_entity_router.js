const ROUTES = Object.freeze({
  article: { label: "General article", template: "Templates/Lore/Article Template.md" },
  character: { label: "Character", template: "Templates/Lore/Character Template.md" },
  faction: { label: "Faction", template: "Templates/Lore/Faction Template.md" },
  location: { label: "Location", template: "Templates/Lore/Location Template.md" },
  event: { label: "Event", template: "Templates/Lore/Event Template.md" },
  species: { label: "Species", template: "Templates/Lore/Species Template.md" },
  item: { label: "Item", template: "Templates/Lore/Item Template.md" },
  culture: { label: "Culture", template: "Templates/Lore/Culture Template.md" },
  belief: { label: "Belief / religion", template: "Templates/Lore/Belief and Religion Template.md" },
  naming_language: { label: "Naming language", template: "Templates/Lore/Naming Language Template.md" },
  resonance_practice: { label: "Resonance practice", template: "Templates/Lore/Resonance Practice Template.md" },
  map: { label: "Map", template: "Templates/Publishing/Map Template.md" },
  image: { label: "Image metadata", template: "Templates/Publishing/Image Metadata Template.md" },
  timeline: { label: "Timeline", template: "Templates/Timelines/Timeline Template.md" },
  calendar: { label: "Calendar", template: "Templates/Lore/Calendar Template.md" },
  era: { label: "Era", template: "Templates/Lore/Era Template.md" },
});

const ALIASES = Object.freeze({
  article: ["article", "articles", "degel system"],
  character: ["character", "characters", "person", "persons", "people", "npc", "npcs"],
  faction: [
    "faction", "factions", "nation", "nations", "organisation", "organisations",
    "organization", "organizations", "kingdom", "kingdoms", "dominion", "dominions",
    "republic", "republics", "corporation", "corporations", "order", "orders",
    "cult", "cults", "guild", "guilds", "clan", "clans", "house", "houses",
  ],
  location: [
    "location", "locations", "place", "places", "region", "regions", "settlement",
    "settlements", "city", "cities", "town", "towns", "village", "villages",
    "wilderness", "site", "sites", "ruin", "ruins", "landmark", "landmarks",
    "world", "worlds", "planet", "planets",
  ],
  event: ["event", "events", "battle", "battles", "conflict", "conflicts"],
  species: [
    "species", "fauna", "animal", "animals", "reptile", "reptiles", "mammal",
    "mammals", "bird", "birds", "avian", "avians", "fish", "amphibian",
    "amphibians", "insect", "insects", "arachnid", "arachnids", "flora", "plant",
    "plants", "fungi", "fungus", "myrkildicary",
  ],
  item: [
    "item", "items", "weapon", "weapons", "weaponry", "armour", "armours", "armor",
    "armors", "equipment", "tool", "tools", "artefact", "artefacts", "artifact",
    "artifacts", "relic", "relics", "vehicle", "vehicles", "technology",
    "weapons and armour", "weapons armour",
  ],
  culture: ["culture", "cultures", "ethnicity", "ethnicities"],
  belief: ["belief", "beliefs", "religion", "religions", "faith", "faiths"],
  naming_language: ["naming", "naming language", "naming languages", "language", "languages"],
  resonance_practice: [
    "resonance", "resonance practice", "resonance practices", "resonant practice", "resonant practices",
  ],
  map: ["map", "maps"],
  image: ["image", "images", "artwork"],
  timeline: ["timeline", "timelines"],
  calendar: ["calendar", "calendars"],
});

const ITEM_SUBTYPES = Object.freeze({
  weapon: "weapon",
  weapons: "weapon",
  weaponry: "weapon",
  armour: "armour",
  armours: "armour",
  armor: "armour",
  armors: "armour",
  equipment: "equipment",
  tool: "tool",
  tools: "tool",
  artefact: "artefact",
  artefacts: "artefact",
  artifact: "artefact",
  artifacts: "artefact",
  relic: "artefact",
  relics: "artefact",
  vehicle: "vehicle",
  vehicles: "vehicle",
  technology: "technology",
});

const SPECIES_SUBTYPES = Object.freeze({
  fauna: "animal",
  animal: "animal",
  animals: "animal",
  reptile: "reptile",
  reptiles: "reptile",
  mammal: "mammal",
  mammals: "mammal",
  bird: "bird",
  birds: "bird",
  avian: "bird",
  avians: "bird",
  fish: "fish",
  amphibian: "amphibian",
  amphibians: "amphibian",
  insect: "insect",
  insects: "insect",
  arachnid: "arachnid",
  arachnids: "arachnid",
  flora: "plant",
  plant: "plant",
  plants: "plant",
  fungi: "fungus",
  fungus: "fungus",
  myrkildicary: "Myrkild",
});

const ERA_VALUES = Object.freeze(["CITADEL", "SMOG", "NEARSIGHT", "ENTROPY", "Universal"]);

function normaliseSegment(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function folderSegments(folderPath) {
  return String(folderPath ?? "").split(/[\\/]+/).filter(Boolean);
}

const TYPE_BY_ALIAS = new Map();
for (const [type, aliases] of Object.entries(ALIASES)) {
  for (const alias of aliases) TYPE_BY_ALIAS.set(normaliseSegment(alias), type);
}

function classifyFolder(folderPath) {
  const segments = folderSegments(folderPath);
  for (let index = segments.length - 1; index >= 0; index -= 1) {
    const type = TYPE_BY_ALIAS.get(normaliseSegment(segments[index]));
    if (type) return { type, segment: segments[index], index };
  }

  const last = normaliseSegment(segments.at(-1));
  if (last === "eras") return { type: "era", segment: segments.at(-1), index: segments.length - 1 };
  return null;
}

function inferEra(folderPath) {
  const wanted = new Map(ERA_VALUES.map((era) => [era.toLocaleLowerCase("en"), era]));
  for (const segment of folderSegments(folderPath)) {
    const era = wanted.get(String(segment).toLocaleLowerCase("en"));
    if (era) return era;
  }
  return "";
}

function nearestSubtype(folderPath, table) {
  const segments = folderSegments(folderPath);
  for (let index = segments.length - 1; index >= 0; index -= 1) {
    const subtype = table[normaliseSegment(segments[index])];
    if (subtype) return subtype;
  }
  return "";
}

function inferSubtype(type, folderPath) {
  if (type === "item") return nearestSubtype(folderPath, ITEM_SUBTYPES);
  if (type === "species") return nearestSubtype(folderPath, SPECIES_SUBTYPES);
  return "";
}

function fillBlankScalar(source, key, value) {
  if (!value) return source;
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return source.replace(new RegExp(`^${escaped}:\\s*$`, "m"), `${key}: ${JSON.stringify(value)}`);
}

function setTemplateTitle(source, title) {
  return source.replace(
    /^title:\s*["']?\{\{title\}\}["']?\s*$/m,
    `title: ${JSON.stringify(title)}`,
  );
}

async function chooseType(tp) {
  const entries = Object.entries(ROUTES).filter(([type]) => type !== "era");
  return await tp.system.suggester(
    entries.map(([, route]) => route.label),
    entries.map(([type]) => type),
    true,
    "This folder has no recognised content type. What are you creating?",
  );
}

async function folderEntityRouter(tp) {
  const folder = tp.file.folder(true);
  const inferred = classifyFolder(folder);
  const type = inferred?.type ?? await chooseType(tp);
  const route = ROUTES[type];
  if (!route) throw new Error(`No VISCERIUM folder template route exists for type: ${type}`);

  const currentTitle = tp.file.title === "Untitled" ? "" : tp.file.title;
  const title = String(await tp.system.prompt("Name", currentTitle, true) ?? "").trim();
  if (!title) throw new Error("A title is required to create a VISCERIUM note.");
  if (title !== tp.file.title) await tp.file.rename(title);

  const templateFile = tp.app.vault.getAbstractFileByPath(route.template);
  if (!templateFile) throw new Error(`Missing VISCERIUM template: ${route.template}`);

  let rendered = await tp.app.vault.read(templateFile);
  rendered = setTemplateTitle(rendered, title);
  rendered = fillBlankScalar(rendered, "era", inferEra(folder));

  const subtype = inferSubtype(type, folder);
  if (type === "item") rendered = fillBlankScalar(rendered, "item_type", subtype);
  if (type === "species") rendered = fillBlankScalar(rendered, "species_kind", subtype);

  return rendered;
}

module.exports = folderEntityRouter;
module.exports.ROUTES = ROUTES;
module.exports.classifyFolder = classifyFolder;
module.exports.inferEra = inferEra;
module.exports.inferSubtype = inferSubtype;
module.exports.normaliseSegment = normaliseSegment;
