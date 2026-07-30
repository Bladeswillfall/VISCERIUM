<%*
const LOCATION_KIND = {
  key: "location_kind",
  label: "Location kind",
  options: ["Leave undefined", "Region", "Settlement", "Wilderness", "Route", "Site"],
  values: ["", "region", "settlement", "wilderness", "route", "site"]
};

const modules = [
  { id: "profile", label: "Profile — broad kind", fields: [LOCATION_KIND] },
  { id: "settlement", label: "Settlement — scale, authority and practical life", fields: [
    { key: "settlement_scale", prompt: "Settlement scale or role (for example: hamlet, village, market town, fortress-city)" },
    { key: "population_band", prompt: "Approximate population band, if it matters" },
    { key: "governance_summary", prompt: "Who actually holds local authority, in one useful sentence?" },
    { key: "economic_role", prompt: "What materially sustains or defines this settlement?" },
    { key: "local_services", prompt: "Which services or institutions matter to residents or travellers?" },
    { key: "defences", prompt: "What meaningful defences or security arrangements exist?" }
  ] },
  { id: "wilderness", label: "Wilderness — terrain, resources and travel", fields: [
    { key: "terrain_summary", prompt: "What terrain most strongly shapes movement or settlement here?" },
    { key: "climate_summary", prompt: "What climate or recurring conditions materially affect life here?" },
    { key: "natural_resources", prompt: "Which local resources meaningfully attract, sustain or endanger people?" },
    { key: "wilderness_travel", prompt: "What makes travelling through this area distinct?" },
    { key: "environmental_hazards", prompt: "Which non-incidental environmental hazards matter here?" }
  ] },
  { id: "site", label: "Site / ruin — purpose, condition and access", fields: [
    { key: "site_origin", prompt: "What was this site originally made or used for, if known?" },
    { key: "site_condition", prompt: "What is its present physical condition?" },
    { key: "current_use", prompt: "Who or what uses it now, and for what?" },
    { key: "access_conditions", prompt: "What materially controls or complicates access?" },
    { key: "notable_features", prompt: "Which physical features are important enough to remember?" }
  ] },
  { id: "route", label: "Route — connections, traffic and conditions", fields: [
    { key: "route_connections", kind: "references", prompt: "Which established locations does this route meaningfully connect?" },
    { key: "normal_traffic", prompt: "Who normally uses this route, and why?" },
    { key: "route_conditions", prompt: "What are normal travel conditions along it?" },
    { key: "seasonal_changes", prompt: "What seasonal or periodic change materially alters the route?" },
    { key: "route_dangers", prompt: "Which recurring dangers meaningfully affect travel?" }
  ] }
];

if (tp.frontmatter.type !== "location") {
  new tp.obsidian.Notice("Add Location Fields only supports notes with type: location.");
  tR = "";
  return;
}

const missing = (key) => {
  const value = tp.frontmatter[key];
  return value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
};

const available = modules.filter((module) => module.fields.some((field) => missing(field.key)));
if (!available.length) {
  new tp.obsidian.Notice("All supported optional location fields are already present on this note.");
  tR = "";
  return;
}

const selected = await tp.system.multi_suggester(
  available.map((module) => module.label),
  available.map((module) => module.id),
  false,
  "Add only the location detail that is useful now"
) ?? [];

if (!selected.length) {
  new tp.obsidian.Notice("No fields added.");
  tR = "";
  return;
}

const additions = {};
for (const module of available) {
  if (!selected.includes(module.id)) continue;
  for (const field of module.fields) {
    if (!missing(field.key)) continue;

    let value = "";
    if (field.kind === "references") {
      value = await tp.user.reference_picker(tp, {
        types: ["location"],
        multiple: true,
        allowCreate: true,
        label: "location",
        stubType: "location",
        stubFolder: "Drafts/Inbox/Locations",
        prompt: field.prompt
      }) ?? [];
    } else if (field.options) {
      value = await tp.system.suggester(field.options, field.values, false, field.label ?? field.key) ?? "";
    } else {
      value = String(await tp.system.prompt(field.prompt, "", false) ?? "").trim();
    }

    if (Array.isArray(value) ? value.length : value !== "") additions[field.key] = value;
  }
}

const keys = Object.keys(additions);
if (!keys.length) {
  new tp.obsidian.Notice("No values were entered.");
  tR = "";
  return;
}

await tp.app.fileManager.processFrontMatter(tp.config.target_file, (frontmatter) => {
  for (const [key, value] of Object.entries(additions)) frontmatter[key] = value;
  if (!frontmatter.development_level) frontmatter.development_level = "stub";
});

new tp.obsidian.Notice(`Added ${keys.length} location field${keys.length === 1 ? "" : "s"}.`);
tR = "";
%>
