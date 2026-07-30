<%*
const ACTIVITY_KEY = `viscerium-creator-activity:v2:${tp.app.vault.getName()}`;
const STATE_KEY = `viscerium-creator-activity-state:v2:${tp.app.vault.getName()}`;
const KEEP_DAYS = 371;

const dayKey = (timestamp) => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const hashText = (text) => {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

const readLocalJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback;
  } catch (error) {
    console.warn(`VISCERIUM local creator data could not be read for ${key}; rebuilding it.`, error);
    return fallback;
  }
};

const isCreatorFile = (file) => {
  const path = file.path;
  return file.extension === "md"
    && path !== "Home.md"
    && !path.startsWith("System/")
    && !path.startsWith("Templates/")
    && !path.startsWith("Demo/");
};

const pruneDays = (days) => {
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - KEEP_DAYS);
  const cutoffKey = dayKey(cutoff.getTime());
  return Object.fromEntries(Object.entries(days).filter(([key]) => key >= cutoffKey));
};

const recordCreatorActivity = async () => {
  const previousState = readLocalJson(STATE_KEY, {});
  const previousActivity = readLocalJson(ACTIVITY_KEY, { version: 2, days: {} });
  const baseline = Object.keys(previousState).length === 0;
  const nextState = {};
  const days = { ...(previousActivity.days ?? {}) };

  for (const file of tp.app.vault.getMarkdownFiles().filter(isCreatorFile)) {
    const mtime = Number(file.stat?.mtime ?? 0);
    const previous = previousState[file.path];

    if (previous && Number(previous.mtime ?? 0) === mtime) {
      nextState[file.path] = previous;
      continue;
    }

    const text = await tp.app.vault.cachedRead(file);
    const hash = hashText(text);
    nextState[file.path] = { mtime, hash };

    if (baseline) continue;
    if (previous && previous.hash === hash) continue;

    const key = dayKey(mtime || Date.now());
    days[key] = Number(days[key] ?? 0) + 1;
  }

  localStorage.setItem(STATE_KEY, JSON.stringify(nextState));
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify({
    version: 2,
    lastScan: new Date().toISOString(),
    days: pruneDays(days),
  }));
};

const openHome = async () => {
  const home = tp.app.vault.getAbstractFileByPath("Home.md");
  if (!home || home.extension !== "md") return;

  const leaves = tp.app.workspace.getLeavesOfType("markdown");
  const existing = leaves.find((leaf) => leaf.view?.file?.path === home.path);
  const leaf = existing ?? tp.app.workspace.getLeaf(false);

  await leaf.setViewState({
    type: "markdown",
    state: {
      file: home.path,
      mode: "preview",
      source: false,
    },
  });
  tp.app.workspace.setActiveLeaf(leaf, { focus: true });
};

tp.app.workspace.onLayoutReady(async () => {
  try {
    await recordCreatorActivity();
  } catch (error) {
    console.warn("VISCERIUM creator activity could not be recorded.", error);
  }
  await openHome();
});
%>
