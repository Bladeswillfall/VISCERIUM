<%*
const ERA_OPTIONS = ["CITADEL", "SMOG", "NEARSIGHT", "ENTROPY"];
const RARITY_FIELD = { key: "rarity", label: "Rarity", options: ["Leave undefined", "Common", "Uncommon", "Rare", "Singular"], values: ["", "Common", "Uncommon", "Rare", "Singular"] };

const entityTypes = {
  fauna: {
    label: "Fauna",
    descriptionPrompt: "What makes this animal recognisably Errackian rather than an Earth default?",
    quickFields: [
      { key: "fauna_kind", prompt: "Broad kind of animal (for example: browsing herd animal, burrowing scavenger)" },
      { key: "size_class", label: "Size", options: ["Leave undefined", "Tiny", "Small", "Human-scale", "Large", "Massive"], values: ["", "Tiny", "Small", "Human-scale", "Large", "Massive"] }
    ],
    modules: [
      {
        id: "encounter",
        label: "Encounter — signs, behaviour and danger",
        heading: "Behaviour",
        bodyPrompt: "Describe behaviour only as far as a scene currently requires.",
        fields: [
          { key: "signs_of_presence", prompt: "How might someone know it is nearby before seeing it?" },
          { key: "encounter_behaviour", prompt: "How does it usually react when encountered?" },
          { key: "threat_level", label: "Threat", options: ["Leave undefined", "Negligible", "Low", "Moderate", "High", "Extreme"], values: ["", "Negligible", "Low", "Moderate", "High", "Extreme"] }
        ]
      },
      {
        id: "ecology",
        label: "Ecology — dependencies and relationships",
        heading: "Ecology",
        bodyPrompt: "What does it depend on, and what depends on it? Record only relationships that make the world more usable.",
        fields: [
          { key: "ecology_summary", prompt: "What does it eat, compete with, or get hunted by? One useful sentence is enough." }
        ]
      },
      {
        id: "people",
        label: "People — why ordinary people care",
        heading: "Relationship with people",
        bodyPrompt: "Explain why people hunt, farm, avoid, protect or otherwise care about it.",
        fields: [
          { key: "human_relevance", prompt: "Why would an ordinary person care about this animal?" }
        ]
      },
      {
        id: "culture",
        label: "Culture — beliefs and symbolism",
        heading: "Cultural significance",
        bodyPrompt: "Add culture only where a specific people have a meaningful relationship with it.",
        fields: [
          { key: "cultural_significance", prompt: "Who fears, reveres, symbolises or ritualises this animal, and why?" }
        ]
      },
      {
        id: "story",
        label: "Story seed — a problem it can create",
        heading: "Story potential",
        bodyPrompt: "Develop the seed only when it becomes relevant to a tale.",
        fields: [
          { key: "story_complication", prompt: "What problem could this animal create in a story?" }
        ]
      }
    ]
  },
  flora: {
    label: "Flora",
    descriptionPrompt: "What makes this plant distinct enough to belong in VISCERIUM rather than being an Earth plant with a new name?",
    quickFields: [
      { key: "growth_form", prompt: "Growth form (for example: tree, creeping vine, reed, thorn scrub)" }
    ],
    modules: [
      {
        id: "identification",
        label: "Identification — appearance and signs",
        heading: "Identification",
        bodyPrompt: "Describe the features somebody in the world could actually recognise.",
        fields: [
          { key: "identification", prompt: "What is the quickest reliable way to identify it?" },
          { key: "signs_of_presence", prompt: "What nearby sign might reveal it before the plant itself is seen?" }
        ]
      },
      {
        id: "ecology",
        label: "Ecology — growth and relationships",
        heading: "Ecology",
        bodyPrompt: "Record only the conditions and relationships that affect placement or stories.",
        fields: [
          { key: "growth_conditions", prompt: "What conditions does it require or strongly prefer?" },
          { key: "ecological_relationships", prompt: "What feeds on, spreads, shelters or competes with it?" }
        ]
      },
      {
        id: "use",
        label: "Use — harvesting and practical value",
        heading: "Use and harvesting",
        bodyPrompt: "Focus on what people do with it and what that changes.",
        fields: [
          { key: "human_relevance", prompt: "Why would an ordinary person gather, grow, destroy or protect it?" }
        ]
      },
      {
        id: "hazards",
        label: "Hazards — toxicity or unsafe handling",
        heading: "Hazards",
        bodyPrompt: "Do not invent a hazard merely to make the plant exotic.",
        fields: [
          { key: "hazards", prompt: "What can go wrong when someone touches, eats, burns or harvests it?" }
        ]
      },
      {
        id: "culture",
        label: "Culture — beliefs and symbolism",
        heading: "Cultural significance",
        bodyPrompt: "Add culture only where a specific people have a meaningful relationship with it.",
        fields: [
          { key: "cultural_significance", prompt: "Who values, fears or ritualises this plant, and why?" }
        ]
      },
      {
        id: "story",
        label: "Story seed — a problem it can create",
        heading: "Story potential",
        bodyPrompt: "Develop the seed only when it becomes relevant to a tale.",
        fields: [
          { key: "story_complication", prompt: "What problem could this plant create in a story?" }
        ]
      }
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
      {
        id: "identification",
        label: "Identification — appearance and signs",
        heading: "Identification",
        bodyPrompt: "Describe evidence a traveller, healer or gatherer could recognise.",
        fields: [
          { key: "identification", prompt: "What is the quickest reliable way to identify it?" },
          { key: "signs_of_presence", prompt: "What might reveal a colony before its fruiting bodies are seen?" }
        ]
      },
      {
        id: "ecology",
        label: "Ecology — fruiting, spread and relationships",
        heading: "Ecology",
        bodyPrompt: "Record only conditions that affect placement, spread or consequences.",
        fields: [
          { key: "fruiting_conditions", prompt: "What causes it to fruit or become noticeable?" },
          { key: "spread", prompt: "How does it meaningfully spread?" }
        ]
      },
      {
        id: "use",
        label: "Use — gathering and practical value",
        heading: "Use and harvesting",
        bodyPrompt: "Focus on uses that affect daily life, trade, medicine, ritual or conflict.",
        fields: [
          { key: "human_relevance", prompt: "Why would an ordinary person gather, cultivate, destroy or avoid it?" }
        ]
      },
      {
        id: "hazards",
        label: "Hazards — spores, toxicity or infection",
        heading: "Hazards",
        bodyPrompt: "Do not invent a hazard merely because fungi are expected to be sinister.",
        fields: [
          { key: "hazards", prompt: "What can go wrong through exposure, ingestion, disturbance or harvesting?" }
        ]
      },
      {
        id: "culture",
        label: "Culture — beliefs and symbolism",
        heading: "Cultural significance",
        bodyPrompt: "Add culture only where a specific people have a meaningful relationship with it.",
        fields: [
          { key: "cultural_significance", prompt: "Who values, fears or ritualises this fungus, and why?" }
        ]
      },
      {
        id: "story",
        label: "Story seed — a problem it can create",
        heading: "Story potential",
        bodyPrompt: "Develop the seed only when it becomes relevant to a tale.",
        fields: [
          { key: "story_complication", prompt: "What problem could this fungus create in a story?" }
        ]
      }
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
      {
        id: "use",
        label: "Use — purpose and limitations",
        heading: "Use and limitations",
        bodyPrompt: "Explain what the object enables and where it fails. Avoid game-system statistics.",
        fields: [
          { key: "primary_use", prompt: "What is this item actually used for?" },
          { key: "limitations", prompt: "What practical limitation, cost or trade-off matters?" }
        ]
      },
      {
        id: "construction",
        label: "Construction — materials and manufacture",
        heading: "Construction",
        bodyPrompt: "Add manufacture only where it changes availability, identity or use.",
        fields: [
          { key: "materials", prompt: "Which materials meaningfully define the item?" },
          { key: "construction", prompt: "What is notable about how it is made?" }
        ]
      },
      {
        id: "availability",
        label: "Availability — access and common users",
        heading: "Availability",
        bodyPrompt: "Explain who can realistically obtain it and why.",
        fields: [
          { key: "availability", prompt: "How difficult is it to obtain, and what controls that access?" },
          { key: "common_users", prompt: "Who commonly carries, owns or operates it?" }
        ]
      },
      {
        id: "culture",
        label: "Culture — meaning and symbolism",
        heading: "Cultural significance",
        bodyPrompt: "Add symbolism only where it affects how people treat or recognise the object.",
        fields: [
          { key: "cultural_significance", prompt: "What does this item communicate about its owner, maker or culture?" }
        ]
      },
      {
        id: "story",
        label: "Story seed — a problem it can create",
        heading: "Story potential",
        bodyPrompt: "Develop the seed only when it becomes relevant to a tale.",
        fields: [
          { key: "story_complication", prompt: "What problem could ownership, loss, scarcity or misuse of this item create?" }
        ]
      }
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

const values = {};
const propertyOrder = [];
const populatedModules = new Set();

async function collectField(field) {
  let value = "";
  if (field.options) {
    value = await tp.system.suggester(field.options, field.values, false, field.label ?? field.key) ?? "";
  } else {
    value = (await tp.system.prompt(field.prompt, "", false) ?? "").trim();
  }
  if (value === "") return false;
  values[field.key] = value;
  propertyOrder.push(field.key);
  return true;
}

if (selectedOptions.includes(PROFILE_OPTION)) {
  for (const field of config.quickFields) await collectField(field);
  await collectField(RARITY_FIELD);
}

for (const module of config.modules) {
  if (!selectedOptions.includes(module.id)) continue;
  let populated = false;
  for (const field of module.fields) {
    if (await collectField(field)) populated = true;
  }
  if (populated) populatedModules.add(module.id);
}

const yamlString = (value) => JSON.stringify(value);
const yamlList = (items) => `[${items.map((item) => yamlString(item)).join(", ")}]`;

const frontmatter = [
  "---",
  `title: ${yamlString(title)}`,
  `description: ${yamlString(description)}`,
  "publish: false",
  "status: draft",
  `type: ${type}`,
  "development_level: stub"
];
if (eras.length) frontmatter.push(`eras: ${yamlList(eras)}`);
if (locations.length) frontmatter.push(`locations: ${yamlList(locations)}`);
if (biomes.length) frontmatter.push(`biomes: ${yamlList(biomes)}`);
for (const key of propertyOrder) frontmatter.push(`${key}: ${yamlString(values[key])}`);
frontmatter.push(`tags: ${yamlList(["story-entity", type])}`);
frontmatter.push("---");

const body = [
  `# ${title}`,
  "",
  "> [!tip] Stop when usable",
  "> This creator note starts small. Structured properties feed its Obsidian Base card and the future Storyteller view. Leave anything unneeded undefined and return only when a story demands more.",
  "",
  "## Summary",
  "",
  description,
  "",
  "## Description",
  "",
  `%% ${config.descriptionPrompt} %%`
];

for (const module of config.modules) {
  if (!populatedModules.has(module.id)) continue;
  body.push("", `## ${module.heading}`, "", `%% ${module.bodyPrompt} The concise Storyteller value lives in the note properties; use this section for fuller canon only when needed. %%`);
}

body.push("", "## Related", "", "%% Add links only when they establish a meaningful relationship. %%", "");

tR += `${frontmatter.join("\n")}\n\n${body.join("\n")}`;
%>
