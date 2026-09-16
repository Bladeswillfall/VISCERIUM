const { ItemView, Modal, Notice, Plugin, Setting, SuggestModal, TFile, normalizePath } = require('obsidian');

const HISTORICAL_ERAS = ['CITADEL', 'SMOG', 'NEARSIGHT', 'ENTROPY'];
const ERA_VALUES = [...HISTORICAL_ERAS, 'Universal'];
const ENTITY_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const REVIEW_START = '<!-- era-edition-review:start -->';
const REVIEW_END = '<!-- era-edition-review:end -->';

const IMPORT_REVIEW_VIEW = 'viscerium-import-review';
const IMPORT_REVIEW_START = '<!-- worldanvil-migration-review:start -->';
const IMPORT_REVIEW_END = '<!-- worldanvil-migration-review:end -->';
const WORLDANVIL_BASE_PATH = 'System/Bases/World Anvil Import.base';
const WORLDANVIL_GUIDE_PATH = 'Drafts/Inbox/World Anvil Migration Review.md';

const TIER1_TITLES = new Set([
  'About VISCERIUM', 'Introduction to VISCERIUM', 'ERAS', 'CITADEL', 'SMOG', 'NEARSIGHT', 'ENTROPY',
  'Degel', 'Errack', 'Resonance', 'Myrkild', 'Naranor',
]);
const TIER2_TITLES = new Set([
  'Okse Dominion', 'Krass Dominion', 'Kingdom of Askalia', 'Republic of Askalia', 'Kingdom of Satol',
  'Aquillan Seas Trade Union', 'Trans-Continental Socialist Confederation', 'Imperium Coalition',
  '7 Zeniths of Virtue', 'The Sevenfold Blight', 'The Endless war', 'Galdyr  Galdrvyr', 'Abberath',
  'The Hollowed', 'Rifts, Hellmouths of the Myrkild', 'Cavea stations', 'Pathfinder', 'Juggernauts',
  'GARMIR', 'AESIR Mk.II', 'The Vodr', 'Dr.Adrastus Delroy', 'Evaxi, Nadir of Envy',
  'Hennan, Nadir of Sloth', 'Xateal, Nadir of Greed', 'Krathan, Nadir of Wrath', 'Sletair, Nadir of Lust',
  'Boleth, Nadir of Gluttony', 'Vanaer, Nadir of Pride', 'Toriel, Zenith of Charity',
  'Ephemera, Zenith of Temperance', 'Alisian, Zenith of Humility', 'Jurel, Zenith of Chastity',
  'Azelain, Zenith of Patience', 'Mithael, Zenith of Kindness', 'Sorath, Zenith of Diligence',
]);
const TIER3_SOURCE_TYPES = new Set([
  'Condition', 'Ethnicity', 'Formation', 'Law', 'Material', 'MilitaryConflict', 'Organization', 'Plot',
  'Profession', 'Species', 'Technology',
]);

const ISSUE_ORDER = [
  'existing-codex-match', 'duplicate-title', 'needs-type-review', 'legacy-type-review', 'multi-era-review',
  'needs-era', 'relationship-review', 'unresolved-legacy-links', 'missing-inline-assets',
];

const ISSUE_GUIDANCE = {
  'existing-codex-match': {
    label: 'Compare with current Codex note',
    detail: 'Open the current same-title note beside this import and keep the current Codex note authoritative.',
    tone: 'danger',
  },
  'duplicate-title': {
    label: 'Decide whether duplicate titles are the same subject',
    detail: 'Read both imported records, then merge or disambiguate rather than guessing.',
    tone: 'danger',
  },
  'needs-type-review': {
    label: 'Choose the final Codex type',
    detail: 'Read the article, then classify the legacy Species entry into an existing VISCERIUM workflow.',
    tone: 'warning',
  },
  'legacy-type-review': {
    label: 'Choose the final Codex structure',
    detail: 'Decide whether the legacy World Anvil type belongs in an existing Codex type or stays a general article.',
    tone: 'warning',
  },
  'multi-era-review': {
    label: 'Decide continuity and create era editions',
    detail: 'This import spans more than one era. Decide whether it is one continuity family, then follow the era-edition workflow before collapsing it to one scalar era.',
    tone: 'warning',
  },
  'needs-era': {
    label: 'Set the era / Universal scope',
    detail: 'Use the controlled era command only when chronology is established. Do not invent an answer to clear the queue.',
    tone: 'warning',
  },
  'relationship-review': {
    label: 'Review meaningful relationships',
    detail: 'Promote only continuity-significant leadership, membership, ownership or succession facts into structured relationships.',
    tone: 'warning',
  },
  'unresolved-legacy-links': {
    label: 'Resolve remaining World Anvil links',
    detail: 'Replace a legacy link only when the intended current target is certain.',
    tone: 'reference',
  },
  'missing-inline-assets': {
    label: 'Resolve legacy artwork references',
    detail: 'Find a lawful replacement in Assets, replace the reference, or remove it when reuse is not appropriate.',
    tone: 'neutral',
  },
};

