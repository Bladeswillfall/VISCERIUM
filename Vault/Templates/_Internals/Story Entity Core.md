<%*
const ERA_OPTIONS = ["CITADEL", "SMOG", "NEARSIGHT", "ENTROPY"];
const STORYTELLER_START = "<!-- viscerium:storyteller:start -->";
const STORYTELLER_END = "<!-- viscerium:storyteller:end -->";
const RARITY_FIELD = {
  key: "rarity",
  label: "Rarity",
  options: ["Leave undefined", "Common", "Uncommon", "Rare", "Singular"],
  values: ["", "Common", "Uncommon", "Rare", "Singular"]
};

const entityTypes = {
  fauna: {
    label: "Fauna",
    descriptionPrompt: "What makes this animal recognisably Errackian rather than an Earth default?",
    quickFields: [
      { key: "fauna_kind", prompt: "Broad kind of animal (for example: browsing herd animal, burrowing scavenger)" },
      { key: "size_class", label: "Size", options: ["Leave undefined", "Tiny", "Small", "Human-scale", "Large", "Massive"], values: ["", "Tiny", "Small", "Human-scale", "Large", "Massive"] }
    ],
    modules: [
      { id: "encounter", label: "Encounter — signs, behaviour and danger", heading: "Encounter", fields: [
        { key: "signs_of_presence", label: "Signs of presence", prompt: "How might someone know it is nearby before seeing it?" },
        { key: "encounter_behaviour", label: "Encounter behaviour", prompt: "How does it usually react when encountered?" },
        { key: "threat_level", label: "Threat", options: ["Leave undefined", "Negligible", "Low", "Moderate", "High", "Extreme"], values: ["", "Negligible", "Low", "Moderate", "High", "Extreme"] }
      ] },
      { id: "ecology", label: "Ecology — dependencies and relationships", heading: "Ecological relationships", fields: [
        { key: "ecology_summary", label: "Relationships", prompt: "What does it eat, compete with, or get hunted by? One useful sentence is enough." }
      ] },
      { id: "people", label: "People — why ordinary people care", heading: "Why people care", fields: [
        { key: "human_relevance", label: "Practical relevance", prompt: "Why would an ordinary person care about this animal?" }
      ] },
      { id: "culture", label: "Culture — beliefs and symbolism", heading: "Cultural significance", fields: [
        { key: "cultural_significance", label: "Significance", prompt: "Who fears, reveres, symbolises or ritualises this animal, and why?" }
      ] },
      { id: "story", label: "Story seed — a problem it can create", heading: "Complications", fields: [
        { key: "story_complication", label: "Complication", prompt: "What problem could this animal create in a story?" }
      ] }
    ]
  },
  flora: {
    label: "Flora",
    descriptionPrompt: "What makes this plant distinct enough to belong in VISCERIUM rather than being an Earth plant with a new name?",
    quickFields: [
      { key: "growth_form", prompt: "Growth form (for example: tree, creeping vine, reed, thorn scrub)" }
    ],
    modules: [
      { id: "identification", label: "Identification — appearance and signs", heading: "Identification", fields: [
        { key: "identification", label: "Identification", prompt: "What is the quickest reliable way to identify it?" },
        { key: "signs_of_presence", label: "Signs of presence", prompt: "What nearby sign might reveal it before the plant itself is seen?" }
      ] },
      { id: "ecology", label: "Ecology — growth and relationships", heading: "Growth and ecology", fields: [
        { key: "growth_conditions", label: "Growth conditions", prompt: "What conditions does it require or strongly prefer?" },
        { key: "ecological_relationships", label: "Relationships", prompt: "What feeds on, spreads, shelters or competes with it?" }
      ] },
      { id: "use", label: "Use — harvesting and practical value", heading: "Use and harvesting", fields: [
        { key: "human_relevance", label: "Practical value", prompt: "Why would an ordinary person gather, grow, destroy or protect it?" }
      ] },
      { id: "hazards", label: "Hazards — toxicity or unsafe handling", heading: "Hazards", fields: [
        { key: "hazards", label: "Hazards", prompt: "What can go wrong when someone touches, eats, burns or harvests it?" }
      ] },
      { id: "culture", label: "Culture — beliefs and symbolism", heading: "Cultural significance", fields: [
        { key: "cultural_significance", label: "Significance", prompt: "Who values, fears or ritualises this plant, and why?" }
      ] },
      { id: "story", label: "Story seed — a problem it can create", heading: "Complications", fields: [
        { key: "story_complication", label: "Complication", prompt: "What problem could this plant create in a story?" }
      ] }
    ]
  },
  fungi: {
    label: "Fungi",
    descriptionPrompt: "What makes this fungus useful, unsettling or ecologically distinctive in Errack?",
    quickFields: [
      { key: "growth_form", prompt: "Growth form (for example: shelf fungus, mould, fruiting caps, subterranean network)" },
      { key: "substrate", prompt: "Primary substrate or host, if important" }
    ],
    modules: [
      { id: "identification", label: "Identification — appearance and signs", heading: "Identification", fields: [
        { key: "identification", label: "Identification", prompt: "What is the quickest reliable way to identify it?" },
        { key: "signs_of_presence", label: "Signs of presence", prompt: "What might reveal a colony before its fruiting bodies are seen?" }
      ] },
      { id: "ecology", label: "Ecology — fruiting, spread and relationships", heading: "Fruiting and spread", fields: [
        { key: "fruiting_conditions", label: "Fruiting conditions", prompt: "What causes it to fruit or become noticeable?" },
        { key: "spread", label: "Spread", prompt: "How does it meaningfully spread?" }
      ] },
      { id: "use", label: "Use — gathering and practical value", heading: "Use and harvesting", fields: [
        { key: "human_relevance", label: "Practical value", prompt: "Why would an ordinary person gather, cultivate, destroy or avoid it?" }
      ] },
      { id: "hazards", label: "Hazards — spores, toxicity or infection", heading: "Exposure risks", fields: [
        { key: "hazards", label: "Risks", prompt: "What can go wrong through exposure, ingestion, disturbance or harvesting?" }
      ] },
      { id: "culture", label: "Culture — beliefs and symbolism", heading: "Cultural significance", fields: [
        { key: "cultural_significance", label: "Significance", prompt: "Who values, fears or ritualises this fungus, and why?" }
      ] },
      { id: "story", label: "Story seed — a problem it can create", heading: "Complications", fields: [
        { key: "story_complication", label: "Complication", prompt: "What problem could this fungus create in a story?" }
      ] }
    ]
  },
  item: {
    label: "Item",
    descriptionPrompt: "What makes this object worth distinguishing from an ordinary real-world equivalent?",
    quickFields: [
      { key: "item_type", prompt: "Item type (for example: field tool, weapon, ritual object, household good)" },
      { key: "origin", prompt: "Place, culture, faction or maker of origin, if important" }
    ],
    modules: [
      { id: "use", label: "Use — purpose and limitations", heading: "Use and limitations", fields: [
        { key: "primary_use", label: "Primary use", prompt: "What is this item actually used for?" },
        { key: "limitations", label: "Limitations", prompt: "What practical limitation, cost or trade-off matters?" }
      ] },
      { id: "construction", label: "Construction — materials and manufacture", heading: "Construction", fields: [
        { key: "materials", label: "Materials", prompt: "Which materials meaningfully define the item?" },
        { key: "construction", label: "Manufacture", prompt: "What is notable about how it is made?" }
      ] },
      { id: "availability", label: "Availability — access and common users", heading: "Availability", fields: [
        { key: "availability", label: "Access", prompt: "How difficult is it to obtain, and what controls that access?" },
        { key: "common_users", label: "Common users", prompt: "Who commonly carries, owns or operates it?" }
      ] },
      { id: "culture", label: "Culture — meaning and symbolism", heading: "Cultural significance", fields: [
        { key: "cultural_significance", label: "Significance", prompt: "What does this item communicate about its owner, maker or culture?" }
      ] },
      { id: "story", label: "Story seed — a problem it can create", heading: "Complications", fields: [
        { key: "story_complication", label: "Complication", prompt: "What problem could ownership, loss, scarcity or misuse of this item create?" }
      ] }
    ]
  }
};

