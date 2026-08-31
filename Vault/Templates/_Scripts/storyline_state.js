const DEFAULT_ROOT = "Stories";

const CORE_FIELDS = [
  { id: "viscerium-want", label: "Want", section: "Scene", category: "scene", type: "textarea", options: [], placeholder: "What does the POV character want in this scene?", order: 0, topLevelKey: "viscerium_want" },
  { id: "viscerium-pressure", label: "Pressure", section: "Scene", category: "scene", type: "textarea", options: [], placeholder: "What makes that difficult right now?", order: 1, topLevelKey: "viscerium_pressure" },
  { id: "viscerium-after", label: "After", section: "Scene", category: "scene", type: "textarea", options: [], placeholder: "What is true now that wasn't true before?", order: 2, topLevelKey: "viscerium_after" },
  { id: "viscerium-turn", label: "Turn", section: "Scene", category: "scene", type: "textarea", options: [], placeholder: "What changes the direction of the scene?", order: 3, topLevelKey: "viscerium_turn" },
  { id: "viscerium-cost", label: "Cost", section: "Scene", category: "scene", type: "textarea", options: [], placeholder: "What is lost, risked, sacrificed or worsened?", order: 4, topLevelKey: "viscerium_cost" },
];

const RELATIONSHIP_DIMENSIONS = ["Trust", "Affection", "Dependence", "Resentment", "Fear"];
const POWER_TYPES = ["Authority", "Access", "Resource", "Obligation", "Position"];
const CONSEQUENCE_TYPES = ["React", "Prevent", "Exploit", "Endure", "Repay"];
const INFORMATION_CHANGES = [
  ["Learns truth", "learns"],
  ["Suspects", "suspects"],
  ["Believes", "believes"],
  ["Reveals", "reveals"],
  ["Conceals", "conceals"],
  ["Misleads", "misleads"],
];

const clean = (value) => String(value ?? "").trim();
const asArray = (value) => Array.isArray(value) ? value : (value == null || value === "" ? [] : [value]);
const cleanLink = (value) => clean(value).replace(/^\[\[/, "").replace(/\]\]$/, "").split("|")[0].trim();
const slugify = (value) => clean(value).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "information";
const id = (prefix = "evt") => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

function storylinePlugin(tp) {
  return tp.app.plugins?.plugins?.storyline;
}

function storyRoot(tp) {
  return clean(storylinePlugin(tp)?.settings?.storyLineRoot) || DEFAULT_ROOT;
}

function inferProjectBase(tp, path, root = storyRoot(tp)) {
  const normalized = String(path ?? "").replace(/\\/g, "/");
  const prefix = `${String(root).replace(/\\/g, "/").replace(/\/$/, "")}/`;
  if (!normalized.startsWith(prefix)) return null;
  const project = normalized.slice(prefix.length).split("/")[0];
  return project ? `${prefix}${project}`.replace(/\/$/, "") : null;
}

function frontmatter(tp, file) {
  return file ? (tp.app.metadataCache.getFileCache(file)?.frontmatter ?? {}) : {};
}

function resolveProject(tp) {
  const active = tp.app.workspace.getActiveFile();
  const fromActive = active ? inferProjectBase(tp, active.path) : null;
  if (fromActive) return { base: fromActive, title: fromActive.split("/").at(-1) };

  const activeProjectFile = clean(storylinePlugin(tp)?.settings?.activeProjectFile);
  const fromSetting = activeProjectFile ? inferProjectBase(tp, activeProjectFile) : null;
  if (fromSetting) return { base: fromSetting, title: fromSetting.split("/").at(-1) };

  const bases = new Set();
  for (const file of tp.app.vault.getMarkdownFiles()) {
    const base = inferProjectBase(tp, file.path);
    const type = clean(frontmatter(tp, file).type).toLowerCase();
    if (base && (type === "storyline" || type === "storyline-project")) bases.add(base);
  }
  if (bases.size === 1) {
    const base = [...bases][0];
    return { base, title: base.split("/").at(-1) };
  }
  return null;
}

async function ensureFolder(tp, folderPath) {
  let current = "";
  for (const segment of String(folderPath).split("/").filter(Boolean)) {
    current = current ? `${current}/${segment}` : segment;
    if (!tp.app.vault.getAbstractFileByPath(current)) await tp.app.vault.createFolder(current);
  }
}

