---
title: Story State
cssclasses:
  - viscerium-story-state
---
# Story State

```dataviewjs
const clean = (value) => String(value ?? "").trim();
const list = (value) => {
  if (value == null || value === "") return [];
  if (Array.isArray(value)) return value;
  if (typeof value.array === "function") return value.array();
  return [value];
};
const cleanLink = (value) => clean(value).replace(/^\[\[/, "").replace(/\]\]$/, "").split("|")[0].trim();
const root = clean(app.plugins?.plugins?.storyline?.settings?.storyLineRoot) || "Stories";
const inferBase = (path) => {
  const normalized = String(path ?? "").replace(/\\/g, "/");
  const prefix = `${root.replace(/\/$/, "")}/`;
  if (!normalized.startsWith(prefix)) return null;
  const project = normalized.slice(prefix.length).split("/")[0];
  return project ? `${prefix}${project}`.replace(/\/$/, "") : null;
};

function resolveProject() {
  const active = app.workspace.getActiveFile();
  const fromActive = active ? inferBase(active.path) : null;
  if (fromActive) return fromActive;
  const activeProjectFile = clean(app.plugins?.plugins?.storyline?.settings?.activeProjectFile);
  const fromSetting = activeProjectFile ? inferBase(activeProjectFile) : null;
  if (fromSetting) return fromSetting;
  const projects = new Set();
  for (const page of dv.pages()) {
    const type = clean(page.type).toLowerCase();
    const base = inferBase(page.file.path);
    if (base && (type === "storyline" || type === "storyline-project")) projects.add(base);
  }
  return projects.size === 1 ? [...projects][0] : null;
}

const projectBase = resolveProject();
dv.container.classList.add("vc-story-state");

if (!projectBase) {
  dv.el("p", "Open or activate a StoryLine project to see its current story state.", { cls: "vc-story-state-empty" });
  return;
}

const projectTitle = projectBase.split("/").at(-1) || "Story";
const scenePrefix = `${projectBase}/Scenes/`;
const loose = (value) => Number.isFinite(Number(value)) ? Number(value) : clean(value);
const compare = (left, right) => String(loose(left)).localeCompare(String(loose(right)), undefined, { numeric: true });
const scenes = [...dv.pages()]
  .filter((page) => page.file.path.startsWith(scenePrefix) && clean(page.type).toLowerCase() === "scene")
  .sort((a, b) => compare(a.act, b.act) || compare(a.chapter, b.chapter) || compare(a.sequence, b.sequence) || a.file.path.localeCompare(b.file.path));

const events = [];
for (const scene of scenes) {
  for (const event of list(scene.viscerium_events)) {
    if (!event || typeof event !== "object") continue;
    events.push({ ...event, scenePath: scene.file.path, sceneTitle: clean(scene.title) || scene.file.name });
  }
}

const sceneLink = (parent, event, label = null) => {
  const anchor = parent.createEl("a", { text: label || event.sceneTitle || "Scene", href: "#" });
  anchor.addEventListener("click", (click) => {
    click.preventDefault();
    void app.workspace.openLinkText(event.scenePath, "");
  });
  return anchor;
};

const createSection = (title, description) => {
  const section = dv.container.createDiv({ cls: "vc-story-state-section" });
  section.createEl("h2", { text: title });
  if (description) section.createEl("p", { text: description, cls: "vc-story-state-help" });
  return section;
};

const consequenceMap = new Map();
for (const event of events) {
  if (event.kind === "consequence" && event.consequence_id) {
    consequenceMap.set(event.consequence_id, { ...event, status: event.status || "open", latestScenePath: event.scenePath, latestSceneTitle: event.sceneTitle });
    continue;
  }
  if (event.kind === "consequence-update" && event.consequence) {
    const current = consequenceMap.get(event.consequence);
    if (!current) continue;
    current.status = event.change || current.status;
    if (event.pressure) current.pressure = event.pressure;
    if (event.result) current.result = event.result;
    current.latestScenePath = event.scenePath;
    current.latestSceneTitle = event.sceneTitle;
  }
}
const openConsequences = [...consequenceMap.values()].filter((item) => !["resolved", "expired"].includes(item.status));

const informationState = new Map();
const informationLabels = new Map();
const disclosures = [];
for (const event of events.filter((item) => item.kind === "information")) {
  if (!event.subject || !event.actor) continue;
  informationLabels.set(event.subject, event.label || event.subject);
  if (["learns", "suspects", "believes"].includes(event.change)) {
    informationState.set(`${event.subject}\u0000${event.actor}`, event);
  } else {
    disclosures.push(event);
  }
}

const relationshipEvents = events.filter((item) => item.kind === "relationship" && item.actor && item.target && item.dimension);
const relationshipState = new Map();
for (const event of relationshipEvents) relationshipState.set(`${event.actor}\u0000${event.target}\u0000${event.dimension}`, event);
const powerEvents = events.filter((item) => item.kind === "power" && item.actor);

const characters = new Set();
for (const scene of scenes) {
  const pov = cleanLink(scene.pov);
  if (pov) characters.add(pov);
  for (const name of list(scene.characters).map(cleanLink).filter(Boolean)) characters.add(name);
}
for (const event of events) {
  for (const key of ["actor", "target", "affected"]) {
    const name = cleanLink(event[key]);
    if (name) characters.add(name);
  }
}

const heading = dv.container.createDiv({ cls: "vc-story-state-heading" });
heading.createEl("div", { text: "STORYLINE", cls: "vc-story-state-kicker" });
heading.createEl("h1", { text: projectTitle });
heading.createEl("p", { text: "Derived from scene metadata. Edit scenes; do not maintain this view by hand." });

// CURRENT PRESSURES
{
  const section = createSection("Current Pressures", "Unresolved consequences created by earlier scenes.");
  if (!openConsequences.length) {
    section.createEl("p", { text: "No open consequences are being tracked.", cls: "vc-story-state-empty" });
  } else {
    const listEl = section.createDiv({ cls: "vc-story-state-list" });
    for (const item of openConsequences) {
      const row = listEl.createDiv({ cls: "vc-story-state-row" });
      const body = row.createDiv();
      body.createEl("strong", { text: clean(item.affected) || "Unassigned" });
      body.createEl("span", { text: clean(item.pressure) || "No pressure recorded" });
      const meta = body.createDiv({ cls: "vc-story-state-meta" });
      meta.createSpan({ text: [clean(item.type), item.status === "transformed" ? "transformed" : "open", clean(item.due)].filter(Boolean).join(" · ") });
      sceneLink(meta, { scenePath: item.latestScenePath || item.scenePath, sceneTitle: item.latestSceneTitle || item.sceneTitle }, "Source scene");
    }
  }
}

// CHARACTER STATE
{
  const section = createSection("Character State", "Current explicit beliefs, relationship direction, leverage changes and pressures.");
  if (!characters.size) {
    section.createEl("p", { text: "No characters found in this project yet.", cls: "vc-story-state-empty" });
  } else {
    for (const character of [...characters].sort((a, b) => a.localeCompare(b))) {
      const relevantInfo = [...informationState.values()].filter((event) => event.actor === character);
      const relevantRelationships = [...relationshipState.values()].filter((event) => event.actor === character);
      const relevantPower = powerEvents.filter((event) => event.actor === character);
      const relevantPressure = openConsequences.filter((event) => event.affected === character);
      if (![relevantInfo, relevantRelationships, relevantPower, relevantPressure].some((items) => items.length)) continue;

      const details = section.createEl("details", { cls: "vc-story-state-details" });
      details.createEl("summary", { text: character });
      const body = details.createDiv({ cls: "vc-story-state-detail-body" });

      if (relevantInfo.length) {
        body.createEl("h3", { text: "Information" });
        for (const event of relevantInfo) {
          const row = body.createDiv({ cls: "vc-story-state-compact-row" });
          row.createSpan({ text: `${informationLabels.get(event.subject) || event.subject} — ${event.change}` });
          if (event.detail) row.createSpan({ text: clean(event.detail), cls: "vc-story-state-note" });
          sceneLink(row, event);
        }
      }
      if (relevantRelationships.length) {
        body.createEl("h3", { text: "Relationships" });
        for (const event of relevantRelationships) {
          const row = body.createDiv({ cls: "vc-story-state-compact-row" });
          row.createSpan({ text: `${event.target} — ${event.dimension} ${event.change === "up" ? "↑" : "↓"}` });
          if (event.cause) row.createSpan({ text: clean(event.cause), cls: "vc-story-state-note" });
          sceneLink(row, event);
        }
      }
      if (relevantPower.length) {
        body.createEl("h3", { text: "Power / leverage" });
        for (const event of relevantPower.slice(-5).reverse()) {
          const row = body.createDiv({ cls: "vc-story-state-compact-row" });
          row.createSpan({ text: `${event.change} ${event.type}${event.source ? ` — ${event.source}` : ""}` });
          if (event.limit) row.createSpan({ text: `Limit: ${clean(event.limit)}`, cls: "vc-story-state-note" });
          sceneLink(row, event);
        }
      }
      if (relevantPressure.length) {
        body.createEl("h3", { text: "Open pressure" });
        for (const event of relevantPressure) body.createEl("div", { text: clean(event.pressure), cls: "vc-story-state-note" });
      }
    }
  }
}

// INFORMATION MAP
{
  const section = createSection("Information Map", "Who currently knows, suspects or believes each tracked item; disclosure history stays visible below it.");
  const subjects = [...informationLabels.keys()].sort((a, b) => (informationLabels.get(a) || a).localeCompare(informationLabels.get(b) || b));
  if (!subjects.length) {
    section.createEl("p", { text: "No tracked information yet. Use Add Story Change from a scene when a secret, belief or reveal matters.", cls: "vc-story-state-empty" });
  }
  for (const subject of subjects) {
    const details = section.createEl("details", { cls: "vc-story-state-details" });
    details.createEl("summary", { text: informationLabels.get(subject) || subject });
    const body = details.createDiv({ cls: "vc-story-state-detail-body" });
    const states = [...informationState.values()].filter((event) => event.subject === subject);
    if (states.length) {
      body.createEl("h3", { text: "Current explicit state" });
      for (const event of states) {
        const row = body.createDiv({ cls: "vc-story-state-compact-row" });
        row.createSpan({ text: `${event.actor} — ${event.change}` });
        if (event.detail) row.createSpan({ text: clean(event.detail), cls: "vc-story-state-note" });
        sceneLink(row, event);
      }
    }
    const history = disclosures.filter((event) => event.subject === subject);
    if (history.length) {
      body.createEl("h3", { text: "Disclosure history" });
      for (const event of history) {
        const row = body.createDiv({ cls: "vc-story-state-compact-row" });
        row.createSpan({ text: `${event.actor} — ${event.change}${event.target ? ` → ${event.target}` : ""}` });
        if (event.detail) row.createSpan({ text: clean(event.detail), cls: "vc-story-state-note" });
        sceneLink(row, event);
      }
    }
  }
}

// RELATIONSHIPS / POWER
{
  const section = createSection("Relationships / Power", "Latest recorded directional shifts. The view shows trajectory, not RPG-style scores.");
  if (!relationshipState.size && !powerEvents.length) {
    section.createEl("p", { text: "No relationship or power changes are being tracked yet.", cls: "vc-story-state-empty" });
  }

  if (relationshipState.size) {
    section.createEl("h3", { text: "Relationships" });
    const byPair = new Map();
    for (const event of relationshipState.values()) {
      const key = `${event.actor}\u0000${event.target}`;
      if (!byPair.has(key)) byPair.set(key, []);
      byPair.get(key).push(event);
    }
    for (const pairEvents of byPair.values()) {
      const first = pairEvents[0];
      const details = section.createEl("details", { cls: "vc-story-state-details" });
      details.createEl("summary", { text: `${first.actor} → ${first.target}` });
      const body = details.createDiv({ cls: "vc-story-state-detail-body" });
      const latest = new Map(pairEvents.map((event) => [event.dimension, event]));
      for (const event of latest.values()) {
        const row = body.createDiv({ cls: "vc-story-state-compact-row" });
        row.createSpan({ text: `${event.dimension} ${event.change === "up" ? "↑" : "↓"}` });
        if (event.cause) row.createSpan({ text: clean(event.cause), cls: "vc-story-state-note" });
        sceneLink(row, event);
      }
      const direction = Object.fromEntries([...latest.values()].map((event) => [String(event.dimension).toLowerCase(), event.change]));
      const contradictions = [];
      if (direction.dependence === "up" && direction.trust === "down") contradictions.push("Dependence is rising while trust is falling.");
      if (direction.affection === "up" && direction.resentment === "up") contradictions.push("Affection and resentment are both rising.");
      if (direction.fear === "up" && direction.affection === "up") contradictions.push("Affection is rising alongside fear.");
      for (const text of contradictions) body.createEl("p", { text, cls: "vc-story-state-tension" });
    }
  }

  if (powerEvents.length) {
    section.createEl("h3", { text: "Power / leverage" });
    const latestByActor = new Map();
    for (const event of powerEvents) latestByActor.set(event.actor, event);
    for (const event of latestByActor.values()) {
      const row = section.createDiv({ cls: "vc-story-state-row" });
      const body = row.createDiv();
      body.createEl("strong", { text: event.actor });
      body.createEl("span", { text: `${event.change} ${event.type}${event.source ? ` — ${event.source}` : ""}` });
      if (event.limit) body.createEl("small", { text: `Limit: ${clean(event.limit)}` });
      sceneLink(body, event, "Source scene");
    }
  }
}
```