const typeKeys = Object.keys(entityTypes);
const type = await tp.system.suggester(
  typeKeys.map((key) => entityTypes[key].label),
  typeKeys,
  true,
  "What are you creating?"
);
const config = entityTypes[type];
const currentTitle = tp.file.title === "Untitled" ? "" : tp.file.title;
const title = (await tp.system.prompt("Name", currentTitle, true)).trim();
if (title && title !== tp.file.title) await tp.file.rename(title);
const description = (await tp.system.prompt(
  "One-line identity: what is it, and why is it worth remembering?",
  "",
  true
)).trim();
const eras = await tp.system.multi_suggester(
  ERA_OPTIONS,
  ERA_OPTIONS,
  false,
  "Which eras can it exist in? Select only what is currently established."
) ?? [];
const locations = await tp.user.reference_picker(tp, {
  types: ["location"],
  multiple: true,
  allowCreate: true,
  label: "location",
  stubType: "location",
  stubFolder: "Drafts/Inbox/Locations",
  prompt: type === "item" ? "Known regions or markets" : "Known locations or regions"
}) ?? [];
let biomes = [];
if (type !== "item") {
  const biomesText = await tp.system.prompt("Known biomes, comma-separated (optional)", "", false) ?? "";
  biomes = biomesText.split(",").map((value) => value.trim()).filter(Boolean);
}

