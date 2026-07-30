<%*
const RARITY_FIELD = { key: "rarity", label: "Rarity", options: ["Leave undefined", "Common", "Uncommon", "Rare", "Singular"], values: ["", "Common", "Uncommon", "Rare", "Singular"] };

const configs = {
  fauna: [
    { id: "profile", label: "Profile — kind, size and rarity", fields: [
      { key: "fauna_kind", prompt: "Broad kind of animal (for example: browsing herd animal, burrowing scavenger)" },
      { key: "size_class", label: "Size", options: ["Leave undefined", "Tiny", "Small", "Human-scale", "Large", "Massive"], values: ["", "Tiny", "Small", "Human-scale", "Large", "Massive"] },
      RARITY_FIELD
    ] },
    { id: "encounter", label: "Encounter — signs, behaviour and danger", fields: [
      { key: "signs_of_presence", prompt: "How might someone know it is nearby before seeing it?" },
      { key: "encounter_behaviour", prompt: "How does it usually react when encountered?" },
      { key: "threat_level", label: "Threat", options: ["Leave undefined", "Negligible", "Low", "Moderate", "High", "Extreme"], values: ["", "Negligible", "Low", "Moderate", "High", "Extreme"] }
    ] },
    { id: "ecology", label: "Ecology — dependencies and relationships", fields: [
      { key: "ecology_summary", prompt: "What does it eat, compete with, or get hunted by? One useful sentence is enough." }
    ] },
    { id: "people", label: "People — why ordinary people care", fields: [
      { key: "human_relevance", prompt: "Why would an ordinary person care about this animal?" }
    ] },
    { id: "culture", label: "Culture — beliefs and symbolism", fields: [
      { key: "cultural_significance", prompt: "Who fears, reveres, symbolises or ritualises this animal, and why?" }
    ] },
    { id: "story", label: "Story seed — a problem it can create", fields: [
      { key: "story_complication", prompt: "What problem could this animal create in a story?" }
    ] }
  ],
  flora: [
    { id: "profile", label: "Profile — growth form and rarity", fields: [
      { key: "growth_form", prompt: "Growth form (for example: tree, creeping vine, reed, thorn scrub)" },
      RARITY_FIELD
    ] },
    { id: "identification", label: "Identification — appearance and signs", fields: [
      { key: "identification", prompt: "What is the quickest reliable way to identify it?" },
      { key: "signs_of_presence", prompt: "What nearby sign might reveal it before the plant itself is seen?" }
    ] },
    { id: "ecology", label: "Ecology — growth and relationships", fields: [
      { key: "growth_conditions", prompt: "What conditions does it require or strongly prefer?" },
      { key: "ecological_relationships", prompt: "What feeds on, spreads, shelters or competes with it?" }
    ] },
    { id: "use", label: "Use — harvesting and practical value", fields: [
      { key: "human_relevance", prompt: "Why would an ordinary person gather, grow, destroy or protect it?" }
    ] },
    { id: "hazards", label: "Hazards — toxicity or unsafe handling", fields: [
      { key: "hazards", prompt: "What can go wrong when someone touches, eats, burns or harvests it?" }
    ] },
    { id: "culture", label: "Culture — beliefs and symbolism", fields: [
      { key: "cultural_significance", prompt: "Who values, fears or ritualises this plant, and why?" }
    ] },
    { id: "story", label: "Story seed — a problem it can create", fields: [
      { key: "story_complication", prompt: "What problem could this plant create in a story?" }
    ] }
  ],
  fungi: [
    { id: "profile", label: "Profile — growth form, substrate and rarity", fields: [
      { key: "growth_form", prompt: "Growth form (for example: shelf fungus, mould, fruiting caps, subterranean network)" },
      { key: "substrate", prompt: "Primary substrate or host, if important" },
      RARITY_FIELD
    ] },
    { id: "identification", label: "Identification — appearance and signs", fields: [
      { key: "identification", prompt: "What is the quickest reliable way to identify it?" },
      { key: "signs_of_presence", prompt: "What might reveal a colony before its fruiting bodies are seen?" }
    ] },
    { id: "ecology", label: "Ecology — fruiting and spread", fields: [
      { key: "fruiting_conditions", prompt: "What causes it to fruit or become noticeable?" },
      { key: "spread", prompt: "How does it meaningfully spread?" }
    ] },
    { id: "use", label: "Use — gathering and practical value", fields: [
      { key: "human_relevance", prompt: "Why would an ordinary person gather, cultivate, destroy or avoid it?" }
    ] },
    { id: "hazards", label: "Hazards — spores, toxicity or infection", fields: [
      { key: "hazards", prompt: "What can go wrong through exposure, ingestion, disturbance or harvesting?" }
    ] },
    { id: "culture", label: "Culture — beliefs and symbolism", fields: [
      { key: "cultural_significance", prompt: "Who values, fears or ritualises this fungus, and why?" }
    ] },
    { id: "story", label: "Story seed — a problem it can create", fields: [
      { key: "story_complication", prompt: "What problem could this fungus create in a story?" }
    ] }
  ],
  item: [
    { id: "profile", label: "Profile — type, origin and rarity", fields: [
      { key: "item_type", prompt: "Item type (for example: field tool, weapon, ritual object, household good)" },
      { key: "origin", prompt: "Place, culture, faction or maker of origin, if important" },
      RARITY_FIELD
    ] },
    { id: "use", label: "Use — purpose and limitations", fields: [
      { key: "primary_use", prompt: "What is this item actually used for?" },
      { key: "limitations", prompt: "What practical limitation, cost or trade-off matters?" }
    ] },
    { id: "construction", label: "Construction — materials and manufacture", fields: [
      { key: "materials", prompt: "Which materials meaningfully define the item?" },
      { key: "construction", prompt: "What is notable about how it is made?" }
    ] },
    { id: "availability", label: "Availability — access and common users", fields: [
      { key: "availability", prompt: "How difficult is it to obtain, and what controls that access?" },
      { key: "common_users", prompt: "Who commonly carries, owns or operates it?" }
    ] },
    { id: "culture", label: "Culture — meaning and symbolism", fields: [
      { key: "cultural_significance", prompt: "What does this item communicate about its owner, maker or culture?" }
    ] },
    { id: "story", label: "Story seed — a problem it can create", fields: [
      { key: "story_complication", prompt: "What problem could ownership, loss, scarcity or misuse of this item create?" }
    ] }
  ],
  "myrkild-unit": [
    { id: "presence", label: "Presence — signs and encounter context", fields: [
      { key: "signs_of_presence", prompt: "What evidence warns that this construct is active nearby?" },
      { key: "encounter_context", prompt: "Under what circumstances is it most likely to be encountered?" }
    ] },
    { id: "people", label: "People — knowledge and response", fields: [
      { key: "human_relevance", prompt: "What would informed people know, fear or do in response to it?" }
    ] },
    { id: "story", label: "Story seed — consequences beyond combat", fields: [
      { key: "story_complication", prompt: "What problem can this construct create beyond simply attacking someone?" }
    ] }
  ],
  location: [
    { id: "experience", label: "Experience — approach and first impression", fields: [
      { key: "approach_signs", prompt: "What might reveal that characters are approaching this place before they arrive?" },
      { key: "first_impression", prompt: "What immediate impression should this place make on a newcomer?" },
      { key: "sensory_signature", prompt: "Which recurring sight, sound, smell or physical sensation makes the place distinctive?" }
    ] },
    { id: "use", label: "Use — why people come and what happens here", fields: [
      { key: "why_people_come", prompt: "Why do ordinary people or travellers deliberately come here?" },
      { key: "ordinary_activity", prompt: "What ordinary activity makes the location feel inhabited or used?" }
    ] },
    { id: "knowledge", label: "Knowledge — outsiders and locals", fields: [
      { key: "outsider_knowledge", prompt: "What would a reasonably informed outsider commonly know about this place?" },
      { key: "local_knowledge", prompt: "What useful truth do locals know that outsiders usually do not?" }
    ] },
    { id: "story", label: "Story seed — local pressure or complication", fields: [
      { key: "local_tension", prompt: "What unresolved local pressure can affect people here even without direct violence?" },
      { key: "story_complication", prompt: "What problem could this location naturally create in a story?" }
    ] }
  ],
  faction: [
    { id: "presence", label: "Presence — recognition and contact", fields: [
      { key: "recognisable_presence", prompt: "How would someone recognise this faction's presence before meeting a named member?" },
      { key: "encounter_context", prompt: "How are ordinary people most likely to encounter this faction?" },
      { key: "public_reputation", prompt: "What broad reputation does the faction have among people who know of it?" }
    ] },
    { id: "agenda", label: "Agenda — wants, pressure and methods", fields: [
      { key: "current_wants", prompt: "What does this faction currently want enough to act on?" },
      { key: "current_pressures", prompt: "What pressure, fear or constraint is shaping its current behaviour?" },
      { key: "preferred_methods", prompt: "What methods does it normally favour when pursuing its aims?" }
    ] },
    { id: "reach", label: "Reach — resources and limits", fields: [
      { key: "resources_and_reach", prompt: "What can this faction realistically bring to bear, and where?" },
      { key: "operational_limits", prompt: "Where does its influence, knowledge or capability meaningfully break down?" }
    ] },
    { id: "friction", label: "Friction — internal tensions", fields: [
      { key: "internal_tensions", prompt: "Which internal disagreement, constituency or contradiction can change how the faction behaves?" }
    ] },
    { id: "story", label: "Story seed — consequences of involvement", fields: [
      { key: "story_complication", prompt: "What problem could involvement with this faction naturally create?" }
    ] }
  ]
};