async function syncNativeFields(service) {
  let changed = false;
  for (const field of CORE_FIELDS) {
    const existing = service.getAll().find((entry) => entry.id === field.id);
    if (!existing) {
      await service.add({ ...field });
      changed = true;
      continue;
    }
    if (!service.update) continue;
    const keys = ["label", "section", "category", "type", "placeholder", "order", "topLevelKey"];
    if (!keys.some((key) => existing[key] !== field[key])) continue;
    await service.update(field.id, { ...field });
    changed = true;
  }
  return changed;
}

async function readFieldTemplateData(tp, path) {
  const fallback = { version: 1, fields: [], sectionOrders: {} };
  if (!await tp.app.vault.adapter.exists(path)) return fallback;
  try {
    const parsed = JSON.parse(await tp.app.vault.adapter.read(path));
    if (!Array.isArray(parsed.fields)) parsed.fields = [];
    return parsed;
  } catch {
    return fallback;
  }
}

async function syncFallbackFields(tp, project) {
  const system = `${project.base}/System`;
  await ensureFolder(tp, system);
  const path = `${system}/field-templates.json`;
  const data = await readFieldTemplateData(tp, path);
  let changed = false;
  for (const field of CORE_FIELDS) {
    const index = data.fields.findIndex((entry) => entry?.id === field.id);
    if (index === -1) {
      data.fields.push({ ...field });
      changed = true;
      continue;
    }
    const next = { ...data.fields[index], ...field };
    if (JSON.stringify(next) === JSON.stringify(data.fields[index])) continue;
    data.fields[index] = next;
    changed = true;
  }
  if (changed) await tp.app.vault.adapter.write(path, `${JSON.stringify(data, null, 2)}\n`);
  return changed;
}

async function ensureCoreFields(tp, project, { quiet = false } = {}) {
  if (!project) return false;
  const storyLine = storylinePlugin(tp);
  const activeStoryLineBase = inferProjectBase(tp, clean(storyLine?.settings?.activeProjectFile));
  const service = activeStoryLineBase === project.base ? storyLine?.fieldTemplates : null;
  const changed = service?.getAll && service?.add
    ? await syncNativeFields(service)
    : await syncFallbackFields(tp, project);

  if (!quiet) new tp.obsidian.Notice(changed ? "VISCERIUM StoryLine scene fields are ready." : "VISCERIUM StoryLine scene fields are already ready.");
  return changed;
}

function isScene(tp, file) {
  if (!file) return false;
  const base = inferProjectBase(tp, file.path);
  return Boolean(base && file.path.startsWith(`${base}/Scenes/`) && clean(frontmatter(tp, file).type).toLowerCase() === "scene");
}

function participants(tp, file) {
  const fm = frontmatter(tp, file);
  return [...new Set([fm.pov, ...asArray(fm.characters)].map(cleanLink).filter(Boolean))];
}

async function chooseParticipant(tp, file, prompt, { exclude = [], allowOther = true } = {}) {
  const excluded = new Set(exclude);
  const values = participants(tp, file).filter((name) => !excluded.has(name));
  const other = "__other__";
  const labels = [...values];
  const choices = [...values];
  if (allowOther) { labels.push("Other…"); choices.push(other); }
  const picked = await tp.system.suggester(labels, choices, false, prompt);
  if (!picked) return null;
  if (picked !== other) return picked;
  return clean(await tp.system.prompt(prompt, "", true));
}

function sceneRecords(tp, base) {
  const prefix = `${base}/Scenes/`;
  const records = tp.app.vault.getMarkdownFiles()
    .filter((file) => file.path.startsWith(prefix) && clean(frontmatter(tp, file).type).toLowerCase() === "scene")
    .map((file) => ({ file, fm: frontmatter(tp, file) }));
  const loose = (value) => Number.isFinite(Number(value)) ? Number(value) : clean(value);
  records.sort((a, b) => String(loose(a.fm.act)).localeCompare(String(loose(b.fm.act)), undefined, { numeric: true })
    || String(loose(a.fm.chapter)).localeCompare(String(loose(b.fm.chapter)), undefined, { numeric: true })
    || String(loose(a.fm.sequence)).localeCompare(String(loose(b.fm.sequence)), undefined, { numeric: true })
    || a.file.path.localeCompare(b.file.path));
  return records;
}