const TASK_ISSUE_PATTERNS = [
  [/^Classify this legacy World Anvil Species entry/i, 'needs-type-review'],
  [/^Decide whether legacy World Anvil type/i, 'legacy-type-review'],
  [/^Place this import in the correct VISCERIUM era/i, 'needs-era'],
  [/^Disambiguate this imported/i, 'duplicate-title'],
  [/^Reconcile this legacy import with the existing Codex note/i, 'existing-codex-match'],
  [/^Review the imported leadership\/membership\/succession data/i, 'relationship-review'],
  [/^Resolve the remaining legacy World Anvil links/i, 'unresolved-legacy-links'],
  [/^Resolve legacy inline image references/i, 'missing-inline-assets'],
];

function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'entity';
}

function normaliseEra(value) {
  if (typeof value !== 'string') return undefined;
  const key = value.trim().toLowerCase();
  return ERA_VALUES.find((era) => era.toLowerCase() === key);
}

function reviewBlock(sourceEra, targetEra) {
  return `${REVIEW_START}\n## Era edition review\n\n- [ ] Review inherited ${sourceEra} content and update facts, language, relationships, population/distribution data, technology and assumptions for ${targetEra}.\n- [ ] Remove details that should not be known or relevant in ${targetEra}; add only established ${targetEra} material.\n${REVIEW_END}`;
}

function taskIssueKey(text) {
  for (const [pattern, issue] of TASK_ISSUE_PATTERNS) if (pattern.test(text)) return issue;
  return null;
}

function parseImportReview(markdown) {
  const text = String(markdown ?? '');
  const start = text.indexOf(IMPORT_REVIEW_START);
  const end = text.indexOf(IMPORT_REVIEW_END, start + IMPORT_REVIEW_START.length);
  if (start === -1 || end === -1) return { tasks: [], start: -1, end: -1 };
  const block = text.slice(start + IMPORT_REVIEW_START.length, end);
  const tasks = [];
  const re = /^- \[([ xX])\] (.+)$/gm;
  let match;
  while ((match = re.exec(block))) {
    tasks.push({
      index: tasks.length,
      checked: match[1].toLowerCase() === 'x',
      text: match[2].trim(),
      issue: taskIssueKey(match[2].trim()),
    });
  }
  return { tasks, start, end };
}

function setImportReviewTask(markdown, taskIndex, checked) {
  const text = String(markdown ?? '');
  const parsed = parseImportReview(text);
  if (parsed.start === -1 || taskIndex < 0 || taskIndex >= parsed.tasks.length) return text;
  const blockStart = parsed.start + IMPORT_REVIEW_START.length;
  const block = text.slice(blockStart, parsed.end);
  let seen = -1;
  const updatedBlock = block.replace(/^- \[([ xX])\] (.+)$/gm, (whole, mark, taskText) => {
    seen += 1;
    if (seen !== taskIndex) return whole;
    return `- [${checked ? 'x' : ' '}] ${taskText}`;
  });
  return `${text.slice(0, blockStart)}${updatedBlock}${text.slice(parsed.end)}`;
}

function priorityFor(frontmatter, file) {
  const title = String(frontmatter.title ?? file?.basename ?? '').trim();
  const sourceType = String(frontmatter.import_source_type ?? '').trim();
  const rank = TIER1_TITLES.has(title) ? 1 : TIER2_TITLES.has(title) ? 2 : TIER3_SOURCE_TYPES.has(sourceType) ? 3 : 4;
  const labels = {
    1: 'Tier 1 · Setting spine',
    2: 'Tier 2 · Era anchor',
    3: 'Tier 3 · Connective depth',
    4: 'Tier 4 · Defer',
  };
  const reasons = {
    1: 'Explains or unlocks VISCERIUM as a whole. Review before expanding the archive.',
    2: 'Major era, faction, threat, or through-line anchor. Build the vertical slices next.',
    3: 'Useful connective world depth. Review after the spine and anchors are coherent.',
    4: 'Peripheral, narrow, or indulgent material. Defer unless it blocks a higher-tier note.',
  };
  return { rank, label: labels[rank], reason: reasons[rank] };
}

