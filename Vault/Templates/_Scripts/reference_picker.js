const normalise = (value) => String(value ?? "").trim().toLocaleLowerCase();

const safeFilename = (value) => String(value)
  .replace(/[\\/:*?"<>|]/g, "-")
  .replace(/\s+/g, " ")
  .trim();

async function ensureFolder(app, folderPath) {
  let current = "";
  for (const segment of String(folderPath).split("/").filter(Boolean)) {
    current = current ? `${current}/${segment}` : segment;
    if (!app.vault.getAbstractFileByPath(current)) await app.vault.createFolder(current);
  }
}

function candidates(tp, types) {
  const allowed = new Set(types.map(normalise));
  const byName = new Map();
  for (const file of tp.app.vault.getMarkdownFiles()) {
    const path = file.path;
    if (!(path.startsWith("Lore/") || path.startsWith("Drafts/"))) continue;
    const fm = tp.app.metadataCache.getFileCache(file)?.frontmatter ?? {};
    if (!allowed.has(normalise(fm.type))) continue;
    const title = String(fm.title ?? file.basename).trim();
    if (!title) continue;
    const aliases = Array.isArray(fm.aliases) ? fm.aliases.map(String) : [];
    const key = normalise(title);
    if (!byName.has(key)) byName.set(key, { title, aliases, path });
  }
  return [...byName.values()].sort((a, b) => a.title.localeCompare(b.title));
}

async function createStub(tp, options, existing) {
  const label = options.label ?? options.stubType ?? options.types?.[0] ?? "entity";
  const name = String(await tp.system.prompt(`New ${label} name`, "", true) ?? "").trim();
  if (!name) return null;

  const wanted = normalise(name);
  const duplicate = existing.find((entry) => normalise(entry.title) === wanted || entry.aliases.some((alias) => normalise(alias) === wanted));
  if (duplicate) return duplicate.title;

  const folder = options.stubFolder ?? `Drafts/Inbox/${String(options.stubType ?? "Entity").replace(/^./, (char) => char.toUpperCase())}s`;
  await ensureFolder(tp.app, folder);
  const filename = safeFilename(name);
  if (!filename) return null;
  const path = `${folder}/${filename}.md`;
  const alreadyThere = tp.app.vault.getAbstractFileByPath(path);
  if (alreadyThere) return alreadyThere.basename;

  const type = options.stubType ?? options.types?.[0] ?? "article";
  const content = [
    "---",
    `title: ${JSON.stringify(name)}`,
    'description: ""',
    "status: draft",
    `type: ${type}`,
    "development_level: stub",
    `tags: [${JSON.stringify("stub")}, ${JSON.stringify("inbox")}]`,
    "---",
    "",
    "## Summary",
    "",
    "%% Created automatically because this relationship did not yet exist. Add only the detail the world actually needs. %%",
    "",
    "- [ ] Develop this stub before promotion to Lore.",
    "",
  ].join("\n");
  await tp.app.vault.create(path, content);
  return name;
}

module.exports = async function referencePicker(tp, options = {}) {
  const types = Array.isArray(options.types) && options.types.length ? options.types : [options.type].filter(Boolean);
  const existing = candidates(tp, types);
  const createToken = "__viscerium_create__";
  const labels = existing.map((entry) => entry.title);
  const values = existing.map((entry) => entry.title);
  if (options.allowCreate !== false) {
    labels.push(`＋ Create new ${options.label ?? options.stubType ?? "entity"}…`);
    values.push(createToken);
  }

  if (options.multiple) {
    const selected = await tp.system.multi_suggester(labels, values, false, options.prompt ?? options.label ?? "Select") ?? [];
    const result = selected.filter((value) => value !== createToken);
    if (selected.includes(createToken)) {
      const created = await createStub(tp, options, existing);
      if (created && !result.includes(created)) result.push(created);
    }
    return result;
  }

  const singleLabels = ["Leave blank", ...labels];
  const singleValues = ["", ...values];
  const selected = await tp.system.suggester(singleLabels, singleValues, false, options.prompt ?? options.label ?? "Select") ?? "";
  if (selected !== createToken) return selected;
  return await createStub(tp, options, existing) ?? "";
};