function events(tp, base) {
  const result = [];
  for (const { file, fm } of sceneRecords(tp, base)) {
    for (const event of asArray(fm.viscerium_events)) {
      if (event && typeof event === "object" && !Array.isArray(event)) result.push({ ...event, file_path: file.path, scene_title: clean(fm.title) || file.basename });
    }
  }
  return result;
}

function informationSubjects(tp, base) {
  const map = new Map();
  for (const event of events(tp, base)) if (event.kind === "information" && event.subject) map.set(event.subject, event.label || event.subject);
  return map;
}

function activeConsequences(tp, base) {
  const map = new Map();
  for (const event of events(tp, base)) {
    if (event.kind === "consequence" && event.consequence_id) map.set(event.consequence_id, { ...event, status: event.status || "open" });
    if (event.kind === "consequence-update" && event.consequence) {
      const current = map.get(event.consequence);
      if (!current) continue;
      current.status = event.change || current.status;
      if (event.pressure) current.pressure = event.pressure;
      if (event.result) current.result = event.result;
    }
  }
  return [...map.values()].filter((item) => !["resolved", "expired"].includes(item.status));
}

async function appendEvent(tp, file, event) {
  await tp.app.fileManager.processFrontMatter(file, (data) => {
    const existing = Array.isArray(data.viscerium_events) ? data.viscerium_events : [];
    data.viscerium_events = [...existing, { id: id(), ...event }];
  });
}

async function addInformation(tp, file, base) {
  const actor = await chooseParticipant(tp, file, "Who controls or changes this information?");
  if (!actor) return;
  const subjects = informationSubjects(tp, base);
  const create = "__create__";
  const labels = [...subjects.values(), "Track new information…"];
  const values = [...subjects.keys(), create];
  let subject = await tp.system.suggester(labels, values, false, "What information is involved?");
  if (!subject) return;
  let label = subjects.get(subject);
  if (subject === create) {
    label = clean(await tp.system.prompt("Short name for the information", "", true));
    if (!label) return;
    subject = slugify(label);
    let suffix = 2;
    while (subjects.has(subject) && subjects.get(subject) !== label) subject = `${slugify(label)}-${suffix++}`;
  }
  const change = await tp.system.suggester(INFORMATION_CHANGES.map(([name]) => name), INFORMATION_CHANGES.map(([, value]) => value), false, "What changes?");
  if (!change) return;
  let target = "";
  if (["reveals", "conceals", "misleads"].includes(change)) target = await chooseParticipant(tp, file, "Toward whom?", { exclude: [actor] }) ?? "";
  const detail = clean(await tp.system.prompt("Detail (optional)", "", false));
  await appendEvent(tp, file, { kind: "information", actor, subject, label, change, ...(target ? { target } : {}), ...(detail ? { detail } : {}) });
  new tp.obsidian.Notice(`Information change added: ${actor} — ${label}.`);
}

async function addRelationship(tp, file) {
  const actor = await chooseParticipant(tp, file, "Whose relationship changes?");
  if (!actor) return;
  const target = await chooseParticipant(tp, file, "Toward whom?", { exclude: [actor] });
  if (!target) return;
  const dimension = await tp.system.suggester(RELATIONSHIP_DIMENSIONS, RELATIONSHIP_DIMENSIONS.map((v) => v.toLowerCase()), false, "What changes?");
  if (!dimension) return;
  const change = await tp.system.suggester(["↑ Increases", "↓ Decreases"], ["up", "down"], false, `${dimension} changes…`);
  if (!change) return;
  const cause = clean(await tp.system.prompt("Why? (optional)", "", false));
  await appendEvent(tp, file, { kind: "relationship", actor, target, dimension, change, ...(cause ? { cause } : {}) });
  new tp.obsidian.Notice(`Relationship change added: ${actor} → ${target}.`);
}