function issuesFor(frontmatter) {
  const raw = frontmatter.import_issues;
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (raw === null || raw === undefined || raw === '') return [];
  return [String(raw)];
}

function eraCount(frontmatter) {
  if (Array.isArray(frontmatter.eras) && frontmatter.eras.filter(Boolean).length) return frontmatter.eras.filter(Boolean).length;
  return frontmatter.era ? 1 : 0;
}

function firstIssue(frontmatter, tasks) {
  const mapped = new Set(tasks.filter((task) => task.issue).map((task) => task.issue));
  const unchecked = new Set(tasks.filter((task) => !task.checked && task.issue).map((task) => task.issue));
  const metadata = new Set(issuesFor(frontmatter));
  for (const issue of ISSUE_ORDER) {
    if (issue === 'multi-era-review') {
      if (eraCount(frontmatter) > 1) return issue;
      continue;
    }
    if (unchecked.has(issue)) return issue;
    if (!mapped.has(issue) && metadata.has(issue)) return issue;
  }
  return null;
}

function sameIssueSet(left, right) {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every((issue) => rightSet.has(issue));
}

class ChoiceModal extends SuggestModal {
  constructor(app, options, placeholder) {
    super(app);
    this.options = options;
    this.setPlaceholder(placeholder);
  }
  getSuggestions(query) {
    const needle = query.trim().toLowerCase();
    return this.options.filter((option) => option.label.toLowerCase().includes(needle));
  }
  renderSuggestion(option, el) {
    el.createEl('div', { text: option.label });
    if (option.hint) el.createEl('small', { text: option.hint });
  }
  onChooseSuggestion(option) {
    this.resolve?.(option.value);
    this.resolve = null;
  }
  choose() {
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.open();
    });
  }
  onClose() {
    super.onClose();
    this.resolve?.(null);
    this.resolve = null;
  }
}

class TextPromptModal extends Modal {
  constructor(app, { title, label, value = '', placeholder = '', validate }) {
    super(app);
    this.modalTitle = title;
    this.label = label;
    this.value = value;
    this.placeholder = placeholder;
    this.validate = validate;
  }
  onOpen() {
    this.setTitle(this.modalTitle);
    let input;
    new Setting(this.contentEl)
      .setName(this.label)
      .addText((text) => {
        input = text;
        text.setValue(this.value).setPlaceholder(this.placeholder);
        text.inputEl.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            this.submit(input.getValue());
          }
        });
      });
    new Setting(this.contentEl)
      .addButton((button) => button.setButtonText('Save').setCta().onClick(() => this.submit(input.getValue())))
      .addButton((button) => button.setButtonText('Cancel').onClick(() => this.close()));
    setTimeout(() => input?.inputEl?.focus(), 0);
  }
  submit(value) {
    const cleaned = String(value ?? '').trim();
    const problem = this.validate?.(cleaned);
    if (problem) {
      new Notice(problem, 8000);
      return;
    }
    const resolve = this.resolve;
    this.resolve = null;
    resolve?.(cleaned);
    this.close();
  }
  prompt() {
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.open();
    });
  }
  onClose() {
    this.contentEl.empty();
    this.resolve?.(null);
    this.resolve = null;
  }
}