const PROFILE_OPTION = "__profile";
const selectedOptions = await tp.system.multi_suggester(
  ["Profile — basic traits and rarity", ...config.modules.map((module) => module.label)],
  [PROFILE_OPTION, ...config.modules.map((module) => module.id)],
  false,
  "Optional detail — select only what matters to the current story"
) ?? [];

async function collectField(field) {
  if (field.options) return await tp.system.suggester(field.options, field.values, false, field.label ?? field.key) ?? "";
  return (await tp.system.prompt(field.prompt, "", false) ?? "").trim();
}

const profileValues = [];
if (selectedOptions.includes(PROFILE_OPTION)) {
  for (const field of [...config.quickFields, RARITY_FIELD]) {
    const value = await collectField(field);
    if (value !== "") profileValues.push([field.key, value]);
  }
}

const storytellerSections = [];
for (const module of config.modules) {
  if (!selectedOptions.includes(module.id)) continue;
  const items = [];
  for (const field of module.fields) {
    const value = await collectField(field);
    if (value !== "") items.push({ label: field.label ?? field.key, value });
  }
  if (items.length) storytellerSections.push({ heading: module.heading, items });
}

const yamlString = (value) => JSON.stringify(value);
const yamlList = (items) => `[${items.map((item) => yamlString(item)).join(", ")}]`;
const frontmatter = [
  "---",
  `title: ${yamlString(title)}`,
  `description: ${yamlString(description)}`,
  "status: draft",
  `type: ${type}`,
  "development_level: stub"
];
if (eras.length) frontmatter.push(`eras: ${yamlList(eras)}`);
if (locations.length) frontmatter.push(`locations: ${yamlList(locations)}`);
if (biomes.length) frontmatter.push(`biomes: ${yamlList(biomes)}`);
for (const [key, value] of profileValues) frontmatter.push(`${key}: ${yamlString(value)}`);
frontmatter.push(`tags: ${yamlList(["story-entity", type])}`);
frontmatter.push("---");

const body = [
  `# ${title}`,
  "",
  "> [!tip] Stop when usable",
  "> Structured profile properties feed Obsidian Bases. Storyteller guidance belongs in the marked footer below, where normal Markdown, tables, images, links and headings remain available.",
  "",
  "## Summary",
  "",
  description,
  "",
  "## Description",
  "",
  `%% ${config.descriptionPrompt} %%`,
  "",
  "## Related",
  "",
  "%% Add links only when they establish a meaningful relationship. %%",
  "",
  STORYTELLER_START,
  "",
  "## Storyteller View",
  ""
];

for (const section of storytellerSections) {
  body.push(`### ${section.heading}`, "");
  for (const item of section.items) body.push(`**${item.label}:** ${item.value}`, "");
}
body.push(STORYTELLER_END, "");

tR += `${frontmatter.join("\n")}\n\n${body.join("\n")}`;
%>