async function addPower(tp, file) {
  const actor = await chooseParticipant(tp, file, "Who gains, loses or commits power?");
  if (!actor) return;
  const change = await tp.system.suggester(["Gain", "Lose", "Commit"], ["gain", "lose", "commit"], false, "What happens to their leverage?");
  if (!change) return;
  const type = await tp.system.suggester(POWER_TYPES, POWER_TYPES.map((v) => v.toLowerCase()), false, "What kind of leverage?");
  if (!type) return;
  const source = clean(await tp.system.prompt("Source / target (optional)", "", false));
  const limit = clean(await tp.system.prompt("Limit / price (optional)", "", false));
  await appendEvent(tp, file, { kind: "power", actor, change, type, ...(source ? { source } : {}), ...(limit ? { limit } : {}) });
  new tp.obsidian.Notice(`Power change added: ${actor} — ${change} ${type}.`);
}

async function addConsequence(tp, file, base) {
  const mode = await tp.system.suggester(["Create consequence", "Update existing consequence"], ["create", "update"], false, "Consequence");
  if (!mode) return;
  if (mode === "update") {
    const open = activeConsequences(tp, base);
    if (!open.length) { new tp.obsidian.Notice("No open consequences to update."); return; }
    const selected = await tp.system.suggester(open.map((item) => `${item.affected}: ${item.pressure}`), open.map((item) => item.consequence_id), false, "Which consequence changes?");
    if (!selected) return;
    const change = await tp.system.suggester(["Resolved", "Transformed", "Expired"], ["resolved", "transformed", "expired"], false, "What happened to it?");
    if (!change) return;
    let pressure = "";
    if (change === "transformed") {
      pressure = clean(await tp.system.prompt("New pressure", "", true));
      if (!pressure) return;
    }
    const result = clean(await tp.system.prompt("Result (optional)", "", false));
    await appendEvent(tp, file, { kind: "consequence-update", consequence: selected, change, ...(pressure ? { pressure } : {}), ...(result ? { result } : {}) });
    new tp.obsidian.Notice(`Consequence ${change}.`);
    return;
  }
  const affected = await chooseParticipant(tp, file, "Who or what now has a problem?");
  if (!affected) return;
  const type = await tp.system.suggester(CONSEQUENCE_TYPES, CONSEQUENCE_TYPES.map((v) => v.toLowerCase()), false, "What kind of future pressure?");
  if (!type) return;
  const pressure = clean(await tp.system.prompt("What must happen later because of this?", "", true));
  if (!pressure) return;
  const due = clean(await tp.system.prompt("Due / horizon (optional)", "", false));
  await appendEvent(tp, file, { kind: "consequence", consequence_id: id("cns"), affected, type, pressure, ...(due ? { due } : {}), status: "open" });
  new tp.obsidian.Notice(`Consequence added for ${affected}.`);
}

async function addChange(tp) {
  const file = tp.app.workspace.getActiveFile();
  if (!isScene(tp, file)) {
    new tp.obsidian.Notice("Open a StoryLine scene before adding a story change.");
    return;
  }
  const base = inferProjectBase(tp, file.path);
  const project = { base, title: base.split("/").at(-1) };
  await ensureCoreFields(tp, project, { quiet: true });
  const kind = await tp.system.suggester(
    ["Information", "Relationship", "Power / leverage", "Consequence"],
    ["information", "relationship", "power", "consequence"],
    false,
    "What changed in this scene?",
  );
  if (kind === "information") await addInformation(tp, file, base);
  if (kind === "relationship") await addRelationship(tp, file);
  if (kind === "power") await addPower(tp, file);
  if (kind === "consequence") await addConsequence(tp, file, base);
}

async function openState(tp) {
  const project = resolveProject(tp);
  if (!project) {
    new tp.obsidian.Notice("Open or activate a StoryLine project first.");
    return;
  }
  await ensureCoreFields(tp, project, { quiet: true });
  const file = tp.app.vault.getAbstractFileByPath("System/Views/Story State.md");
  if (!file) {
    new tp.obsidian.Notice("Story State view is missing from System/Views.");
    return;
  }
  const leaf = tp.app.workspace.getRightLeaf(false) ?? tp.app.workspace.getLeaf(true);
  await leaf.openFile(file);
  await tp.app.workspace.revealLeaf(leaf);
}

module.exports = async function storylineState(tp, action = "setup") {
  const project = resolveProject(tp);
  if (action === "add-change") return await addChange(tp);
  if (action === "open-state") return await openState(tp);
  if (!project) {
    if (action !== "startup") new tp.obsidian.Notice("Open or activate a StoryLine project first.");
    return false;
  }
  return await ensureCoreFields(tp, project, { quiet: action === "startup" });
};