class ImportReviewView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.file = null;
  }

  getViewType() { return IMPORT_REVIEW_VIEW; }
  getDisplayText() { return this.file ? `Import review · ${this.plugin.titleFor(this.file)}` : 'Import review'; }
  getIcon() { return 'list-checks'; }

  async onOpen() { await this.refresh(); }

  async setFile(file) {
    this.file = file;
    await this.refresh();
  }

  async refresh() {
    const root = this.contentEl;
    root.empty();
    root.addClass('vc-import-review');
    if (!(this.file instanceof TFile)) {
      root.createEl('p', { text: 'Open a World Anvil import to see its review context.', cls: 'vc-import-review-empty' });
      return;
    }

    const markdown = await this.app.vault.cachedRead(this.file);
    const parsed = parseImportReview(markdown);
    const frontmatter = this.plugin.frontmatter(this.file);
    const tier = priorityFor(frontmatter, this.file);
    const title = this.plugin.titleFor(this.file);
    const structuralOpen = eraCount(frontmatter) > 1 ? 1 : 0;
    const completed = parsed.tasks.filter((task) => task.checked).length;
    const open = parsed.tasks.filter((task) => !task.checked).length + structuralOpen;
    const total = parsed.tasks.length + structuralOpen;
    const nextIssue = firstIssue(frontmatter, parsed.tasks);
    const nextGuidance = nextIssue ? ISSUE_GUIDANCE[nextIssue] : null;
    const currentMatch = this.plugin.findCurrentCodexMatch(this.file);

    const header = root.createDiv({ cls: 'vc-import-review-header' });
    header.createEl('div', { text: 'WORLD ANVIL IMPORT', cls: 'vc-import-review-kicker' });
    header.createEl('h4', { text: title });
    header.createEl('div', { text: tier.label, cls: `vc-import-review-tier vc-import-review-tier-${tier.rank}` });
    header.createEl('p', { text: tier.reason, cls: 'vc-import-review-reason' });

    const progress = root.createDiv({ cls: 'vc-import-review-progress' });
    progress.createSpan({ text: total ? `${completed}/${total} resolved` : 'No generated review tasks' });
    progress.createSpan({ text: open ? `${open} open` : 'Review complete', cls: open ? 'is-open' : 'is-complete' });

    if (nextGuidance && open) {
      const next = root.createDiv({ cls: `vc-import-review-next is-${nextGuidance.tone}` });
      next.createEl('div', { text: 'NEXT', cls: 'vc-import-review-section-label' });
      next.createEl('strong', { text: nextGuidance.label });
      next.createEl('p', { text: nextGuidance.detail });
      if (nextIssue === 'existing-codex-match') {
        const compare = next.createEl('button', { text: currentMatch ? `Open ${this.plugin.titleFor(currentMatch)} side-by-side` : 'No current same-title note found' });
        compare.disabled = !currentMatch;
        if (currentMatch) this.registerDomEvent(compare, 'click', () => void this.plugin.openComparison(this.file, currentMatch));
      }
      if (nextIssue === 'needs-era') {
        const era = next.createEl('button', { text: 'Set controlled era / Universal scope' });
        this.registerDomEvent(era, 'click', async () => {
          await this.plugin.setControlledEra(this.file);
          await this.refresh();
        });
      }
      if (nextIssue === 'multi-era-review') {
        const guide = next.createEl('button', { text: 'Open era-edition workflow guide' });
        this.registerDomEvent(guide, 'click', () => void this.plugin.openWorkspaceFile('System/SOPs/Era Edition Workflow SOP.md', this.file));
      }
    }

    const taskSection = root.createDiv({ cls: 'vc-import-review-tasks' });
    taskSection.createEl('div', { text: 'REMAINING REVIEW', cls: 'vc-import-review-section-label' });
    if (!parsed.tasks.length && !structuralOpen) {
      taskSection.createEl('p', { text: 'This import has no generated checklist. Use the migration guide if manual review is still required.' });
    } else {
      for (const task of parsed.tasks) {
        const label = taskSection.createEl('label', { cls: `vc-import-review-task${task.checked ? ' is-done' : ''}` });
        const checkbox = label.createEl('input', { type: 'checkbox' });
        checkbox.checked = task.checked;
        label.createSpan({ text: task.text });
        this.registerDomEvent(checkbox, 'change', async () => {
          checkbox.disabled = true;
          try {
            await this.plugin.toggleImportReviewTask(this.file, task.index, checkbox.checked);
          } finally {
            await this.refresh();
          }
        });
      }
      if (structuralOpen) {
        const structural = taskSection.createDiv({ cls: 'vc-import-review-task is-structural' });
        structural.createSpan({ text: '◆', cls: 'vc-import-review-task-marker' });
        structural.createSpan({ text: 'Resolve multi-era continuity into deliberate historical editions. This clears when the working import has one scalar era.' });
      }
    }

    if (total && open === 0) {
      const done = root.createDiv({ cls: 'vc-import-review-complete' });
      done.createEl('strong', { text: '✓ Review complete' });
      done.createEl('p', { text: 'No file was moved, deleted, published or made canonical. Choose the destination deliberately, then continue the queue.' });
      if (currentMatch) {
        const compare = done.createEl('button', { text: `Open ${this.plugin.titleFor(currentMatch)} side-by-side` });
        this.registerDomEvent(compare, 'click', () => void this.plugin.openComparison(this.file, currentMatch));
      }
    }

    const utility = root.createDiv({ cls: 'vc-import-review-utility' });
    const guide = utility.createEl('button', { text: 'Migration guide' });
    const board = utility.createEl('button', { text: 'Review first' });
    this.registerDomEvent(guide, 'click', () => void this.plugin.openWorkspaceFile(WORLDANVIL_GUIDE_PATH, this.file));
    this.registerDomEvent(board, 'click', () => void this.plugin.openWorkspaceFile(WORLDANVIL_BASE_PATH, this.file));

    const nav = root.createDiv({ cls: 'vc-import-review-nav' });
    const previous = nav.createEl('button', { text: '← Previous' });
    const next = nav.createEl('button', { text: 'Next →' });
    const neighbours = await this.plugin.reviewNeighbours(this.file);
    previous.disabled = !neighbours.previous;
    next.disabled = !neighbours.next;
    if (neighbours.previous) this.registerDomEvent(previous, 'click', () => void this.plugin.openImportInMain(neighbours.previous, this.file));
    if (neighbours.next) this.registerDomEvent(next, 'click', () => void this.plugin.openImportInMain(neighbours.next, this.file));
  }
}