const KEEP = "__viscerium_keep__";
const CLEAR = "__viscerium_clear__";
const type = tp.frontmatter.type;
const modules = configs[type];
const hasValue = (value) => value !== undefined && value !== null && value !== "";
const displayValue = (value) => Array.isArray(value) ? value.join(", ") : String(value ?? "");

if (!modules) {
  new tp.obsidian.Notice(`No Storyteller field set is defined for type: ${type ?? "undefined"}`);
  tR = "";
  return;
}

const moduleLabels = modules.map((module) => {
  const populated = module.fields.filter((field) => hasValue(tp.frontmatter[field.key])).length;
  return `${module.label} — ${populated}/${module.fields.length} populated`;
});

const selected = await tp.system.multi_suggester(
  moduleLabels,
  modules.map((module) => module.id),
  false,
  "Review Storyteller — choose sections to add or edit"
) ?? [];

if (!selected.length) {
  new tp.obsidian.Notice("No Storyteller sections selected.");
  tR = "";
  return;
}

const changes = {};
for (const module of modules) {
  if (!selected.includes(module.id)) continue;

  for (const field of module.fields) {
    const existing = tp.frontmatter[field.key];
    const populated = hasValue(existing);

    if (field.options) {
      const choices = [];
      const values = [];

      if (populated) {
        choices.push(`Keep current — ${displayValue(existing)}`);
        values.push(KEEP);
        choices.push("Clear value");
        values.push(CLEAR);
      } else {
        choices.push("Leave undefined");
        values.push(KEEP);
      }

      for (let index = 0; index < field.options.length; index += 1) {
        const optionValue = field.values[index];
        if (optionValue === "") continue;
        choices.push(field.options[index]);
        values.push(optionValue);
      }

      const choice = await tp.system.suggester(
        choices,
        values,
        false,
        `${field.label ?? field.key}${populated ? " — currently set" : ""}`
      );

      if (choice === null || choice === KEEP) continue;
      if (choice === CLEAR) {
        if (populated) changes[field.key] = { action: "clear" };
        continue;
      }
      if (!populated || choice !== existing) changes[field.key] = { action: "set", value: choice };
      continue;
    }

    const response = await tp.system.prompt(
      `${field.prompt}\n\nSubmit blank to clear this field. Cancel to leave it unchanged.`,
      populated ? displayValue(existing) : "",
      false
    );

    if (response === null) continue;
    const value = response.trim();
    if (value === "") {
      if (populated) changes[field.key] = { action: "clear" };
      continue;
    }
    if (!populated || value !== displayValue(existing)) changes[field.key] = { action: "set", value };
  }
}

const entries = Object.entries(changes);
if (!entries.length) {
  new tp.obsidian.Notice("No Storyteller changes made.");
  tR = "";
  return;
}

let updated = 0;
let cleared = 0;
await tp.app.fileManager.processFrontMatter(tp.config.target_file, (frontmatter) => {
  for (const [key, change] of entries) {
    if (change.action === "clear") {
      delete frontmatter[key];
      cleared += 1;
    } else {
      frontmatter[key] = change.value;
      updated += 1;
    }
  }
  if (updated > 0 && !frontmatter.development_level) frontmatter.development_level = "stub";
});

const parts = [];
if (updated) parts.push(`${updated} added/updated`);
if (cleared) parts.push(`${cleared} cleared`);
new tp.obsidian.Notice(`Storyteller saved: ${parts.join(", ")}.`);
tR = "";
%>