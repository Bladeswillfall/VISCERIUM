<%*
const ERAS = ["CITADEL", "SMOG", "NEARSIGHT", "ENTROPY"];
const MYRKILD = ["Gluttony", "Envy", "Sloth", "Wrath", "Lust", "Pride", "Greed"];
const ORIGINS = ["Purespawn", "Mutated"];
const SIZES = ["Tiny", "Small", "Human-scale", "Large", "Massive", "Behemoth"];
const title = String(await tp.system.prompt("Unit name", tp.file.title === "Untitled" ? "" : tp.file.title, true) ?? "").trim();
if (title && title !== tp.file.title) await tp.file.rename(title);
const era = await tp.system.suggester(ERAS, ERAS, true, "Era");
const myrkildSpecies = await tp.system.suggester(MYRKILD, MYRKILD, true, "Myrkild species");
const origin = await tp.system.suggester(ORIGINS, ORIGINS, true, "Origin");
const size = await tp.system.suggester(["Leave undefined", ...SIZES], ["", ...SIZES], false, "Size class") ?? "";
const locations = await tp.user.reference_picker(tp, { types: ["location"], multiple: true, label: "location", stubType: "location", stubFolder: "Drafts/Inbox/Locations" }) ?? [];
const yamlList = (items) => `[${items.map((item) => JSON.stringify(item)).join(", ")}]`;
async function ensureFolder(folderPath) {
  let current = "";
  for (const segment of folderPath.split("/").filter(Boolean)) {
    current = current ? `${current}/${segment}` : segment;
    if (!tp.app.vault.getAbstractFileByPath(current)) await tp.app.vault.createFolder(current);
  }
}
const fm = ["---", `title: ${JSON.stringify(title)}`, `description: ${JSON.stringify("A WIP Myrkild unit profile.")}`, "status: draft", "type: myrkild-unit", "unit_id: null", "source_id: null", `unit_name: ${JSON.stringify(title)}`, `era: ${JSON.stringify(era)}`, "species: Myrkild", `myrkild_species: ${JSON.stringify(myrkildSpecies)}`, `origin: ${JSON.stringify(origin)}`, "natural_host: null", "role: null"];
if (size) fm.push(`size_class: ${JSON.stringify(size)}`); else fm.push("size_class: null");
fm.push("threat_rating: null", "strain: null", "subtype: null", "rarity: null", `locations: ${yamlList(locations)}`, "biomes: []", "tactics: null", "weaknesses: null", "visual_notes: null", "image: null", "review_status: draft", "development_level: stub", "source: null", "source_sheet: null", "source_row: null", "source_species_entry: null", "tags: [myrkild, unit]", "---");
const body = ["", "> [!tip] Stop when usable", "> Keep the structured profile focused on placement, battlefield behaviour and counterplay.", "", "## Battlefield profile", "", "## Tactics and behaviour", "", "## Weaknesses and counterplay", "", "## Visual notes", "", "## Availability notes", ""];
tR += `${fm.join("\n")}\n${body.join("\n")}`;
const folder = `Drafts/Databases/Myrkild Units/${origin}/${era}`;
await ensureFolder(folder);
if (tp.file.folder(true) !== folder) await tp.file.move(`${folder}/${title}`);
%>