module.exports = class VisceriumCreatorToolsPlugin extends Plugin {
  async onload() {
    this.registerView(IMPORT_REVIEW_VIEW, (leaf) => new ImportReviewView(leaf, this));
    this.suspendImportContext = false;
    this.syncingImportIssues = new Set();

    this.addCommand({
      id: 'set-controlled-era',
      name: 'Set controlled era / Universal scope',
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!(file instanceof TFile) || file.extension !== 'md') return false;
        if (!checking) void this.setControlledEra(file);
        return true;
      },
    });
    this.addCommand({
      id: 'set-continuity-entity-id',
      name: 'Set continuity entity ID',
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!(file instanceof TFile) || file.extension !== 'md') return false;
        if (!checking) void this.setEntityId(file);
        return true;
      },
    });
    this.addCommand({
      id: 'create-era-edition',
      name: 'Create era edition from current note',
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!(file instanceof TFile) || file.extension !== 'md') return false;
        if (!checking) void this.createEraEdition(file);
        return true;
      },
    });
    this.addCommand({
      id: 'open-worldanvil-import-review',
      name: 'Open World Anvil import review context',
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!this.isWorldAnvilImport(file)) return false;
        if (!checking) void this.showImportReview(file, true);
        return true;
      },
    });

    this.app.workspace.onLayoutReady(() => {
      this.registerEvent(this.app.workspace.on('file-open', (file) => void this.handleActiveFile(file)));
      this.registerEvent(this.app.vault.on('modify', (file) => void this.handleModifiedFile(file)));
      void this.handleActiveFile(this.app.workspace.getActiveFile());
    });
  }

  frontmatter(file) {
    return this.app.metadataCache.getFileCache(file)?.frontmatter ?? {};
  }

  titleFor(file) {
    return String(this.frontmatter(file).title ?? file?.basename ?? '').trim();
  }

  isWorldAnvilImport(file) {
    if (!(file instanceof TFile) || file.extension !== 'md') return false;
    const frontmatter = this.frontmatter(file);
    return String(frontmatter.import_source ?? '').toLowerCase() === 'worldanvil' || file.path.startsWith('Drafts/WorldAnvil Import/');
  }

  async hasOpenImportReview(file) {
    if (!this.isWorldAnvilImport(file)) return false;
    const parsed = parseImportReview(await this.app.vault.cachedRead(file));
    return parsed.tasks.some((task) => !task.checked) || eraCount(this.frontmatter(file)) > 1;
  }

  async handleActiveFile(file) {
    if (this.suspendImportContext) return;
    if (await this.hasOpenImportReview(file)) {
      await this.showImportReview(file, true);
      return;
    }
    const leaves = this.app.workspace.getLeavesOfType(IMPORT_REVIEW_VIEW);
    const visibleFile = leaves.find((leaf) => leaf.view instanceof ImportReviewView)?.view?.file;
    if (visibleFile?.path === file?.path && this.isWorldAnvilImport(file)) return;
    for (const leaf of leaves) leaf.detach();
  }

  async handleModifiedFile(file) {
    if (!this.isWorldAnvilImport(file)) return;
    await this.syncImportIssueMirror(file);
    const leaf = this.app.workspace.getLeavesOfType(IMPORT_REVIEW_VIEW)[0];
    if (!leaf) return;
    await this.app.workspace.revealLeaf(leaf);
    if (leaf.view instanceof ImportReviewView && leaf.view.file?.path === file.path) await leaf.view.refresh();
  }

  async showImportReview(file, reveal = true) {
    let leaf = this.app.workspace.getLeavesOfType(IMPORT_REVIEW_VIEW)[0];
    if (!leaf) {
      leaf = this.app.workspace.getRightLeaf(false);
      if (!leaf) return;
      await leaf.setViewState({ type: IMPORT_REVIEW_VIEW, active: true });
    }
    if (reveal) await this.app.workspace.revealLeaf(leaf);
    if (leaf.view instanceof ImportReviewView) await leaf.view.setFile(file);
  }

  markdownLeafFor(file) {
    return this.app.workspace.getLeavesOfType('markdown').find((leaf) => leaf.view?.file?.path === file?.path) ?? null;
  }

  async openImportInMain(file, sourceFile) {
    const leaf = this.markdownLeafFor(sourceFile) ?? this.app.workspace.getLeaf(false);
    this.suspendImportContext = true;
    try {
      await leaf.openFile(file);
      this.app.workspace.setActiveLeaf(leaf, { focus: true });
    } finally {
      this.suspendImportContext = false;
    }
    await this.handleActiveFile(file);
  }

  async openWorkspaceFile(path, sourceFile) {
    const target = this.app.vault.getAbstractFileByPath(normalizePath(path));
    if (!(target instanceof TFile)) {
      new Notice(`Could not find ${path}.`, 7000);
      return;
    }
    const leaf = this.markdownLeafFor(sourceFile) ?? this.app.workspace.getLeaf(false);
    this.suspendImportContext = true;
    try {
      await leaf.openFile(target);
      this.app.workspace.setActiveLeaf(leaf, { focus: true });
    } finally {
      this.suspendImportContext = false;
    }
    await this.handleActiveFile(target);
  }

  findCurrentCodexMatch(importFile) {
    const title = this.titleFor(importFile).toLocaleLowerCase('en');
    if (!title) return null;
    const candidates = this.app.vault.getMarkdownFiles().filter((file) => {
      if (file.path === importFile.path || this.isWorldAnvilImport(file)) return false;
      if (/^(System|Templates|Demo|Stories)\//.test(file.path)) return false;
      return this.titleFor(file).toLocaleLowerCase('en') === title;
    });
    candidates.sort((a, b) => {
      const score = (file) => file.path.startsWith('Lore/') ? 0 : file.path.startsWith('Drafts/') ? 1 : 2;
      return score(a) - score(b) || a.path.localeCompare(b.path);
    });
    return candidates[0] ?? null;
  }

  async openComparison(importFile, currentFile) {
    const sourceLeaf = this.markdownLeafFor(importFile);
    if (!sourceLeaf) {
      new Notice('Could not identify the open import pane for comparison.', 7000);
      return;
    }
    this.suspendImportContext = true;
    try {
      this.app.workspace.setActiveLeaf(sourceLeaf, { focus: false });
      const compareLeaf = this.app.workspace.getLeaf('split', 'vertical');
      await compareLeaf.openFile(currentFile);
      this.app.workspace.setActiveLeaf(sourceLeaf, { focus: true });
    } finally {
      this.suspendImportContext = false;
    }
    await this.showImportReview(importFile, true);
  }

  async syncImportIssueMirror(file, parsedReview = null) {
    if (!this.isWorldAnvilImport(file) || this.syncingImportIssues.has(file.path)) return false;
    const parsed = parsedReview ?? parseImportReview(await this.app.vault.cachedRead(file));
    if (!parsed.tasks.length) return false;
    const taskStates = new Map(parsed.tasks.filter((task) => task.issue).map((task) => [task.issue, task.checked]));
    if (!taskStates.size) return false;
    const current = issuesFor(this.frontmatter(file));
    const next = new Set(current);
    for (const [issue, checked] of taskStates) {
      if (checked) next.delete(issue);
      else next.add(issue);
    }
    const nextList = [...next];
    if (sameIssueSet(current, nextList)) return false;

    this.syncingImportIssues.add(file.path);
    try {
      await this.app.fileManager.processFrontMatter(file, (data) => {
        data.import_issues = nextList;
      });
    } finally {
      this.syncingImportIssues.delete(file.path);
    }
    return true;
  }

  async toggleImportReviewTask(file, taskIndex, checked) {
    const before = await this.app.vault.read(file);
    const parsed = parseImportReview(before);
    const task = parsed.tasks[taskIndex];
    if (!task) return;
    const after = setImportReviewTask(before, taskIndex, checked);
    if (after !== before) await this.app.vault.modify(file, after);
    await this.syncImportIssueMirror(file, parseImportReview(after));
  }

  async reviewQueue() {
    const records = [];
    for (const file of this.app.vault.getMarkdownFiles()) {
      if (!this.isWorldAnvilImport(file)) continue;
      const frontmatter = this.frontmatter(file);
      const tasks = parseImportReview(await this.app.vault.cachedRead(file)).tasks;
      if (!tasks.some((task) => !task.checked) && eraCount(frontmatter) <= 1) continue;
      const tier = priorityFor(frontmatter, file);
      records.push({
        file,
        rank: tier.rank,
        issueCount: issuesFor(frontmatter).length + (eraCount(frontmatter) > 1 ? 1 : 0),
        title: this.titleFor(file),
      });
    }
    records.sort((a, b) => a.rank - b.rank || b.issueCount - a.issueCount || a.title.localeCompare(b.title));
    return records.map((record) => record.file);
  }

  async reviewNeighbours(file) {
    const queue = await this.reviewQueue();
    const index = queue.findIndex((candidate) => candidate.path === file.path);
    if (index === -1) return { previous: null, next: queue[0] ?? null };
    return { previous: queue[index - 1] ?? null, next: queue[index + 1] ?? null };
  }

  async setControlledEra(file) {
    const frontmatter = this.frontmatter(file);
    const isEvent = frontmatter.type === 'event';
    const choices = [
      { label: 'Leave era undefined', value: '' },
      ...(isEvent ? HISTORICAL_ERAS : ERA_VALUES).map((era) => ({
        label: era,
        value: era,
        hint: era === 'Universal' ? 'Timeless / intentionally valid outside historical eras' : undefined,
      })),
    ];
    const era = await new ChoiceModal(this.app, choices, 'Choose VISCERIUM era / scope').choose();
    if (era === null) return;
    const entityId = String(frontmatter.entity_id ?? '').trim();
    if (era && entityId) {
      const family = this.entityIdRecords().filter((record) => record.file.path !== file.path && record.entityId === entityId);
      const collision = family.find((record) => record.era === era);
      if (collision) {
        new Notice(`${entityId} already has a ${era} edition at ${collision.file.path}.`, 10000);
        return;
      }
      const mixesUniversal = era === 'Universal'
        ? family.some((record) => record.era && record.era !== 'Universal')
        : family.some((record) => record.era === 'Universal');
      if (mixesUniversal) {
        new Notice(`${entityId} already uses the opposite Universal/historical continuity model. Use a different entity_id or reconcile that family first.`, 10000);
        return;
      }
    }
    await this.app.fileManager.processFrontMatter(file, (data) => {
      delete data.eras;
      if (era) data.era = era;
      else delete data.era;
    });
    new Notice(era ? `Era set to ${era}.` : 'Era cleared.');
  }

  entityIdRecords() {
    return this.app.vault.getMarkdownFiles().map((file) => {
      const frontmatter = this.frontmatter(file);
      return {
        file,
        entityId: String(frontmatter.entity_id ?? '').trim(),
        era: normaliseEra(frontmatter.era),
      };
    }).filter((record) => record.entityId);
  }

  suggestedEntityId(file) {
    const frontmatter = this.frontmatter(file);
    const existing = String(frontmatter.entity_id ?? '').trim();
    if (existing) return existing;
    const base = slugify(frontmatter.title ?? file.basename);
    const used = new Set(this.entityIdRecords().map((record) => record.entityId));
    if (!used.has(base)) return base;
    for (let code = 97; code <= 122; code += 1) {
      const candidate = `${base}-${String.fromCharCode(code)}`;
      if (!used.has(candidate)) return candidate;
    }
    let counter = 2;
    while (used.has(`${base}-${counter}`)) counter += 1;
    return `${base}-${counter}`;
  }

  async setEntityId(file) {
    const era = normaliseEra(this.frontmatter(file).era);
    const value = await new TextPromptModal(this.app, {
      title: 'Continuity entity ID',
      label: 'Stable ID',
      value: this.suggestedEntityId(file),
      placeholder: 'okse-dominion-b',
      validate: (candidate) => {
        if (!candidate) return '';
        if (!ENTITY_ID_PATTERN.test(candidate)) return 'Use lowercase kebab-case only, e.g. okse-dominion-b.';
        const family = this.entityIdRecords().filter((record) => record.file.path !== file.path && record.entityId === candidate);
        const collision = family.find((record) => era && record.era === era);
        if (collision) return `${candidate} already has a ${era} edition at ${collision.file.path}.`;
        if (era === 'Universal' && family.some((record) => record.era && record.era !== 'Universal')) {
          return `${candidate} already has historical editions; Universal must use a different entity_id.`;
        }
        if (era && era !== 'Universal' && family.some((record) => record.era === 'Universal')) {
          return `${candidate} is already used by a Universal note; historical editions need a different entity_id.`;
        }
        return '';
      },
    }).prompt();
    if (value === null) return null;
    await this.app.fileManager.processFrontMatter(file, (data) => {
      if (value) data.entity_id = value;
      else delete data.entity_id;
    });
    new Notice(value ? `Continuity ID set to ${value}.` : 'Continuity ID cleared.');
    return value;
  }

  async ensureFolder(folderPath) {
    let current = '';
    for (const segment of normalizePath(folderPath).split('/').filter(Boolean)) {
      current = current ? `${current}/${segment}` : segment;
      if (!this.app.vault.getAbstractFileByPath(current)) await this.app.vault.createFolder(current);
    }
  }

  editionDestination(file, targetEra) {
    const source = normalizePath(file.path);
    const match = source.match(/^Lore\/(?:Eras\/)?(CITADEL|SMOG|NEARSIGHT|ENTROPY)\/(.+)$/i);
    const relative = match ? match[2] : file.name;
    return normalizePath(`Drafts/Inbox/Era Editions/${targetEra}/${relative}`);
  }

  async createEraEdition(file) {
    const frontmatter = this.frontmatter(file);
    if (frontmatter.type === 'event') {
      new Notice('Events are chronological records and do not use era editions.', 8000);
      return;
    }
    const sourceEra = normaliseEra(frontmatter.era);
    if (!sourceEra || sourceEra === 'Universal') {
      new Notice('Set the current note to a historical era before creating another era edition.', 8000);
      return;
    }
    let entityId = String(frontmatter.entity_id ?? '').trim();
    if (!entityId) {
      entityId = await this.setEntityId(file);
      if (!entityId) return;
    }
    const targets = HISTORICAL_ERAS.filter((era) => era !== sourceEra).map((era) => ({ label: era, value: era }));
    const targetEra = await new ChoiceModal(this.app, targets, `Create ${entityId} edition for…`).choose();
    if (!targetEra) return;
    const existing = this.entityIdRecords().find((record) => record.entityId === entityId && record.era === targetEra);
    if (existing) {
      new Notice(`${entityId} already has a ${targetEra} edition at ${existing.file.path}.`, 10000);
      return;
    }
    let destination = this.editionDestination(file, targetEra);
    if (this.app.vault.getAbstractFileByPath(destination)) {
      const dot = destination.lastIndexOf('.');
      const stem = dot === -1 ? destination : destination.slice(0, dot);
      const extension = dot === -1 ? '' : destination.slice(dot);
      const disambiguated = `${stem} (${entityId})${extension}`;
      if (this.app.vault.getAbstractFileByPath(disambiguated)) {
        new Notice(`An era-edition draft already occupies ${destination} (and ${disambiguated}). Rename/disambiguate the source file first.`, 10000);
        return;
      }
      destination = disambiguated;
    }
    await this.ensureFolder(destination.split('/').slice(0, -1).join('/'));
    const source = await this.app.vault.read(file);
    const oldReviewPattern = new RegExp(`${REVIEW_START}[\\s\\S]*?${REVIEW_END}\\n?`, 'm');
    const body = `${source.replace(oldReviewPattern, '').trimEnd()}\n\n${reviewBlock(sourceEra, targetEra)}\n`;
    const created = await this.app.vault.create(destination, body);
    await this.app.fileManager.processFrontMatter(created, (data) => {
      data.status = 'draft';
      data.era = targetEra;
      data.entity_id = entityId;
      delete data.eras;
      delete data.publish;
      delete data.slug;
      delete data.sourcePath;
      delete data.eraStyle;
      delete data.published;
      delete data.updated;
      delete data.import_source;
      delete data.import_source_type;
      delete data.import_source_file;
      delete data.import_issues;
    });
    await this.app.workspace.getLeaf(false).openFile(created);
    new Notice(`Created ${targetEra} era edition as a draft.`);
  }
};
