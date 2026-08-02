<%*
const startedAt = Date.now();
const ERA_OPTIONS = ["CITADEL", "SMOG", "NEARSIGHT", "ENTROPY", "Universal"];
const ENTITY_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TYPE_FOLDERS = {
  fauna: "Drafts/Databases/Fauna",
  flora: "Drafts/Databases/Flora",
  fungi: "Drafts/Databases/Fungi",
  item: "Drafts/Databases/Items"
};

const currentFolder = tp.file.folder(true);
const inferredEntry = Object.entries(TYPE_FOLDERS).find(([, folder]) => currentFolder === folder);
let selectedType = inferredEntry?.[0] ?? null;

function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "entity";
}

function usedEntityIds() {
  return new Set(tp.app.vault.getMarkdownFiles().map((file) => {
    const cache = tp.app.metadataCache.getFileCache(file);
    return String(cache?.frontmatter?.entity_id ?? "").trim();
  }).filter(Boolean));
}

function suggestedEntityId(title) {
  const used = usedEntityIds();
  const base = slugify(title);
  if (!used.has(base)) return base;
  for (let code = 97; code <= 122; code += 1) {
    const candidate = `${base}-${String.fromCharCode(code)}`;
    if (!used.has(candidate)) return candidate;
  }
  let counter = 2;
  while (used.has(`${base}-${counter}`)) counter += 1;
  return `${base}-${counter}`;
}

// The shared core still owns type-specific prompts and optional field modules.
// This wrapper supplies context inferred from the folder and constrains era authoring
// to one controlled edition/scope value.
const originalSuggester = tp.system.suggester;
const originalMultiSuggester = tp.system.multi_suggester;
tp.system.suggester = async (...args) => {
  const prompt = args[4];
  if (prompt === "What are you creating?") {
    if (selectedType) return selectedType;
    selectedType = await originalSuggester(...args);
    return selectedType;
  }
  return originalSuggester(...args);
};
tp.system.multi_suggester = async (...args) => {
  const prompt = args[4];
  if (typeof prompt === "string" && prompt.startsWith("Which eras can it exist in?")) {
    const era = await originalSuggester(
      ["Leave undefined", ...ERA_OPTIONS],
      ["", ...ERA_OPTIONS],
      false,
      "Era / scope"
    ) ?? "";
    return era ? [era] : [];
  }
  return originalMultiSuggester(...args);
};

let rendered = "";
try {
  rendered = await tp.file.include("[[Templates/_Internals/Story Entity Core]]");
} finally {
  tp.system.suggester = originalSuggester;
  tp.system.multi_suggester = originalMultiSuggester;
}

function renderedDocumentTitle(source) {
  const line = source.split(/\r?\n/).find((entry) => entry.startsWith("title:"));
  if (!line) return tp.file.title;
  const raw = line.slice("title:".length).trim();
  try {
    return String(JSON.parse(raw)).trim() || tp.file.title;
  } catch {
    return raw.replace(/^['"]|['"]$/g, "").trim() || tp.file.title;
  }
}

const documentTitle = renderedDocumentTitle(rendered);
const entityId = String(await tp.system.prompt(
  "Continuity entity ID (stable; use a different suffix for an unrelated thing with a similar name)",
  suggestedEntityId(documentTitle),
  false
) ?? "").trim();
if (entityId && !ENTITY_ID_PATTERN.test(entityId)) {
  throw new Error(`Invalid entity_id: ${entityId}. Use lowercase kebab-case, e.g. cow-b.`);
}

// Normalise legacy internals at the wrapper boundary while the shared core is kept
// compatible with older direct includes.
rendered = rendered.replace(/^publish:\s*false\s*\r?\n/m, "");
rendered = rendered.replace(/^eras:\s*\[\s*("(?:CITADEL|SMOG|NEARSIGHT|ENTROPY|Universal)")\s*\]\s*$/m, "era: $1");
if (!/^created:/m.test(rendered)) {
  rendered = rendered.replace(/^(development_level:\s*[^\r\n]+)$/m, "$1\ncreated:");
}
if (!/^updated:/m.test(rendered)) {
  rendered = /^created:/m.test(rendered)
    ? rendered.replace(/^(created:[^\r\n]*)$/m, "$1\nupdated:")
    : rendered.replace(/^(development_level:\s*[^\r\n]+)$/m, "$1\nupdated:");
}
if (entityId && !/^entity_id:/m.test(rendered)) {
  rendered = rendered.replace(/^(development_level:\s*[^\r\n]+)$/m, `$1\nentity_id: ${JSON.stringify(entityId)}`);
}

const targetFolder = selectedType ? TYPE_FOLDERS[selectedType] : null;
if (targetFolder && tp.file.folder(true) !== targetFolder) {
  // Templater checks new blank files after a short delay. Keep a command-created
  // note out of folder-triggered directories until that creation event has passed,
  // otherwise the same template can be applied twice.
  const minimumAgeMs = 450;
  const remainingDelay = minimumAgeMs - (Date.now() - startedAt);
  if (remainingDelay > 0) {
    await new Promise((resolve) => setTimeout(resolve, remainingDelay));
  }
  await tp.file.move(`${targetFolder}/${documentTitle}`);
}

tR += rendered;
%>
